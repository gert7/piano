import { Error } from "./error";
import { BoxConstraints, BoxSize } from "./geometry";
import { State } from "./state";
import { RbxComponent } from "./types";
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

	protected _parent?: Element;
	_children: Array<Element> = [];
	protected _mounted = false;
	protected _oldWidget?: Widget;
	_dirty = true;

	debugPrint(level = 0) {
		let out = "";
		for (let i = 0; i < level; i++) {
			out += " ";
		}
		out += "\\";
		out += this.widget?.typeName;
		print(out);
		for (const child of this._children) {
			child.debugPrint(level + 1);
		}
	}

	findChildWithComponent(): FoundationElement {
		print("No component here at " + this.widget?.typeName);
		return this._children[0].findChildWithComponent();
	}

	/** Collapse this element's child elements' subtrees to the first
	 *  FoundationElements that are found. */
	findChildrenWithComponents(): Array<FoundationElement> {
		return this._children.map((e) => e.findChildWithComponent());
	}

	attachComponents(parent: RbxComponent) {
		print("attachComponents");
		const children = this.findChildrenWithComponents();
		for (const c of children) {
			c.attachComponents(parent);
		}
	}

	inflateWidget(widget: Widget, index?: number): Element {
		const element = widget.createElement();
		element._parent = this;
		element.update(widget);
		index !== undefined ? (this._children[index] = element) : this._children.push(element);
		print(`Inflated ${widget.typeName}`);
		return element;
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
				if (this._children[index].widget?.typeName === widget.typeName) {
					print("Found same type widget for recycling: " + widget.typeName);
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
	component: RbxComponent;

	override findChildWithComponent(): FoundationElement {
		print("Found child with component: " + this.widget.typeName);
		return this;
	}

	layout(constraints: BoxConstraints): BoxSize {
		return this.widget._layout(this.component, constraints, this.findChildrenWithComponents());
	}

	attachComponents(parent: GuiObject) {
		this.component.Parent = parent;
		for (const child of this._children) {
			child.attachComponents(this.component);
		}
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
	}

	constructor(widget: FoundationWidget) {
		super();
		this.widget = widget;
		this.component = widget.createComponent(this);
		print("creating component");
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
