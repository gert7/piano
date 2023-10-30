import { Center, Flexible, Padding, Row, TextWidget } from "./basic";
import { RobloxTextButton } from "./button";
import { BuildContext, Element } from "./element";
import { EdgeInsets } from "./geometry";
import { useRef, useState } from "./hook_primitives";
import { mountPiano } from "./mount";
import { HookWidget, InheritedWidget, StatelessWidget, Widget } from "./widget";

const Players = game.GetService("Players");

const PlayerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;

const ScreenGui = new Instance("ScreenGui");
ScreenGui.Parent = PlayerGui;

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

class Topic {
	name: string;

	constructor(name: string) {
		this.name = name;
	}
}

class TopicWidget extends InheritedWidget<Topic, void> {
	updateShouldNotify(oldWidget: InheritedWidget<Topic, void>): boolean {
		return true;
	}

	private topic: Topic;

	value(): Topic {
		return this.topic;
	}

	constructor(params: { topic: Topic; child: Widget }) {
		super(params.child);
		this.topic = params.topic;
	}

	static of(context: BuildContext): Topic {
		const element = context.findInheritedProviderInAncestors(TopicWidget);
		return context.watch(element);
	}
}

class MyConsumerWidget extends StatelessWidget {
	build(context: Element): Widget {
		const topic = TopicWidget.of(context);

		return new Padding({
			edgeInsets: EdgeInsets.all(8.0),
			child: new TextWidget("Topic is " + topic.name),
			// child: new TextWidget("Hello World"),
		});
	}
}

class HomeWidget extends HookWidget {
	override build(context: BuildContext): Widget {
		const [some, setSome] = useState(() => 1);

		return new Padding({
			edgeInsets: EdgeInsets.all(64.0),
			// child: new TextWidget("Bonjoru"),
			child: new TopicWidget({
				topic: new Topic(`${some}`),
				child: new Row({
					children: [
						new Flexible({
							flex: 2,
							child: new RobloxTextButton("increment " + some, () =>
								setSome(some + 1),
							),
						}),
						new Flexible({
							flex: 1,
							child: new Center({ child: new MyConsumerWidget() }),
						}),
					],
				}),
			}),
		});
	}
}

mountPiano(ScreenGui, new HomeWidget());

// print(ScreenGui.AbsoluteSize);

// ScreenGui.GetPropertyChangedSignal("AbsoluteSize").Connect(() => {
// 	print(ScreenGui.AbsoluteSize);
// });
