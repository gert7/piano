import { BoxConstraints, EdgeInsets } from "./geometry";
import { Padding, Row, TextWidget } from "./basic";
import { HookWidget, Widget } from "./widget";
import { BuildContext, RootElement } from "./element";
import { RobloxTextButton } from "./button";
import { useEffect, useMemoized, useRef, useState } from "./hook_primitives";

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

	const rootElement = new RootElement((event) => {
		print("Piano rootElement event received");
	});
	const homeElement = home.createElement();
	rootElement.appendToRoot(homeElement);
	homeElement.update(home);

	const constraints = new BoxConstraints(
		0.0,
		rootFrame.AbsoluteSize.X,
		0.0,
		rootFrame.AbsoluteSize.Y,
	);
	const foundationRoot = rootElement.findChildWithComponent();
	foundationRoot.attachComponents(rootFrame);
	foundationRoot.layout(constraints);
	rootElement.debugPrint();
}

class CounterWidget extends HookWidget {
	override build(context: BuildContext): Widget {
		const [counter, setCounter] = useState(() => 0);
		const textWidgets: Widget[] = useRef([]);

		const incrementCounter = () => {
			textWidgets.push(new TextWidget("Beep " + textWidgets.size()));
			setCounter(counter + 1);
		};
		const decrementCounter = () => {
			textWidgets.pop();
			setCounter(counter - 1);
		};

		useEffect(() => {
			const add = new RobloxTextButton("Decremember" + counter, decrementCounter);
			textWidgets.push(add);
			return () => { };
		}, []);

		// for (let i = 0; i < counter; i++) {
		// 	textWidgets.push(new TextWidget("Beep " + i));
		// }

		return new Row({
			children: [
				new RobloxTextButton("Hello from HookWidget: " + counter, incrementCounter),
				new Row({ children: textWidgets }),
			],
		});
	}
}

class HomeWidget extends HookWidget {
	override build(): Widget {
		return new Padding({
			edgeInsets: EdgeInsets.all(64.0),
			child: new CounterWidget(),
		});
	}
}

mount(ScreenGui, new HomeWidget());

// print(ScreenGui.AbsoluteSize);

// ScreenGui.GetPropertyChangedSignal("AbsoluteSize").Connect(() => {
// 	print(ScreenGui.AbsoluteSize);
// });
