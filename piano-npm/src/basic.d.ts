/// <reference types="@rbxts/types" />
/// <reference types="@rbxts/types" />
/// <reference types="@rbxts/types" />
import { Constructor } from "./constructor";
import { BuildContext, Element, FoundationElement } from "./element";
import { BoxConstraints, BoxSize, Direction, EdgeInsets } from "./geometry";
import { RbxComponent } from "./types";
import { FoundationWidget, Widget } from "./widget";
export declare class TextWidget extends FoundationWidget {
    _layout(component: GuiObject, constraints: BoxConstraints, children: Element[]): void;
    text: string;
    constructor(text: string);
    updateComponent(context: BuildContext, component: TextLabel, oldWidget?: Widget): boolean;
    _size(component: RbxComponent): BoxSize;
    createComponent(context: BuildContext): RbxComponent;
}
export declare function expandRbxComponentToConstraints(component: RbxComponent, constraints: BoxConstraints, width?: boolean, height?: boolean): BoxSize;
export declare class BaseFrame extends FoundationWidget {
    _size(frame: RbxComponent): Vector2;
    _layout(frame: RbxComponent, constraints: BoxConstraints, children: Element[]): void;
    createComponent(context: BuildContext): ScrollingFrame;
}
export declare class Padding extends BaseFrame {
    private edgeInsets;
    _layout(frame: RbxComponent, constraints: BoxConstraints, iChildren: Element[]): void;
    constructor(params: {
        child: Widget;
        edgeInsets: EdgeInsets;
    });
}
export declare class Flex extends BaseFrame {
    spreadEvenly: boolean;
    desiredSpace: number;
    direction: Direction;
    private constrainedLength;
    private widgetName;
    _layout(frame: GuiObject, constraints: BoxConstraints, iChildren: Element[]): void;
    constructor(direction: Direction, params: {
        children: Array<Widget>;
        spreadEvenly?: boolean;
    });
}
/** A type of Widget used for providing additional data semantically related to
 * the children of this Widget. For example {@link Expanded} is a widget that
 * allows you to specify how much space a child widget should take in a
 * {@link Row} or {@link Column}.
 */
export interface InfixWidget {
}
/** Result of a query of children that either may or may not have
 * an {@link InfixWidget} as a parent.
 */
export interface ChildWithInfixData<IW extends InfixWidget> {
    infixWidget: IW | undefined;
    infixElement: FoundationElement | undefined;
    child: FoundationElement;
}
export declare enum FlexFit {
    tight = 0,
    loose = 1
}
export declare class Flexible extends BaseFrame implements InfixWidget {
    flex: number;
    fit: FlexFit;
    _layout(component: GuiObject, constraints: BoxConstraints, children: Element[]): void;
    constructor(params: {
        child: Widget;
        flex: number;
        fit?: FlexFit;
    });
}
/**  */
export declare class Expanded extends Flexible {
    constructor(params: {
        child: Widget;
        flex: number;
    });
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
export declare function findChildrenWithInfixData<IW extends InfixWidget>(children: Element[], infixWidgetCons: Constructor<IW>): ChildWithInfixData<IW>[];
/** Layout child widgets in a horizontal array. */
export declare class Row extends Flex {
    constructor(params: {
        children: Array<Widget>;
        spreadEvenly?: boolean;
    });
}
/** Layout child widgets in a vertical array. */
export declare class Column extends Flex {
    constructor(params: {
        children: Array<Widget>;
        spreadEvenly?: boolean;
    });
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
export declare class Center extends BaseFrame {
    widthFactor?: number;
    heightFactor?: number;
    _layout(frame: GuiObject, constraints: BoxConstraints, children: Element[]): void;
    constructor(params: {
        widthFactor?: number;
        heightFactor?: number;
        child: Widget;
    });
}
export declare class Align extends BaseFrame {
}
/** This Widget can be used to place a Roblox Component directly in the tree. */
export declare class RobloxComponentWidget extends FoundationWidget {
    _size(component: RbxComponent): Vector2;
    createElement(): Element;
    createComponent(context: Element): GuiObject;
    _layout(component: GuiObject, constraints: BoxConstraints, _: Element[]): void;
    component: GuiObject;
    layout: boolean;
    constructor(component: GuiObject, layout?: boolean);
}
