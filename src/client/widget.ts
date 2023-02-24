/**
 * Widgets are blueprints for creating Elements.
 * @module
 */
import {
	BuildContext,
	Element,
	FoundationElement,
	InheritedElement,
	ProxyElement,
	StatefulElement,
	StatelessElement,
} from "./element";
import { BoxConstraints, BoxSize } from "./geometry";
import { HookElement } from "./hook";
// import { InheritedElement } from "../removed/provider.ts.none";
import { State } from "./state";
import { RbxComponent } from "./types";

/** A Widget is a blueprint for creating an {@link Element}. */
export interface Widget {
	createElement(): Element;
}

/** A {@link Widget} that corresponds to {@link RbxComponent}. Can have 0 or
 * more children.
 *
 * If the `_children` array becomes `undefined` rather than empty during a
 * rebuild, the children will *not* be updated in the {@link Element} tree. */
export abstract class FoundationWidget implements Widget {
	abstract _layout(
		component: RbxComponent,
		constraints: BoxConstraints,
		children: Element[],
	): void;

	abstract _size(component: RbxComponent): BoxSize;

	_children?: Array<Widget>;

	children(): Array<Widget> | undefined {
		return this._children;
	}

	createElement(): Element {
		return new FoundationElement(this);
	}

	abstract createComponent(context: BuildContext): RbxComponent;

	updateComponent(context: BuildContext, component: RbxComponent, oldWidget?: Widget): boolean {
		return false;
	}

	constructor(children?: Array<Widget>) {
		this._children = children;
	}
}

export abstract class StatelessWidget implements Widget {
	createElement(): Element {
		return new StatelessElement(this);
	}

	abstract build(context: BuildContext): Widget;
}

/** A {@link Widget} that will persist a {@link State} in its {@link Element}
 * for as long as a widget of the same type remains in the same position in the
 * tree. Consider using {@link HookWidget} instead.
 *
 * ```typescript
 * export class CounterWidget extends StatefulWidget {
 * 		initialValue: number;
 *
 * 		createState = () => new _CounterWidgetState();
 *
 * 		constructor(initValue: number) {
 * 			super();
 * 			this.initialValue = initValue;
 * 		}
 * }
 *
 * export class _CounterWidgetState extends State<CounterWidget> {
 * 		counter!: number;
 *
 * 		override initState() {
 *  		this.counter = this.widget.initialValue;
 * 		}
 *
 * 		increment() {
 * 			this.setState(() => {
 * 				this.counter += 1;
 * 			});
 * 		}
 *
 * 		override build() {
 * 			return new RobloxTextButton(`The number is: ${this.counter}`, this.increment);
 * 		}
 * }
 * ```
 * */
export abstract class StatefulWidget implements Widget {
	createElement(): Element {
		return new StatefulElement(this);
	}

	/** @returns An instance of {@link State} that corresponds to this StatefulWidget. */
	abstract createState: () => State<StatefulWidget>;
}

export abstract class HookWidget implements Widget {
	createElement(): Element {
		return new HookElement(this);
	}

	abstract build(context: BuildContext): Widget;
}

export abstract class ProxyWidget implements Widget {
	createElement(): Element {
		return new ProxyElement(this);
	}

	child: Widget;

	constructor(child: Widget) {
		this.child = child;
	}
}

/**
 * Propagates a value down the tree. The value can be read or observed by
 * calling a build context's `read`, `watch` or `select` methods on the class
 * name.
 *
 * Note: May have a bug that occasionally causes subscribed Widgets not to mark
 * for rebuild. Usually occurs once per application run. */
export abstract class InheritedWidget<T, A = void> extends ProxyWidget {
	override createElement(): ProxyElement {
		return new InheritedElement(this);
	}

	/** {@link InheritedElement} will call this when the Widget is rebuilt to
	 * check if subscribers should be notified.
	 *
	 * @param oldWidget The old Widget instance for comparing.
	 */
	abstract updateShouldNotify(oldWidget: InheritedWidget<T, A>): boolean;

	abstract value(): T;
}
