import { BuildContext, StatefulElement, Element } from "./element";
import { StatefulWidget, Widget } from "./widget";

/** The state of a {@link StatefulWidget}. This is persisted in
 * the element of the widget across rebuilds.
 *
 * @typeParam T - The type of the corresponding StatefulWidget, which enables
 * type correctness in the State.
 */
export abstract class State<T extends StatefulWidget> {
	/** Method that immediately calls `f` and marks the State to be rebuilt.
	 */
	setState(f: () => void): void {
		f();
		this._element.markRebuild();
	}

	/** A method that will be called when the {@link StatefulWidget} is inserted
	 * into the {@link Element} tree. */
	abstract initState(): void;

	widget!: T;
	_element!: StatefulElement;

	abstract build(context: BuildContext): Widget;

	/** This method will be called when the StatefulWidget is replaced, allowing
	 * you to intercept any changes in the widget's members, such as constructor
	 * parameters.
	 *
	 * @param oldWidget The previous instance of the StatefulWidget
	 */
	didUpdateWidget(oldWidget: T): void { }

	dispose(): void { }
}
