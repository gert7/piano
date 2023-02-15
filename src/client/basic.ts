import { BuildContext, Element, FoundationElement } from "./element";
import {
	BoxConstraints,
	BoxSize,
	clampToConstraints,
	Direction,
	EdgeInsets,
	mainAxisValue,
	udim2Vector2,
} from "./geometry";
import { RbxComponent } from "./types";
import { FoundationWidget, Widget } from "./widget";

export class TextWidget extends FoundationWidget {
	_layout(
		component: GuiObject,
		constraints: BoxConstraints,
		children: FoundationElement[],
	): void { }
	text: string;

	constructor(text: string) {
		super();
		this.text = text;
	}

	override updateComponent(
		context: BuildContext,
		component: TextLabel,
		oldWidget?: Widget,
	): boolean {
		component.Text = this.text;
		return true;
	}

	_size(component: RbxComponent): BoxSize {
		return component.AbsoluteSize;
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

function getRelativeSize(component: RbxComponent): [number, number] {
	const size = component.Size;
	return [size.X.Offset, size.Y.Offset];
}

export function expandRbxComponentToConstraints(
	component: RbxComponent,
	constraints: BoxConstraints,
	width = true,
	height = true,
): BoxSize {
	let [newWidth, newHeight] = getRelativeSize(component);
	if (width && constraints.maxWidth !== "Infinity") {
		newWidth = constraints.maxWidth;
	}
	if (height && constraints.maxHeight !== "Infinity") {
		newHeight = constraints.maxHeight;
	}
	component.Size = new UDim2(0, newWidth, 0, newHeight);
	return constraints.toVector2();
}

export class BaseFrame extends FoundationWidget {
	_size(frame: RbxComponent): Vector2 {
		return udim2Vector2(frame.Size);
	}

	override _layout(
		frame: RbxComponent,
		constraints: BoxConstraints,
		children: Array<FoundationElement>,
	) {
		expandRbxComponentToConstraints(frame, constraints);
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

export class Padding extends BaseFrame {
	private edgeInsets: EdgeInsets;

	override _layout(
		frame: RbxComponent,
		constraints: BoxConstraints,
		children: FoundationElement[], // TODO: pass children indirectly
	): void {
		let [paddedW, paddedH] = getRelativeSize(frame);
		const horizontalPadding = this.edgeInsets.start + this.edgeInsets.ending;
		const verticalPadding = this.edgeInsets.top + this.edgeInsets.bottom;
		if (constraints.maxWidth !== "Infinity") {
			paddedW = constraints.maxWidth - horizontalPadding;
			if (paddedW < 0) {
				// print("Warning: 0-width Padding");
				paddedW = 0;
			}
		}
		if (constraints.maxHeight !== "Infinity") {
			paddedH = constraints.maxHeight - verticalPadding;
			if (paddedH < 0) {
				// print("Warning: 0-height Padding");
				paddedH = 0;
			}
		}
		const childConstraint = BoxConstraints.fromVector2(new Vector2(paddedW - 2, paddedH - 2));
		children[0].layout(childConstraint);
		children[0].setPosition(new UDim2(0, this.edgeInsets.start, 0, this.edgeInsets.top));
		const childSize = children[0].size();
		// if (!constraints.checkConstraints(childSize)) {
		// 	print("Child of Padding doesn't match constraints");
		// }
		const newWidth = childSize.X + horizontalPadding;
		const newHeight = childSize.Y + verticalPadding;
		const clamp = clampToConstraints(new Vector2(newWidth, newHeight), constraints);
		frame.Size = new UDim2(0, clamp.X, 0, clamp.Y);
	}

	constructor(params: { child: Widget; edgeInsets: EdgeInsets }) {
		super([params.child]);
		this.edgeInsets = params.edgeInsets;
	}
}

export class Flex extends BaseFrame {
	spreadEvenly = false;
	desiredSpace = 8.0;
	direction: Direction;

	override _layout(
		frame: GuiObject,
		constraints: BoxConstraints,
		children: FoundationElement[],
	): void {
		debug.profilebegin("PianoRowLayout");
		super._layout(frame, constraints, children);
		const selfSize = super._size(frame);
		const totalLength = mainAxisValue(selfSize, this.direction);
		const evenDivide = constraints.clone();
		switch (this.direction) {
			case Direction.Horizontal:
				evenDivide.maxWidth = constraints.maxWidthN() / children.size();
				break;
			case Direction.Vertical:
				evenDivide.maxHeight = constraints.maxHeightN() / children.size();
				break;
		}
		const sizes: Vector2[] = [];

		let childLengths = 0;
		for (const child of children) {
			child.layout(evenDivide);
			const size = child.size();
			sizes.push(size);
			childLengths += mainAxisValue(size, this.direction);
		}

		const spacing = (totalLength - childLengths) / (children.size() + 1);
		let mainAxisDistance = spacing;
		children.forEach((child, i) => {
			switch (this.direction) {
				case Direction.Horizontal:
					child.setPosition(new UDim2(0, mainAxisDistance, 0, child.position().Y));
					break;
				case Direction.Vertical:
					child.setPosition(new UDim2(0, child.position().X, 0, mainAxisDistance));
					break;
			}
			mainAxisDistance += mainAxisValue(sizes[i], this.direction);
			mainAxisDistance += spacing;
		});
		debug.profileend();
	}

	constructor(direction: Direction, params: { children: Array<Widget>; spreadEvenly?: boolean }) {
		super(params.children);
		this.direction = direction;
		this.spreadEvenly = params.spreadEvenly ?? this.spreadEvenly;
	}
}

export class Row extends Flex {
	constructor(params: { children: Array<Widget>; spreadEvenly?: boolean }) {
		super(Direction.Horizontal, params);
	}
}

export class Column extends Flex {
	constructor(params: { children: Array<Widget>; spreadEvenly?: boolean }) {
		super(Direction.Vertical, params);
	}
}

export class RobloxComponentWidget extends FoundationWidget {
	_size(component: RbxComponent): Vector2 {
		return udim2Vector2(component.Size);
	}

	createElement(): Element {
		return new FoundationElement(this);
	}

	override createComponent(context: Element): GuiObject {
		return this.component;
	}

	_layout(component: GuiObject, constraints: BoxConstraints, _: FoundationElement[]) {
		if (this.layout) {
			return expandRbxComponentToConstraints(component, constraints);
		}
		// return constraints.toVector2();
	}

	component: GuiObject;
	layout: boolean;

	constructor(component: GuiObject, layout = false) {
		super();
		this.component = component;
		this.layout = layout;
	}
}
