/// <reference types="@rbxts/types" />

/** Entrypoint functions for attaching Piano to a Roblox component. */
import { RootElement } from "./element";
import { BoxConstraints } from "./geometry";
import { Widget } from "./widget";

/** Attach a brand new Piano tree to a Roblox component, such as a `ScreenGui`
 * or something similar.
 *
 * @param rootNode The Roblox component this Piano tree attaches to.
 * @param home The Piano Widget to use as the topmost Widget.
 */
export function mountPiano(rootNode: GuiBase2d, home: Widget) {
	const rootFrame = new Instance("ScrollingFrame");
	rootFrame.Position = new UDim2(0, 0, 0, 0);
	rootFrame.Size = new UDim2(1, 0, 1, 0);
	rootFrame.BackgroundTransparency = 1.0;
	rootFrame.ScrollingEnabled = false;
	rootFrame.ScrollBarThickness = 0;
	rootFrame.Parent = rootNode;

	const rootElement = new RootElement((_event) => {
		// print("Piano rootElement event received");
	});

	const homeElement = home.createElement();
	rootElement.appendToRoot(homeElement);
	homeElement.update(home);
	rootElement.debugPrint();
	const absSize = rootFrame.AbsoluteSize;

	const constraints = new BoxConstraints(0.0, absSize.X, 0.0, absSize.Y);
	const foundationRoot = rootElement.findChildWithComponent();
	foundationRoot.attachComponents(rootFrame);
	foundationRoot.layout(constraints);
	rootFrame
		.GetPropertyChangedSignal("AbsoluteSize")
		.Connect(() => foundationRoot.layout(BoxConstraints.fromVector2(rootFrame.AbsoluteSize)));
}