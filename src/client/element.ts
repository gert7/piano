import { Error } from "./error";
import { BoxConstraints, BoxSize } from "./geometry";
import { State } from "./state";
import { RbxComponent } from "./types";
import {
	FoundationWidget,
	InheritedWidget,
	ProxyWidget,
	StatefulWidget,
	StatelessWidget,
	Widget,
} from "./widget";

export abstract class Element {
	widget?: Widget;
	slot?: object;

	protected _parent?: Element;
	_children: Array<Element> = [];
	protected _mounted = false;
	protected _oldWidget?: Widget;
	protected _dirty = true;
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
			return "Unknown widget";
		}
	}

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

	connectComponentToParent(component: RbxComponent): Element | undefined {
		// print("cCTP");
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

	mount(parent: Element, owner?: RootElement) {
		this._parent = parent;
		this._owner = owner ? owner : parent._owner;
		this._mounted = true;
	}

	unmount() {
		this._mounted = false;
		// print(`Unmounted ${this.widgetName()}`);
		for (const child of this._children) {
			child.unmount();
		}
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

	markRebuild() {
		this._dirty = true;
		this._owner?.addToRebuild(this);
	}

	rebuild() {
		this._dirty = false;
	}

	mounted() {
		return this._mounted;
	}

	_findInheritedWidgetElement<T>(
		cons: new (...args: any[]) => InheritedWidget<T>,
		aspect?: object,
	): InheritedElement<T> {
		let current = this._parent;
		for (; ;) {
			if (!current) {
				throw new Error(`InheritedWidget ${cons} not found in ancestors`);
			} else if (current instanceof InheritedElement && current.widget instanceof cons) {
				return current as InheritedElement<T>;
			} else {
				current = current?._parent;
			}
		}
	}

	watch<T>(cons: new (...args: any[]) => InheritedWidget<T>, aspect?: object): T {
		const element = this._findInheritedWidgetElement(cons, aspect);
		element.updateDependents(this, aspect);
		return element.widget.value();
	}

	read<T>(cons: new (...args: any[]) => InheritedWidget<T>, aspect?: object): T {
		const element = this._findInheritedWidgetElement(cons, aspect);
		return element.widget.value();
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

	position(): Vector2 {
		return new Vector2(this.component.Position.X.Offset, this.component.Position.Y.Offset);
	}

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

	/** Traverse up the Element tree and attach the RbxComponent
	 * to the closest RbxComponent in the tree.
	 */
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

export class InheritedElement<T> extends ProxyElement {
	widget: InheritedWidget<T>;

	private dependents: Map<Element, object | boolean> = new Map();

	updateDependents(element: Element, aspect?: object) {
		// print("Adding to dependents: " + element.widgetName());
		this.dependents.set(element, aspect ?? false);
	}

	override update(widget: InheritedWidget<T>): void {
		super.update(widget);
		const shouldNotify = this.widget.updateShouldNotify(this._oldWidget as InheritedWidget<T>);
		if (shouldNotify) {
			// print("shouldNotify");
			for (const [element, aspect] of this.dependents) {
				// print("shouldNotify" + element.widgetName());
				element.markRebuild();
			}
		}
	}

	constructor(widget: InheritedWidget<T>) {
		super(widget);
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
