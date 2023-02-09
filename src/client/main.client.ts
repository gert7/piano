import { BoxConstraints, EdgeInsets } from "./geometry";
import {
	Element,
	FoundationElement,
	LeafChildFoundationElement,
	MultiChildFoundationElement,
	SingleChildFoundationElement,
} from "./element";
import { Error } from "./error";
import { Padding, TextWidget } from "./basic";
import { FoundationWidget, StatefulWidget, StatelessWidget, Widget } from "./widget";

const Players = game.GetService("Players");

const PlayerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;

const ScreenGui = new Instance("ScreenGui");
ScreenGui.Parent = PlayerGui;

export function mount(rootNode: GuiBase2d, home: Widget) {
	const rootElement = home.createElement();
	const constraints = new BoxConstraints(0.0, rootNode.AbsoluteSize.X, 0.0, rootNode.AbsoluteSize.Y);
	rootElement.specifyConstraints(constraints);
	rootElement.update(home);
	rootElement.traverseGuiComponent(rootNode);
}

class HomeWidget extends StatelessWidget {
	override build(): Widget {
		return new Padding({
			child: new TextWidget({ text: "Hello World!" }),
			edgeInsets: EdgeInsets.all(64.0),
		});
	}
}

mount(ScreenGui, new HomeWidget());

print(ScreenGui.AbsoluteSize);

ScreenGui.GetPropertyChangedSignal("AbsoluteSize").Connect(() => {
	print(ScreenGui.AbsoluteSize);
});
