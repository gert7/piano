import { Error } from "./error";
import { BoxConstraints, BoxSize } from "./geometry";
import { State } from "./state";
import { RbxComponent } from "./types";
import {
	FoundationWidget,
	HookWidget,
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

	/** Collapse this element's child elements' subtrees to the first
	 *  FoundationElements that are found. */
	findChildrenWithComponents(): Array<FoundationElement> {
		return this._children.map((e) => e.findChildWithComponent());
	}

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
		print(`Inflated ${getmetatable(widget)}`);
		return element;
	}

	update(widget: Widget) {
		this._oldWidget = this.widget;
		this.widget = widget;
		return;
	}

	unmount() {
		this._mounted = false;
		print(`Unmounted ${this.widgetName()}`);
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
					print(`Found same type widget for recycling: ${this.widgetName()}`);
					this._children[index].update(widget);
				} else {
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
		print("Found child with component: " + this.widgetName());
		return this;
	}

	update(widget: Widget): void {
		super.update(widget);
		this.widget.updateComponent(this, this.component);
		if (this.constraints) {
			print("Layout");
			this.layout(this.constraints);
		}
	}

	layout(constraints: BoxConstraints): BoxSize {
		this.constraints = constraints;
		return this.widget._layout(this.component, constraints, this.findChildrenWithComponents());
	}

	override rebuild(): void {
		if (!this._dirty) return;
		if (this.constraints) {
			this.layout(this.constraints);
		}
		super.rebuild();
	}

	override attachComponents(parent: GuiObject) {
		this.component.Parent = parent;
		for (const child of this._children) {
			child.attachComponents(this.component);
		}
	}

	unmount(): void {
		super.unmount();
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
		for (const child of this._children) {
			child.attachComponents(this.component);
		}
	}

	constructor(widget: FoundationWidget) {
		super();
		this.widget = widget;
		this.component = widget.createComponent(this);
		print("creating component");
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
	elementsToRebuild: Array<Element> = [];
	timePassed = 0.0;
	interval = 0.016;

	debugPrint(level = 0) {
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
		this.elementsToRebuild.push(element);
	}

	manageTree(deltaTime: number) {
		if (this.timePassed > this.interval) {
			this.timePassed = 0.0;
			while (!this.elementsToRebuild.isEmpty()) {
				const element = this.elementsToRebuild.pop();
				if (element && element._dirty) {
					element.rebuild();
				}
				const withComponent = element?.findChildWithComponent();
				const constraints = withComponent?.constraints;
				if (constraints) {
					withComponent?.layout(constraints);
				}
			}
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
