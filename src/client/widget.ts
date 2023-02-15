import {
	BuildContext,
	Element,
	FoundationElement,
	InheritedElement,
	ProxyElement,
	StatefulElement,
	StatelessElement,
} from "./element";
import { BoxConstraints, BoxSize, udim2Vector2 } from "./geometry";
import { HookElement } from "./hook";
import { State } from "./state";
import { RbxComponent } from "./types";

/** A Widget is a blueprint for creating an {@link ProxyElement}. */
export interface Widget {
	createElement(): Element;
}

/** A {@link Widget} that corresponds to a
 * {@link RbxComponent | Roblox Component}. Can have 0 or more children.
 *
 * If the `_children` array becomes `undefined` rather than empty during a
 * rebuild, the children will *not* be updated in the {@link ProxyElement} tree. */
export abstract class FoundationWidget implements Widget {
	abstract _layout(
		component: RbxComponent,
		constraints: BoxConstraints,
		children: Array<FoundationElement>,
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

export abstract class StatefulWidget implements Widget {
	createElement(): Element {
		return new StatefulElement(this);
	}

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

export abstract class InheritedWidget<T> extends ProxyWidget {
	createElement(): ProxyElement {
		return new InheritedElement(this);
	}

	abstract updateShouldNotify(oldWidget: InheritedWidget<T>): boolean;

	abstract value(): T;
}
