import { BuildContext, Element, StatefulElement } from "./element";
import { Error } from "./error";
import { StatefulWidget, Widget } from "./widget";

export abstract class State<T extends StatefulWidget> {
	setState(f: () => void) {
		f();
		this._element.markRebuild();
	}

	initState() { }

	widget!: Widget;
	_element!: StatefulElement;

	build(context: BuildContext): Widget {
		throw new Error("build() not implemented for abstract class");
	}

	didUpdateWidget(oldWidget: T): void { }

	dispose(): void { }
}
