import {
	BuildContext,
	Element,
	FoundationElement,
	LeafFoundationElement,
	MultiChildFoundationElement,
	SingleChildFoundationElement,
	StatefulElement,
	StatelessElement,
} from "./element";
import { BoxConstraints, BoxSize } from "./geometry";
import { HookElement } from "./hook";
import { State } from "./state";
import { RbxComponent } from "./types";

/** A Widget is a blueprint for creating an {@link Element}. */
export interface Widget {
	createElement(): Element;
}

export abstract class FoundationWidget implements Widget {
	_layout(
		component: RbxComponent,
		constraints: BoxConstraints,
		children: Array<FoundationElement>,
	): BoxSize {
		return component.AbsoluteSize;
	}

	createElement(): Element {
		return new FoundationElement(this);
	}

	abstract createComponent(context: BuildContext): RbxComponent;

	updateComponent(context: BuildContext, component: RbxComponent): boolean {
		return false;
	}
}

export abstract class LeafFoundationWidget extends FoundationWidget {
	createElement(): Element {
		return new LeafFoundationElement(this);
	}

	constructor() {
		super();
	}
}

export abstract class SingleChildFoundationWidget extends FoundationWidget {
	protected _child?: Widget;

	child(): Widget | undefined {
		return this._child;
	}

	createElement(): Element {
		return new SingleChildFoundationElement(this);
	}

	constructor(child?: Widget) {
		super();
		this._child = child;
	}
}

export abstract class MultiChildFoundationWidget extends FoundationWidget {
	_children: Array<Widget>;

	children(): Array<Widget> {
		return this._children;
	}

	createElement(): Element {
		return new MultiChildFoundationElement(this);
	}

	constructor(children: Array<Widget>) {
		super();
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
