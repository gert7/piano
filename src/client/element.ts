import { BoxConstraints, BoxSize } from "./geometry";
import { State } from "./state";
import { RbxComponent } from "./types";
import {
	FoundationWidget,
	LeafFoundationWidget,
	MultiChildFoundationWidget,
	SingleChildFoundationWidget,
	StatefulWidget,
	StatelessWidget,
	Widget,
} from "./widget";

export abstract class Element {
	widget?: Widget;
	slot?: object;

	_parent?: Element;
	_children: Array<Element> = [];
	protected _mounted = false;
	protected _oldWidget?: Widget;
	_dirty = true;
	owner?: RootElement;

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
			out += getmetatable(this.widget);
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
		// print("No component here at " + this.widget?.typeName);
		return this._children[0].findChildWithComponent();
	}

	connectComponentToParent(component: RbxComponent): Element | undefined {
		print("cCTP");
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
		element._parent = this;
		element.owner = this.owner;
		element.update(widget);
		index !== undefined ? (this._children[index] = element) : this._children.push(element);
		// print(`Inflated ${getmetatable(widget)}`);
		return element;
	}

	update(widget: Widget) {
		this._oldWidget = this.widget;
		this.widget = widget;
		return;
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
					print(
						`${this._children[index].widgetName()} will be replaced with ${getmetatable(
							widget,
						)}`,
					);
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
		this.owner?.addToRebuild(this);
	}

	rebuild() {
		this._dirty = false;
	}

	mounted() {
		return this._mounted;
	}

	constructor(widget?: Widget) {
		this.widget = widget;
	}
}

export type BuildContext = Element;

export class FoundationElement extends Element {
	widget: FoundationWidget;
	component: RbxComponent;
	constraints?: BoxConstraints;
	connections: Map<string, RBXScriptConnection> = new Map();
	componentParentElement?: Element;

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

	override update(widget: Widget): void {
		super.update(widget);
		this.widget.updateComponent(this, this.component);
		// if (this.constraints) {
		// print("Layout");
		// this.layout(this.constraints);
		// }
		if (this._parent && !this.componentParentElement) {
			this.component.Name = this.widgetName();
			this.componentParentElement = this._parent.connectComponentToParent(this.component);
		}
	}

	layout(constraints: BoxConstraints): BoxSize {
		// print(`Layout on ${this.widgetName()}`);
		this.constraints = constraints;
		return this.widget._layout(this.component, constraints, this.findChildrenWithComponents());
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

	override attachComponents(parent: GuiObject) {
		print(`attachComponents called on ${this.widgetName()}`);
		this.component.Parent = parent;
		for (const child of this._children) {
			child.attachComponents(this.component);
		}
	}

	override unmount(): void {
		super.unmount();
		for (const [_, conn] of this.connections) {
			conn.Disconnect();
		}
		this.component.Destroy();
	}

	updateChildren(newChildren: Array<Widget>, slots?: Array<object>) {
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

export class LeafFoundationElement extends FoundationElement {
	constructor(widget: LeafFoundationWidget) {
		super(widget);
		this.widget = widget;
	}
}

export class SingleChildFoundationElement extends FoundationElement {
	override update(widget: SingleChildFoundationWidget): void {
		super.update(widget);
		this.updateChild(0, undefined, widget.child(), undefined);
	}

	constructor(widget: SingleChildFoundationWidget) {
		super(widget);
		this.widget = widget;
	}
}

export class MultiChildFoundationElement extends FoundationElement {
	override update(widget: MultiChildFoundationWidget): void {
		super.update(widget);
		this.updateChildren(widget.children(), undefined);
	}

	constructor(widget: MultiChildFoundationWidget) {
		super(widget);
		this.widget = widget;
	}
}

/** Element superclass for Widgets that *compose* other widgets. Composing
 * Widgets are Widgets with a `build()` method.
 */
export abstract class ComposingElement extends Element { }

export class StatelessElement extends ComposingElement {
	widget: StatelessWidget;

	override update(widget: StatelessWidget): void {
		super.update(widget);
		this.rebuild();
	}

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

export class StatefulElement extends ComposingElement {
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
		this.state.widget = widget;
		if (this._oldWidget) {
			this.state.didUpdateWidget(this._oldWidget as StatefulWidget);
		}
		this.rebuild();
		super.update(widget);
	}

	override rebuild() {
		if (!this._dirty) return;
		const child = this.state.build(this);
		this.updateChild(0, undefined, child, undefined);
		super.rebuild();
	}

	override unmount(): void {
		this.state.dispose();
	}
}

export class RootElement extends Element {
	eventHandler?: (_: string) => void;
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
		this._children[0]._parent = this;
		this._children[0].owner = this;
	}

	addToRebuild(element: Element) {
		this.elementsToRebuild.add(element);
	}

	removeFromRebuild(element: Element) {
		this.elementsToRebuild.delete(element);
	}

	manageTree(deltaTime: number, force = false) {
		if (this.timePassed > this.interval || force) {
			this.timePassed = 0.0;
			for (const element of this.elementsToRebuild) {
				if (element && element._dirty) {
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
		} else {
			this.timePassed += deltaTime;
		}
	}

	constructor(eventHandler: (event: string) => void) {
		super();
		this.eventHandler = eventHandler;
		const runService = game.GetService("RunService");
		runService.PreRender.Connect((d) => this.manageTree(d));
	}
}
