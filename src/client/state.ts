import { StatefulWidget, Widget } from "./widget";

export interface State<T extends StatefulWidget> {
	// TODO: Add setState()

	build(): Widget;

	widget: T;

	didUpdateWidget(oldWidget?: T): void;
}
