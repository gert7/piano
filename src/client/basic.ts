import { BuildContext, Element, FoundationElement } from "./element";
import { BoxConstraints, BoxSize, EdgeInsets } from "./geometry";
import { RbxComponent } from "./types";
import { LeafChildFoundationWidget, MultiChildFoundationWidget, SingleChildFoundationWidget, Widget } from "./widget";

export class TextWidget extends LeafChildFoundationWidget {
	typeName = "TextWidget";

	text: string;

	constructor(text: string) {
		super();
		this.text = text;
	}

	override createComponent(context: BuildContext): RbxComponent {
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

export class BaseFrame extends SingleChildFoundationWidget {
	typeName = "BaseFrame";

	override _layout(frame: RbxComponent, constraints: BoxConstraints, children: Array<FoundationElement>): BoxSize {
		return expandRbxComponentToConstraints(frame, constraints);
	}

	override createComponent(context: BuildContext): Frame {
		const frame = new Instance("Frame");
		frame.BackgroundTransparency = 1.0;
		frame.Size = new UDim2(0, 1, 0, 1);
		return frame;
	}
}

export class MultiChildBaseFrame extends MultiChildFoundationWidget {
	typeName = "MultiChildBaseFrame";

	override _layout(frame: RbxComponent, constraints: BoxConstraints, children: Array<FoundationElement>): BoxSize {
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
	typeName = "Padding";

	private edgeInsets: EdgeInsets;

	override _layout(frame: RbxComponent, constraints: BoxConstraints, children: FoundationElement[]): BoxSize {
		let newWidth = frame.Size.Width.Offset;
		let newHeight = frame.Size.Width.Offset;
		if (constraints) {
			if (constraints.maxWidth !== "Infinity") {
				newWidth = constraints.maxWidth - (this.edgeInsets.start + this.edgeInsets.end);
				if (newWidth < 0) {
					print("Warning: 0-width Padding");
					newWidth = 0;
				}
			}
			if (constraints.maxHeight !== "Infinity") {
				newHeight = constraints.maxHeight - (this.edgeInsets.top + this.edgeInsets.bottom);
				if (newHeight < 0) {
					print("Warning: 0-height Padding");
					newHeight = 0;
				}
			}
		} else {
			print("Error: No constraints received from element at Padding");
		}
		frame.Size = new UDim2(0, newWidth, 0, newHeight);
		frame.Position = new UDim2(0, this.edgeInsets.start, 0, this.edgeInsets.top);
		children.forEach((c) => c.layout(BoxConstraints.fromVec2(frame.AbsoluteSize)));
		return frame.AbsoluteSize;
	}

	constructor(_: { child: Widget; edgeInsets: EdgeInsets }) {
		super();
		this._child = _.child;
		this.edgeInsets = _.edgeInsets;
	}
}

export class Row extends MultiChildBaseFrame {
	override typeName = "Row";

	spreadEvenly = false;
	desiredSpace = 8.0;

	override _layout(frame: GuiObject, constraints: BoxConstraints, children: FoundationElement[]): BoxSize {
		print("Row layout");
		const selfSize = super._layout(frame, constraints, children);
		const totalWidth = selfSize.X;
		let childWidths = 0;
		print("Childrens" + children.size());
		const evenDivide = constraints.clone();
		evenDivide.maxWidth = constraints.maxWidthN() / children.size();
		for (const child of children) {
			const size = child.layout(evenDivide);
			childWidths += size.X;
		}
		const spacing = (totalWidth - childWidths) / (children.size() + 1);
		let x = spacing;
		for (const child of children) {
			const y = child.component.Position.Y.Offset;
			child.component.Position = new UDim2(0, x, 0, y);
			x += child.component.AbsoluteSize.X;
			x += spacing;
		}
		return selfSize;
	}

	constructor(_: { children: Array<Widget>; spreadEvenly?: boolean }) {
		super(_.children);
		this.spreadEvenly = _.spreadEvenly ?? this.spreadEvenly;
	}
}
