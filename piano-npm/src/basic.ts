/// <reference types="@rbxts/types" />
"use strict";

import { Constructor } from "./constructor";
import { BuildContext, Element, FoundationElement } from "./element";
import { Error } from "./error";
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
	_layout(component: GuiObject, constraints: BoxConstraints, children: Element[]): void { }
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

	override _layout(frame: RbxComponent, constraints: BoxConstraints, children: Element[]) {
		expandRbxComponentToConstraints(frame, constraints);
	}

	override createComponent(context: BuildContext): ScrollingFrame {
		const frame = new Instance("ScrollingFrame");
		frame.BackgroundTransparency = 1;
		frame.Size = new UDim2(0, 1, 0, 1);
		frame.ScrollBarThickness = 0;
		frame.ScrollingEnabled = false;
		frame.BorderMode = Enum.BorderMode.Inset;
		frame.BorderSizePixel = 0;
		return frame;
	}
}

export class Padding extends BaseFrame {
	private edgeInsets: EdgeInsets;

	override _layout(
		frame: RbxComponent,
		constraints: BoxConstraints,
		iChildren: Element[], // TODO: pass children indirectly
	): void {
		const children = Element.findChildrenWithComponents(iChildren);
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

	private constrainedLength(constraints: BoxConstraints, length: number): BoxConstraints {
		switch (this.direction) {
			case Direction.Horizontal:
				return new BoxConstraints(
					length,
					length,
					constraints.minHeight,
					constraints.maxHeight,
				);
			case Direction.Vertical:
				return new BoxConstraints(
					constraints.minWidth,
					constraints.maxWidth,
					length,
					length,
				);
		}
	}

	private widgetName() {
		return this.direction === Direction.Horizontal ? "Row" : "Column";
	}

	override _layout(frame: GuiObject, constraints: BoxConstraints, iChildren: Element[]): void {
		print("Flex _layout");
		debug.profilebegin("PianoFlexLayout");

		const children = findChildrenWithInfixData(iChildren, Flexible);
		expandRbxComponentToConstraints(frame, constraints);
		// const selfSize = super._size(frame);

		const inflexibles = children.filter((cw) => cw.infixElement === undefined);
		const flexibles = children.filter((cw) => cw.infixElement !== undefined);

		inflexibles.forEach((cw) => cw.child.layout(BoxConstraints.unbounded()));
		inflexibles.forEach((cw) => print(cw.child.size()));
		const remainingLength =
			constraints.maxWidthN() -
			inflexibles.reduce((a, cw) => a + mainAxisValue(cw.child.size(), this.direction), 0);

		if (remainingLength < 0) {
			print(`Error: ${this.widgetName()} overflowed by ${-remainingLength} pixels.`);
		}

		const totalFlex = flexibles.reduce((a, cw) => a + cw.infixWidget!.flex, 0);
		const singleFlexLength = remainingLength / totalFlex;
		flexibles.forEach((cw) =>
			cw.infixElement!.layout(
				this.constrainedLength(constraints, singleFlexLength * cw.infixWidget!.flex),
			),
		);

		flexibles.forEach((cw) => print(cw.child.size()));

		let progress = 0;

		for (const cw of children) {
			const child = cw.infixElement !== undefined ? cw.infixElement : cw.child;
			switch (this.direction) {
				case Direction.Horizontal:
					child.setPosition(new UDim2(0, progress, 0, 0));
					progress += child.size().X;
					break;
				case Direction.Vertical:
					child.setPosition(new UDim2(0, 0, 0, progress));
					progress += child.size().Y;
					break;
			}
		}

		debug.profileend(); // PianoFlexLayout
	}

	constructor(direction: Direction, params: { children: Array<Widget>; spreadEvenly?: boolean }) {
		super(params.children);
		this.direction = direction;
		this.spreadEvenly = params.spreadEvenly ?? this.spreadEvenly;
	}
}

/** A type of Widget used for providing additional data semantically related to
 * the children of this Widget. For example {@link Expanded} is a widget that
 * allows you to specify how much space a child widget should take in a
 * {@link Row} or {@link Column}.
 */
export interface InfixWidget { }

/** Result of a query of children that either may or may not have
 * an {@link InfixWidget} as a parent.
 */
export interface ChildWithInfixData<IW extends InfixWidget> {
	infixWidget: IW | undefined;
	infixElement: FoundationElement | undefined;
	child: FoundationElement;
}

export enum FlexFit {
	tight,
	loose,
}

export class Flexible extends BaseFrame implements InfixWidget {
	flex: number;
	fit: FlexFit;

	_layout(component: GuiObject, constraints: BoxConstraints, children: Element[]): void {
		print(`constraints: ${constraints.toString()}`);
		expandRbxComponentToConstraints(component, constraints);
		const child = Element.findChildrenWithComponents(children)[0];
		switch (this.fit) {
			case FlexFit.loose:
				child.layout(new BoxConstraints(0, constraints.maxWidth, 0, constraints.maxHeight));
				break;
			case FlexFit.tight:
				child.layout(constraints);
				break;
		}
	}

	constructor(params: { child: Widget; flex: number; fit?: FlexFit }) {
		super([params.child]);
		this.flex = params.flex;
		this.fit = params.fit ?? FlexFit.loose;
	}
}

/**  */
export class Expanded extends Flexible {
	constructor(params: { child: Widget; flex: number }) {
		super({ ...params, fit: FlexFit.tight });
	}
}

/** Accepts a list of children. Walks through a child if it's an InfixWidget of
 * type IW and places the infix widget and its element to the
 * `infixWidget`/`infixElement` fields of the {@link ChildWithInfixData} object
 * it returns, while placing the child of that Widget in the `child` field. If
 * the child is not the provided InfixWidget, it will be returned with the
 * `infix` fields as `undefined`.
 *
 * @param children A list of child elements
 * @param infixWidgetCons The type of {@link InfixWidget} to check for
 */
export function findChildrenWithInfixData<IW extends InfixWidget>(
	children: Element[],
	infixWidgetCons: Constructor<IW>,
): ChildWithInfixData<IW>[] {
	return children.map((child) => {
		let current: Element | undefined = child;
		let previous = current?.widgetName();
		let infix: FoundationElement | undefined;
		let infixWidget: IW | undefined;
		for (; ;) {
			if (!current) {
				throw new Error(`Childless widget at ${previous}`);
			} else if (current.widget instanceof infixWidgetCons && infix === undefined) {
				print("Found infix data");
				previous = current.widgetName();
				infix = current as FoundationElement;
				infixWidget = current.widget;
			} else if (
				current instanceof FoundationElement &&
				!(current.widget instanceof infixWidgetCons)
			) {
				return {
					infixWidget: infixWidget,
					infixElement: infix,
					child: current,
				};
			} else {
				current = current._children[0];
			}
		}
	});
}

/** Layout child widgets in a horizontal array. */
export class Row extends Flex {
	constructor(params: { children: Array<Widget>; spreadEvenly?: boolean }) {
		super(Direction.Horizontal, params);
	}
}

/** Layout child widgets in a vertical array. */
export class Column extends Flex {
	constructor(params: { children: Array<Widget>; spreadEvenly?: boolean }) {
		super(Direction.Vertical, params);
	}
}

/** A widget that centers its child within itself.
 *
 * This widget will be as big as possible if its dimensions are constrained and
 * widthFactor and heightFactor are null. If a dimension is unconstrained and
 * the corresponding size factor is null then the widget will match its child's
 * size in that dimension. If a size factor is non-null then the corresponding
 * dimension of this widget will be the product of the child's dimension and the
 * size factor. For example if widthFactor is 2.0 then the width of this widget
 * will always be twice its child's width.
 */
export class Center extends BaseFrame {
	widthFactor?: number;
	heightFactor?: number;

	_layout(frame: GuiObject, constraints: BoxConstraints, children: Element[]): void {
		let newWidth = 0;
		let newHeight = 0;
		const child = Element.findChildrenWithComponents(children)[0];
		child.layout(constraints);
		const childSize = child.size();
		if (this.widthFactor === undefined && constraints.maxWidth !== "Infinity") {
			newWidth = constraints.maxWidth;
		}
		if (this.heightFactor === undefined && constraints.maxHeight !== "Infinity") {
			newHeight = constraints.maxHeight;
		}
		if (this.widthFactor === undefined && constraints.maxWidth === "Infinity") {
			newWidth = childSize.X;
		}
		if (this.heightFactor === undefined && constraints.maxHeight === "Infinity") {
			newHeight = childSize.Y;
		}
		if (this.widthFactor !== undefined) {
			newWidth = childSize.X * this.widthFactor;
		}
		if (this.heightFactor !== undefined) {
			newHeight = childSize.Y * this.heightFactor;
		}
		frame.Size = new UDim2(0, newWidth, 0, newHeight);
		const childX = newWidth / 2 - childSize.X / 2;
		const childY = newHeight / 2 - childSize.Y / 2;
		child.setPosition(new UDim2(0, childX, 0, childY));
	}

	constructor(params: { widthFactor?: number; heightFactor?: number; child: Widget }) {
		super([params.child]);
		this.widthFactor = params.widthFactor;
		this.heightFactor = params.heightFactor;
	}
}

export class Align extends BaseFrame {
}

/** This Widget can be used to place a Roblox Component directly in the tree. */
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

	_layout(component: GuiObject, constraints: BoxConstraints, _: Element[]) {
		if (this.layout) {
			expandRbxComponentToConstraints(component, constraints);
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
