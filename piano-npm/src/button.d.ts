/// <reference types="@rbxts/types" />
/// <reference types="@rbxts/types" />
/// <reference types="@rbxts/types" />
import { Element, FoundationElement } from "./element";
import { BoxConstraints } from "./geometry";
import { RbxComponent } from "./types";
import { FoundationWidget } from "./widget";
/** Widget that corresponds to a Roblox TextButton component.
 *
 * ```typescript
 * RobloxTestButton("Hello World!", () => print("Hello World has been clicked"));
 * ```
 */
export declare class RobloxTextButton extends FoundationWidget {
    text: string;
    onClick: () => void;
    _size(component: GuiObject): Vector2;
    updateComponent(context: FoundationElement, component: GuiObject): boolean;
    createComponent(context: FoundationElement): RbxComponent;
    _layout(component: GuiObject, constraints: BoxConstraints, children: Element[]): Vector2;
    /**
     * @param text Text string for the .Text attribute
     * @param onClick Callback when button is pressed
     */
    constructor(text: string, onClick: () => void);
}
