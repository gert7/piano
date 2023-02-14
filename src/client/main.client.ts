import { BoxConstraints, EdgeInsets } from "./geometry";
import { Padding, Row, TextWidget } from "./basic";
import { HookWidget, Widget } from "./widget";
import { BuildContext, Element, RootElement } from "./element";
import { RobloxTextButton } from "./button";
import { useRef, useState } from "./hook_primitives";

const Players = game.GetService("Players");

const PlayerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;

const ScreenGui = new Instance("ScreenGui");
ScreenGui.Parent = PlayerGui;

export function mount(rootNode: GuiBase2d, home: Widget) {
	const rootFrame = new Instance("ScrollingFrame");
	rootFrame.Position = new UDim2(0, 0, 0, 0);
	rootFrame.Size = new UDim2(1, 0, 1, 0);
	rootFrame.BackgroundTransparency = 1.0;
	rootFrame.ScrollingEnabled = false;
	rootFrame.ScrollBarThickness = 0;
	rootFrame.Parent = rootNode;

	const rootElement = new RootElement((event) => {
		print("Piano rootElement event received");
	});
	const homeElement = home.createElement();
	rootElement.appendToRoot(homeElement);
	homeElement.update(home);
	const absSize = rootFrame.AbsoluteSize;

	const constraints = new BoxConstraints(0.0, absSize.X, 0.0, absSize.Y);
	const foundationRoot = rootElement.findChildWithComponent();
	foundationRoot.attachComponents(rootFrame);
	foundationRoot.layout(constraints);
	rootFrame
		.GetPropertyChangedSignal("AbsoluteSize")
		.Connect(() => foundationRoot.layout(BoxConstraints.fromVector2(rootFrame.AbsoluteSize)));
	rootElement.debugPrint();
}

class OneChild extends HookWidget {
	build(context: Element): Widget {
		return new TextWidget("What is going on");
	}
}

class TwoChild extends HookWidget {
	build(context: Element): Widget {
		return new Padding({ edgeInsets: EdgeInsets.all(8.0), child: new OneChild() });
	}
}

class CounterWidget extends HookWidget {
	override build(context: BuildContext): Widget {
		const [counter, setCounter] = useState(() => 0);
		const textWidgets: Widget[] = useRef([]).value;

		debug.profilebegin("CounterWidgetInsert");
		const incrementCounter = () => {
			const a = new Padding({
				edgeInsets: EdgeInsets.all(8.0),
				child: new Padding({
					edgeInsets: EdgeInsets.all(8.0),
					child: new TextWidget(`${counter}`),
				}),
			});
			textWidgets.push(a);
			textWidgets.push(a);
			textWidgets.push(a);
			textWidgets.push(a);
			textWidgets.push(a);
			textWidgets.push(a);
			setCounter(counter + 6);
		};
		const decrementCounter = () => {
			textWidgets.pop();
			textWidgets.pop();
			textWidgets.pop();
			textWidgets.pop();
			textWidgets.pop();
			textWidgets.pop();
			setCounter(counter - 6);
		};
		debug.profileend();

		return new Row({
			children: [
				new RobloxTextButton("Hello from HookWidget: " + counter, incrementCounter),
				new RobloxTextButton("Decremember" + counter, decrementCounter),
				new Row({ children: textWidgets }),
			],
		});
	}
}

class TreeYoyoWidget extends HookWidget {
	build(context: Element): Widget {
		const [state, setState] = useState(() => 0);

		function flip() {
			if (state === 0) setState(1);
			else setState(0);
		}

		const child = state === 0 ? new OneChild() : new TwoChild();

		return new Row({
			children: [new RobloxTextButton("Flip", flip), child],
		});
	}
}

class HomeWidget extends HookWidget {
	override build(): Widget {
		return new Padding({
			edgeInsets: EdgeInsets.all(8.0),
			child: new CounterWidget(),
		});
	}
}

mount(ScreenGui, new HomeWidget());

// print(ScreenGui.AbsoluteSize);

// ScreenGui.GetPropertyChangedSignal("AbsoluteSize").Connect(() => {
// 	print(ScreenGui.AbsoluteSize);
// });
