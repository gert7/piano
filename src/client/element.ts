/**
 * An element is the persistent, *real* state of a {@link Widget} that exists
 * for as long as a Widget of the same type occupies the same exact position in
 * the Element tree between rebuilds.
 *
 * If a Widget of a different type is in the same position, the old Element will
 * be unmounted, disposed, and replaced with a new one.
 * @module
 */
import { Error } from "./error";
import { BoxConstraints, BoxSize } from "./geometry";
import { Provider } from "./provider";
import { State } from "./state";
import { RbxComponent } from "./types";
import {
	FoundationWidget,
	InheritedWidget,
	// InheritedWidget,
	ProxyWidget,
	StatefulWidget,
	StatelessWidget,
	Widget,
} from "./widget";
import { HookWidget } from "./widget";

/** The basis for finding a Provider to subscribe to, either by giving the
 * Provider itself, or a typename that will be searched for by traversing the
 * Element tree upwards.
 */
export type ProviderName<T, A> = Provider<T, A> | (new (...args: any[]) => InheritedWidget<T, A>);

/** An element is the persistent, real state of a {@link Widget}. It forms
 * part of the Element tree, and has a lifecycle.
 */
export abstract class Element {
	widget?: Widget;
	slot?: object;

	protected _parent?: Element;
	_children: Array<Element> = [];
	protected _mounted = false;
	protected _oldWidget?: Widget;
	protected _dirty = true;
	/** Returns whether the Element is currently marked for rebuild. */
	isDirty() {
		return this._dirty;
	}
	private _owner?: RootElement;
	// owner(): RootElement | undefined {
	// 	return this._owner;
	// }

	/** Attempts to return the name of the Widget, or "Unknown widget" if the
	 * Widget is null */
	widgetName(): string {
		if (this.widget) {
			return `${getmetatable(this.widget)}`;
		} else {
			return "Unknown Widget";
		}
	}

	/** Recursively prints a tree of itself and its children.
	 *
	 * @param level The nesting level of this Element that will
	 * be represented using whitespace.
	 */
	debugPrint(level = 0) {
		let out = "";
		for (let i = 0; i < level; i++) {
			out += " ";
		}
		out += "/";
		if (this.widget) {
			out += this.widgetName();
		} else {
			out += "Unknown widget?";
		}
		print(out);
		for (const child of this._children) {
			child.debugPrint(level + 1);
		}
	}

	/** If the Element has a Roblox Component, returns itself,
	 * otherwise traverses down the tree.
	 */
	findChildWithComponent(): FoundationElement {
		const child = this._children[0];
		if (!child) throw new Error(`No child component at ${this.widgetName()}`);
		return this._children[0].findChildWithComponent();
	}

	/** Climbs up the tree and calls the same method on its parent, until an
	 * overload of this method (such as on {@link FoundationElement}) will
	 * connect the Roblox component to a higher component. */
	connectComponentToParent(component: RbxComponent): Element | undefined {
		return this._parent?.connectComponentToParent(component);
	}

	/** Collapse this element's child elements' subtrees to the first
	 *  FoundationElements that are found. */
	findChildrenWithComponents(): Array<FoundationElement> {
		return this._children.map((e) => e.findChildWithComponent());
	}

	/** Traverse down the element tree and attach RbxComponents when
	 * the parent is known.
	 */
	attachComponents(parent: RbxComponent) {
		// print("attachComponents");
		const children = this.findChildrenWithComponents();
		for (const c of children) {
			c.attachComponents(parent);
		}
	}

	/** Creates a new Element from a {@link Widget}, sets this Element as its
	 * parent, updates it and places it in this Element's child list at the `index`.
	 */
	inflateWidget(widget: Widget, index?: number): Element {
		const element = widget.createElement();
		element.mount(this);
		element.update(widget);
		index !== undefined ? (this._children[index] = element) : this._children.push(element);
		// print(`Inflated ${getmetatable(widget)}`);
		return element;
	}

	/** Updates the Widget at this Element, moves the old widget to _oldWidget,
	 * and rebuilds itself.
	 */
	update(widget: Widget) {
		this._oldWidget = this.widget;
		this.widget = widget;
		this.rebuild();
		return;
	}

	/** Sets this element's parent, build owner and sets it as mounted. */
	mount(parent: Element, owner?: RootElement) {
		this._parent = parent;
		this._owner = owner ? owner : parent._owner;
		this._mounted = true;
	}

	/** Resets this Element's `_mounted` to `false` and recursively unmounts
	 * all of its children as well.
	 */
	unmount() {
		this._mounted = false;
		// print(`Unmounted ${this.widgetName()}`);
		for (const child of this._children) {
			child.unmount();
		}

		// for (const [provider, _selector] of this.providers) {
		// 	provider.removeDependent(this);
		// }
	}

	updateChild(
		index: number,
		element?: Element,
		widget?: Widget,
		slot?: object,
	): Element | undefined {
		if (this._children[index] && this._children[index].widget) {
			if (widget) {
				if (getmetatable(this._children[index].widget!) === getmetatable(widget)) {
					// print(`Found same type widget for recycling: ${getmetatable(widget)}`);
					this._children[index].update(widget);
				} else {
					// print(
					// 	`${this._children[index].widgetName()} will be replaced with ${getmetatable(
					// 		widget,
					// 	)}`,
					// );
					this._children[index].unmount();
					this.inflateWidget(widget, index);
				}
				return this._children[index];
			} else {
				this._children[index].unmount();
			}
		} else {
			if (widget) {
				if (element) {
					this._children[index] = element;
				} else {
					this.inflateWidget(widget, index);
				}
				return this._children[index];
			} else {
				return;
			}
		}
	}

	/** Marks this Element as `_dirty` and adds it to its build owner's
	 * set of elements to rebuild.
	 */
	markRebuild() {
		this._dirty = true;
		this._owner?.addToRebuild(this);
	}

	/** Performs whatever actions are necessary to rebuild this Element, such as
	 * calling `build()` if it represents a {@link StatelessWidget} or
	 * {@link HookWidget} or updating and laying out a component if it
	 * represents a {@link FoundationWidget}. By default will also reset `_dirty`
	 * to `false`.
	 */
	rebuild() {
		this._dirty = false;
	}

	/** Returns `true` if the Element is set as mounted. */
	isMounted() {
		return this._mounted;
	}

	private _findInheritedWidgetInAncestors<T, A>(
		cons: new (...args: any[]) => InheritedWidget<T, A>,
	): Provider<T, A> {
		let current = this._parent;
		for (; ;) {
			if (!current) {
				throw new Error(`Provider ${cons} not found in ancestors`);
			} else if (current instanceof InheritedElement && current.widget instanceof cons) {
				return current as Provider<T, A>;
			} else {
				current = current?._parent;
			}
		}
	}

	private _resolveProvider<T, A>(pName: ProviderName<T, A>): Provider<T, A> {
		if (typeOf(pName) === "function") {
			const cons = pName as new (...args: any[]) => InheritedWidget<T, A>;
			const element = this._findInheritedWidgetInAncestors(cons);
			return element;
		} else {
			return pName as Provider<T, A>;
		}
	}

	private providers: Map<Provider<any, any>, Selector<any>> = new Map();

	/** Reads a value from a Provider, either directly or by traversing up the
	 * tree to find a Provider of the given type.
	 *
	 * @param pName Either a Provider, or a type of Provider to be found by
	 * traversing up the Element tree.
	 */
	read<T, A>(pName: ProviderName<T, A>, aspect?: A): T {
		const provider = this._resolveProvider(pName);
		const providerA = provider as Provider<T, A>;
		return providerA.value(aspect);
	}

	watch<T, A>(pName: ProviderName<T, A>, aspect?: A): T {
		const provider = this._resolveProvider(pName);
		this.providers.set(provider, () => true);
		provider.updateDependent(this, aspect);
		return provider.value(aspect);
	}

	select<T, A>(
		pName: ProviderName<T, A>,
		_: {
			aspect?: A;
			selector: Selector<T>;
		},
	): T {
		const provider = this._resolveProvider(pName);
		this.providers.set(provider, _.selector);
		provider.updateDependent(this, _.aspect);
		return provider.value(_.aspect);
	}

	announceDependencyChange<T>(dependency: Provider<T>) {
		const selector = this.providers.get(dependency);
		if (selector && selector(dependency.value(), dependency.oldValue())) {
			this.markRebuild();
		} else {
			print(
				`Error: Provider change announced on Element that isn't subscribed to this Provider at ${this.widgetName()}.`,
			);
		}
	}

	constructor(widget?: Widget) {
		this.widget = widget;
	}
}

export type BuildContext = Element;

export class FoundationElement extends Element {
	widget: FoundationWidget;
	private component: RbxComponent;
	constraints?: BoxConstraints;
	connections: Map<string, RBXScriptConnection> = new Map();
	componentParentElement?: Element;

	/** The Position of the Roblox component. */
	position(): Vector2 {
		return new Vector2(this.component.Position.X.Offset, this.component.Position.Y.Offset);
	}

	/** Sets the Position of the Roblox component. */
	setPosition(position: UDim2) {
		this.component.Position = position;
	}

	removeConnection(key: string): boolean {
		const existing = this.connections.get(key);
		if (existing) {
			existing.Disconnect();
			return this.connections.delete(key);
		} else {
			return false;
		}
	}

	setConnection(key: string, conn: RBXScriptConnection) {
		this.removeConnection(key);
		this.connections.set(key, conn);
	}

	override findChildWithComponent(): FoundationElement {
		// print("Found child with component: " + this.widgetName());
		return this;
	}

	override connectComponentToParent(component: RbxComponent): Element | undefined {
		// print("cCTP Foundation");
		component.Parent = this.component;
		return this;
	}

	override update(widget: FoundationWidget): void {
		super.update(widget);
		const couldUpdate = this.widget.updateComponent(this, this.component, this._oldWidget);
		// if (!couldUpdate) {
		// 	const oldComponent = this.component;
		// 	this.component = this.widget.createComponent(this);
		// 	this.attachChildren();
		// 	this._parent?.connectComponentToParent(this.component);
		// 	oldComponent.Destroy();
		// }
		// TODO: Recreate Component if updateComponent fails
		this.updateChildren(widget.children(), undefined);
		// if (this.constraints) {
		// print("Layout");
		// this.layout(this.constraints);
		// }
		if (this._parent && !this.componentParentElement) {
			this.component.Name = this.widgetName();
			this.componentParentElement = this._parent.connectComponentToParent(this.component);
		}
	}

	layout(constraints: BoxConstraints) {
		// print(`Layout on ${this.widgetName()}`);
		this.constraints = constraints;
		this.widget._layout(this.component, constraints, this.findChildrenWithComponents());
	}

	size(): BoxSize {
		return this.widget._size(this.component);
	}

	override rebuild(): void {
		if (!this._dirty) return;
		// if (this.constraints) {
		// 	this.layout(this.constraints);
		// }
		super.rebuild();
	}

	// /** Traverse up the Element tree and attach the RbxComponent
	//  * to the closest RbxComponent in the tree.
	//  */
	// attachComponentToParent() {
	// 	if (!this._parent) return;
	// 	let element = this._parent;
	// 	for (; ;) {
	// 		if (element instanceof FoundationElement) {
	// 			element.
	// 		}
	// 	}
	// }

	/** Attach all children to the component. */
	attachChildren() {
		for (const child of this._children) {
			child.attachComponents(this.component);
		}
	}

	override attachComponents(parent: GuiObject) {
		// print(`attachComponents called on ${this.widgetName()}`);
		this.component.Parent = parent;
		this.attachChildren();
	}

	override unmount(): void {
		super.unmount();
		for (const [_, conn] of this.connections) {
			conn.Disconnect();
		}
		this.component.Destroy();
	}

	updateChildren(newChildren?: Array<Widget>, slots?: Array<object>) {
		if (newChildren === undefined) return;
		for (let i = 0; i < newChildren.size(); i++) {
			const slot = slots ? slots[i] : undefined;
			this.updateChild(i, undefined, newChildren[i], slot);
		}
		const toRemove = this._children.size() - newChildren.size();
		for (let i = 0; i < toRemove; i++) {
			const element = this._children.pop();
			element?.unmount();
		}
		// for (const child of this._children) {
		// 	child.attachComponents(this.component);
		// }
	}

	constructor(widget: FoundationWidget) {
		super();
		this.widget = widget;
		this.component = widget.createComponent(this);
	}
}

export class StatelessElement extends Element {
	widget: StatelessWidget;

	// override update(widget: StatelessWidget): void {
	// 	super.update(widget);
	// 	this.rebuild();
	// }

	override rebuild() {
		if (!this._dirty) return;
		const child = this.widget.build(this);
		this.updateChild(0, undefined, child, undefined);
		super.rebuild();
	}

	constructor(widget: StatelessWidget) {
		super();
		this.widget = widget;
	}
}

export class StatefulElement extends Element {
	widget: StatefulWidget;
	state: State<StatefulWidget>;

	constructor(widget: StatefulWidget) {
		super();
		this.widget = widget;
		this.state = this.widget.createState();
		this.state.widget = this.widget;
		this.state._element = this;
		this.state.initState();
	}

	override update(widget: StatefulWidget) {
		super.update(widget);
		this.state.widget = widget;
		if (this._oldWidget) {
			this.state.didUpdateWidget(this._oldWidget as StatefulWidget);
		}
		this.rebuild();
	}

	override rebuild() {
		if (!this._dirty) return;
		// print("StatefulElement rebuild()");
		const child = this.state.build(this);
		this.updateChild(0, undefined, child, undefined);
		super.rebuild();
	}

	override unmount(): void {
		this.state.dispose();
	}
}

export class ProxyElement extends Element {
	widget: ProxyWidget;

	override update(widget: ProxyWidget): void {
		super.update(widget);
		this.updateChild(0, undefined, widget.child, undefined);
		this._children[0].update(widget.child);
		this._children[0].markRebuild();
	}

	override rebuild(): void {
		if (!this._dirty) return;
		const child = this.widget.child;
		this.updateChild(0, undefined, child, undefined);
		super.rebuild();
	}

	constructor(widget: ProxyWidget) {
		super();
		this.widget = widget;
	}
}


export class RootElement extends Element {
	// TODO: Use
	eventHandler?: (event: string) => void;
	elementsToRebuild: Set<Element> = new Set();
	timePassed = 0.0;
	interval = 0.016;

	override debugPrint(level = 0) {
		print("Root");
		for (const child of this._children) {
			child.debugPrint(level + 1);
		}
	}

	appendToRoot(element: Element) {
		this._children[0] = element;
		this._children[0].mount(this, this);
	}

	addToRebuild(element: Element) {
		this.elementsToRebuild.add(element);
	}

	removeFromRebuild(element: Element) {
		this.elementsToRebuild.delete(element);
	}

	manageTreeLoop(deltaTime?: number) {
		for (const element of this.elementsToRebuild) {
			if (element && element.isDirty()) {
				element.rebuild();
			} else {
				continue;
			}
			const withComponent = element?.findChildWithComponent();
			const constraints = withComponent?.constraints;
			if (constraints) {
				withComponent?.layout(constraints);
			}
		}
		this.elementsToRebuild.clear();
		wait(deltaTime);
	}

	constructor(eventHandler: (event: string) => void) {
		super();
		this.eventHandler = eventHandler;
		const runService = game.GetService("RunService");
		runService.PreRender.Connect((d) => this.manageTreeLoop(d));
	}
}

export type Selector<T> = (newValue: T, oldValue?: T) => boolean;

export class InheritedElement<T, A = void> extends ProxyElement implements Provider<T, A> {
	widget: InheritedWidget<T, A>;

	private dependents: Map<Element, A | false> = new Map();

	updateDependent(element: Element, aspect?: A) {
		// print("Adding to dependents: " + element.widgetName());
		this.dependents.set(element, aspect ?? false);
	}

	removeDependent(element: Element) {
		this.dependents.delete(element);
	}

	value(aspect?: A): T {
		return this.widget.value();
	}

	oldValue(): T | undefined {
		if (this._oldWidget === undefined) return;
		const oldWidget = this._oldWidget as InheritedWidget<T, A>;
		return oldWidget.value();
	}

	override update(widget: InheritedWidget<T, A>): void {
		super.update(widget);
		const shouldNotify = this.widget.updateShouldNotify(
			this._oldWidget as InheritedWidget<T, A>,
		);
		if (shouldNotify) {
			// print("shouldNotify");
			for (const [element, aspect] of this.dependents) {
				// print("shouldNotify" + element.widgetName());
				// task.defer(() => element.markRebuild());
				task.defer(() => element.announceDependencyChange(this));
			}
		}
	}

	constructor(widget: InheritedWidget<T, A>) {
		super(widget);
		this.widget = widget;
	}
}