import { BuildContext, Element, FoundationElement } from "./element";
import { BoxConstraints, BoxSize, EdgeInsets } from "./geometry";
import { RbxComponent } from "./types";
import { FoundationWidget, Widget } from "./widget";

export class TextWidget extends FoundationWidget {
	text: string;

	constructor(text: string) {
		super([]);
		this.text = text;
	}

	override createComponent(context: BuildContext): RbxComponent {
		// print("createComponent on TextWidget");
		const text = new Instance("TextLabel");
		text.Text = this.text;
		text.BackgroundTransparency = 1.0;
		text.Size = new UDim2(0, 1, 0, 1);
		text.Position = new UDim2(0, 0, 0, 0);
		text.AutomaticSize = Enum.AutomaticSize.XY;
		return text;
	}
}

export function expandRbxComponentToConstraints(
	component: RbxComponent,
	constraints: BoxConstraints,
	width = true,
	height = true,
): BoxSize {
	let newWidth = component.Size.Width.Offset;
	let newHeight = component.Size.Width.Offset;
	if (width && constraints.maxWidth !== "Infinity") {
		newWidth = constraints.maxWidth;
	}
	if (height && constraints.maxHeight !== "Infinity") {
		newHeight = constraints.maxHeight;
	}
	component.Size = new UDim2(0, newWidth, 0, newHeight);
	return component.AbsoluteSize;
}

export class BaseFrame extends FoundationWidget {
	override _layout(
		frame: RbxComponent,
		constraints: BoxConstraints,
		children: Array<FoundationElement>,
	): BoxSize {
		return expandRbxComponentToConstraints(frame, constraints);
	}

	override createComponent(context: BuildContext): ScrollingFrame {
		const frame = new Instance("ScrollingFrame");
		frame.BackgroundTransparency = 1;
		frame.Size = new UDim2(0, 1, 0, 1);
		frame.ScrollBarThickness = 0;
		frame.ScrollingEnabled = false;
		frame.BorderMode = Enum.BorderMode.Inset;
		return frame;
	}
}

export class MultiChildBaseFrame extends FoundationWidget {
	override _layout(
		frame: RbxComponent,
		constraints: BoxConstraints,
		children: Array<FoundationElement>,
	): BoxSize {
		let newWidth = frame.Size.Width.Offset;
		let newHeight = frame.Size.Height.Offset;
		if (constraints.maxWidth !== "Infinity") {
			newWidth = constraints.maxWidth;
		}
		if (constraints.maxHeight !== "Infinity") {
			newHeight = constraints.maxHeight;
		}
		frame.Size = new UDim2(0, newWidth, 0, newHeight);
		return frame.AbsoluteSize;
	}

	override createComponent(context: BuildContext): Frame {
		const frame = new Instance("Frame");
		frame.BackgroundTransparency = 1.0;
		frame.Size = new UDim2(0, 1, 0, 1);
		return frame;
	}
}

export class Padding extends BaseFrame {
	private edgeInsets: EdgeInsets;

	override _layout(
		frame: RbxComponent,
		constraints: BoxConstraints,
		children: FoundationElement[],
	): BoxSize {
		let newWidth = frame.Size.Width.Offset;
		let newHeight = frame.Size.Width.Offset;
		if (constraints) {
			if (constraints.maxWidth !== "Infinity") {
				newWidth = constraints.maxWidth - (this.edgeInsets.start + this.edgeInsets.ending);
				if (newWidth < 0) {
					// print("Warning: 0-width Padding");
					newWidth = 0;
				}
			}
			if (constraints.maxHeight !== "Infinity") {
				newHeight = constraints.maxHeight - (this.edgeInsets.top + this.edgeInsets.bottom);
				if (newHeight < 0) {
					// print("Warning: 0-height Padding");
					newHeight = 0;
				}
			}
		} else {
			print("Error: No constraints received from element at Padding");
		}
		frame.Size = new UDim2(0, newWidth, 0, newHeight);
		frame.Position = new UDim2(0, this.edgeInsets.start, 0, this.edgeInsets.top);
		const absSize = frame.AbsoluteSize;
		const childConstraint = BoxConstraints.fromVector2(
			new Vector2(absSize.X - 2, absSize.Y - 2),
		);
		children.forEach((c) => c.layout(childConstraint));
		// children.forEach(
		// 	(c) => (c.component.Position = c.component.Position.add(new UDim2(0, 1, 0, 1))),
		// );
		return frame.AbsoluteSize;
	}

	constructor(params: { child: Widget; edgeInsets: EdgeInsets }) {
		super([params.child]);
		this.edgeInsets = params.edgeInsets;
	}
}

export class Row extends MultiChildBaseFrame {
	spreadEvenly = false;
	desiredSpace = 8.0;

	override _layout(
		frame: GuiObject,
		constraints: BoxConstraints,
		children: FoundationElement[],
	): BoxSize {
		const selfSize = super._layout(frame, constraints, children);
		const totalWidth = selfSize.X;
		let childWidths = 0;
		const evenDivide = constraints.clone();
		evenDivide.maxWidth = constraints.maxWidthN() / children.size();
		const sizes: Vector2[] = [];
		for (const child of children) {
			const size = child.layout(evenDivide);
			sizes.push(size);
			childWidths += size.X;
		}
		const spacing = (totalWidth - childWidths) / (children.size() + 1);
		let x = spacing;
		children.forEach((child, i) => {
			child.setPosition(new UDim2(0, x, 0, child.position().Y));
			x += sizes[i].X;
			x += spacing;
		});
		return selfSize;
	}

	constructor(params: { children: Array<Widget>; spreadEvenly?: boolean }) {
		super(params.children);
		this.spreadEvenly = params.spreadEvenly ?? this.spreadEvenly;
	}
}

export class RobloxComponentWidget extends FoundationWidget {
	createElement(): Element {
		return new FoundationElement(this);
	}

	override createComponent(context: Element): GuiObject {
		return this.component;
	}

	_layout(component: GuiObject, constraints: BoxConstraints, _: FoundationElement[]): Vector2 {
		if (this.layout) {
			return expandRbxComponentToConstraints(component, constraints);
		}
		return constraints.toVector2();
	}

	component: GuiObject;
	layout: boolean;

	constructor(component: GuiObject, layout = false) {
		super();
		this.component = component;
		this.layout = layout;
	}
}
