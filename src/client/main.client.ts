import { BoxConstraints, EdgeInsets } from "./geometry";
import { Padding, Row, TextWidget } from "./basic";
import { StatelessWidget, Widget } from "./widget";

const Players = game.GetService("Players");

const PlayerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;

const ScreenGui = new Instance("ScreenGui");
ScreenGui.Parent = PlayerGui;

export function mount(rootNode: GuiBase2d, home: Widget) {
	const rootFrame = new Instance("Frame");
	rootFrame.Position = new UDim2(0, 0, 0, 0);
	rootFrame.Size = new UDim2(1, 0, 1, 0);
	rootFrame.BackgroundTransparency = 1.0;
	rootFrame.Parent = rootNode;

	const rootElement = home.createElement();
	const times = 1000;
	const constraints = new BoxConstraints(0.0, rootFrame.AbsoluteSize.X, 0.0, rootFrame.AbsoluteSize.Y);
	for (let i = 0; i < times; i++) {
		rootElement.update(home);
		const foundationRoot = rootElement.findChildWithComponent();
		foundationRoot.attachComponents(rootFrame);
		foundationRoot.layout(constraints);
	}
	rootElement.debugPrint();
}

class HomeWidget extends StatelessWidget {
	override build(): Widget {
		return new Padding({
			edgeInsets: EdgeInsets.all(64.0),
			child: new Row({
				children: [
					new TextWidget("New York"),
					new TextWidget("Washington"),
					new TextWidget("Detroit"),
					new TextWidget("China"),
					new TextWidget("London"),
					new TextWidget("Wensleydale"),
				],
			}),
		});
	}
}

mount(ScreenGui, new HomeWidget());

// print(ScreenGui.AbsoluteSize);

// ScreenGui.GetPropertyChangedSignal("AbsoluteSize").Connect(() => {
// 	print(ScreenGui.AbsoluteSize);
// });
