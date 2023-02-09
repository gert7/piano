import { BoxConstraints, SizeConstraints } from "./geometry";
import { Error } from "./error";
import { State } from "./state";
import {
	FoundationWidget,
	LeafChildFoundationWidget,
	MultiChildFoundationWidget,
	SingleChildFoundationWidget,
	StatefulWidget,
	StatelessWidget,
	Widget,
} from "./widget";

export abstract class Element {
	widget?: Widget;
	slot?: object;

	private _parent?: Element;
	protected _children: Array<Element> = [];
	private _mounted = false;
	protected _component?: GuiBase2d;
	protected _oldWidget?: Widget;
	protected _constraints?: BoxConstraints;
	_dirty = true;

	inflateWidget(widget: Widget, index?: number): Element {
		const element = widget.createElement();
		element._parent = this;
		element.update(widget);
		element._constraints = this._constraints;
		index !== undefined ? (this._children[index] = element) : this._children.push(element);
		return element;
	}

	specifyConstraints(constraints: BoxConstraints) {
		this._constraints = constraints;
	}

	protected constraintsFromVector2(component: Vector2) {
		this.specifyConstraints(new BoxConstraints(0.0, component.X, 0.0, component.Y));
	}

	constraints(): BoxConstraints | undefined {
		return this._constraints;
	}

	specifyGuiComponent(component?: GuiBase2d) {
		this._component = component;
	}

	traverseGuiComponent(parent: GuiBase2d): GuiBase2d | undefined {
		this.visitChildren((e) => e.traverseGuiComponent(parent));
		return;
	}

	visitChildren(callback: (e: Element) => void) {
		for (const c of this._children) {
			callback(c);
		}
	}

	update(widget: Widget) {
		this._oldWidget = this.widget;
		this.widget = widget;
		return;
	}

	unmount() {
		this._mounted = false;
	}

	updateChild(index: number, element?: Element, widget?: Widget, slot?: object): Element | undefined {
		if (this._children[index] !== undefined) {
			if (widget !== undefined) {
				if (tostring(this._children[index]) === tostring(element)) {
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
			if (widget !== undefined) {
				if (element !== undefined) {
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
	}

	override traverseGuiComponent(parent: GuiBase2d): GuiBase2d | undefined {
		const currentComponent = this._component;
		if (currentComponent === undefined) {
			const newComponent = this.widget.createComponent(this);
			this.constraintsFromVector2(newComponent.AbsoluteSize);
			newComponent.Parent = parent;
			this._component = newComponent;
			this.visitChildren((e) => e.traverseGuiComponent(newComponent));
			return this._component;
		} else {
			const firstChild = this._children[0];
			if (firstChild !== undefined) {
				return firstChild.traverseGuiComponent(currentComponent);
			} else {
				this.visitChildren((e) => e.traverseGuiComponent(currentComponent));
			}
		}
	}

	constructor(widget: FoundationWidget) {
		super();
		this.widget = widget;
	}
}

export class LeafChildFoundationElement extends FoundationElement {
	constructor(widget: LeafChildFoundationWidget) {
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

export abstract class ComponentElement extends Element {
	build(): Widget {
		throw new Error("build() not implemented for abstract class");
	}

	override update(widget: StatelessWidget | StatefulWidget): void {
		super.update(widget);
		const child = this.build();
		this.updateChild(0, undefined, child, undefined);
	}
}

export class StatelessElement extends ComponentElement {
	widget: StatelessWidget;

	constructor(widget: StatelessWidget) {
		super();
		this.widget = widget;
	}

	build(): Widget {
		return this.widget.build();
	}
}

export class StatefulElement extends ComponentElement {
	widget: StatefulWidget;
	state: State<StatefulWidget>;

	constructor(widget: StatefulWidget) {
		super();
		this.widget = widget;
		this.state = widget.createState();
	}

	override update(widget: StatefulWidget) {
		this.state.widget = widget;
		if (this._oldWidget !== undefined) {
			this.state.didUpdateWidget(this._oldWidget as StatefulWidget);
		}
		super.update(widget);
	}

	build(): Widget {
		return this.state.build();
	}
}
