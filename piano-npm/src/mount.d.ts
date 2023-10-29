/// <reference types="@rbxts/types" />
import { Widget } from "./widget";
/** Attach a brand new Piano tree to a Roblox component, such as a `ScreenGui`
 * or something similar.
 *
 * @param rootNode The Roblox component this Piano tree attaches to.
 * @param home The Piano Widget to use as the topmost Widget.
 */
export declare function mountPiano(rootNode: GuiBase2d, home: Widget): void;
