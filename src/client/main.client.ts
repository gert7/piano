import { BoxConstraints, EdgeInsets } from "./geometry";
import { Padding, Row, TextWidget } from "./basic";
import { StatefulWidget, StatelessWidget, Widget } from "./widget";
import { BuildContext, RootElement } from "./element";
import { RobloxTextButton } from "./button";
import { State } from "./state";

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
		print("event received");
	});
	const homeElement = home.createElement();
	rootElement.appendToRoot(homeElement);
	homeElement.update(home);

	const constraints = new BoxConstraints(0.0, rootFrame.AbsoluteSize.X, 0.0, rootFrame.AbsoluteSize.Y);
	const foundationRoot = rootElement.findChildWithComponent();
	foundationRoot.attachComponents(rootFrame);
	foundationRoot.layout(constraints);
	rootElement.debugPrint();
}

class CounterWidget extends StatefulWidget {
	override createState = (): State<StatefulWidget> => new _CounterWidgetState();
}

class _CounterWidgetState extends State<CounterWidget> {
	private counter = 0;

	increaseCounter() {
		this.setState(() => {
			this.counter++;
		});
	}

	override build(context: BuildContext): Widget {
		const button = new RobloxTextButton("Hello " + this.counter, () => this.increaseCounter());
		const widgets: Array<Widget> = [button];
		for (let i = 0; i < this.counter; i++) {
			widgets.push(new TextWidget("Beep " + i));
		}

		return new Row({
			children: widgets,
		});
	}
}

class HomeWidget extends StatelessWidget {
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
