import {
	BuildContext,
	Element,
	FoundationElement,
	StatefulElement,
	StatelessElement,
} from "./element";
import { BoxConstraints, BoxSize, udim2Vector2 } from "./geometry";
import { HookElement } from "./hook";
import { State } from "./state";
import { RbxComponent } from "./types";

/** A Widget is a blueprint for creating an {@link Element}. */
export interface Widget {
	createElement(): Element;
}

/** A {@link Widget} that corresponds to a
 * {@link RbxComponent | Roblox Component}. Can have 0 or more children.
 *
 * If the `_children` array becomes `undefined` rather than empty during a
 * rebuild, the children will *not* be updated in the {@link Element} tree. */
export abstract class FoundationWidget implements Widget {
	_layout(
		component: RbxComponent,
		constraints: BoxConstraints,
		children: Array<FoundationElement>,
	): BoxSize {
		return udim2Vector2(component.Size);
	}

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
