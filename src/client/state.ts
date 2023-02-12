import { BuildContext, Element, StatefulElement } from "./element";
import { Error } from "./error";
import { StatefulWidget, Widget } from "./widget";

export abstract class State<T extends StatefulWidget> {
	setState(f: () => void) {
		f();
		this._element.markRebuild();
	}

	abstract initState(): void;

	widget!: Widget;
	_element!: StatefulElement;

	abstract build(context: BuildContext): Widget;

	abstract didUpdateWidget(oldWidget: T): void;

	abstract dispose(): void;
}
