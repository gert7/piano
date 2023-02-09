import {
	BuildContext,
	Element,
	FoundationElement,
	LeafChildFoundationElement,
	MultiChildFoundationElement,
	SingleChildFoundationElement,
	StatefulElement,
	StatelessElement,
} from "./element";
import { Error } from "./error";
import { State } from "./state";

export interface Widget {
	createElement(): Element;
}

export abstract class FoundationWidget implements Widget {
	createElement(): Element {
		return new FoundationElement(this);
	}

	createComponent(context: BuildContext): GuiBase2d {
		throw new Error("createComponent() not implemented for abstract class");
	}
}

export abstract class LeafChildFoundationWidget extends FoundationWidget {
	createElement(): Element {
		return new LeafChildFoundationElement(this);
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
	private _children: Array<Widget>;

	children(): Array<Widget> {
		return this._children;
	}

	createElement(): Element {
		return new MultiChildFoundationElement(this);
	}

	constructor(_: { children: Array<Widget> }) {
		super();
		this._children = _.children;
	}
}

export abstract class StatelessWidget implements Widget {
	createElement(): Element {
		return new StatelessElement(this);
	}

	build(): Widget {
		throw new Error("build() not implemented for abstract class");
	}
}

export abstract class StatefulWidget implements Widget {
	createElement(): Element {
		return new StatefulElement(this);
	}

	createState(): State<StatefulWidget> {
		throw new Error("createState() not implemented for abstract class");
	}
}
