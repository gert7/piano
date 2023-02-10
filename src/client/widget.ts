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
import { BoxConstraints, BoxSize } from "./geometry";
import { State } from "./state";
import { RbxComponent } from "./types";

export interface Widget {
	typeName: string;

	createElement(): Element;
}

export abstract class FoundationWidget implements Widget {
	typeName = "FoundationWidget";

	_layout(component: RbxComponent, constraints: BoxConstraints, children: Array<FoundationElement>): BoxSize {
		return component.AbsoluteSize;
	}

	createElement(): Element {
		return new FoundationElement(this);
	}

	createComponent(context: BuildContext): RbxComponent {
		throw new Error("createComponent() not implemented for abstract class");
	}

	updateComponent(context: BuildContext, component: RbxComponent): boolean {
		return false;
	}
}

export abstract class LeafChildFoundationWidget extends FoundationWidget {
	typeName = "LeafChildFoundationWidget ";

	createElement(): Element {
		return new LeafChildFoundationElement(this);
	}

	constructor() {
		super();
	}
}

export abstract class SingleChildFoundationWidget extends FoundationWidget {
	typeName = "SingleChildFoundationWidget";

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
	typeName = "MultiChildFoundationWidget";

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
	typeName = "StatelessWidget";

	createElement(): Element {
		return new StatelessElement(this);
	}

	build(): Widget {
		throw new Error("build() not implemented for abstract class");
	}
}

export abstract class StatefulWidget implements Widget {
	typeName = "StatefulWidget";

	createElement(): Element {
		return new StatefulElement(this);
	}

	createState = (): State<StatefulWidget> => {
		throw new Error("createState() not implemented for abstract class");
	};
}

export abstract class HookWidget implements Widget {
	typeName = "HookWidget";

	createElement(): Element {
		return new StatelessElement(this);
	}

	build(): Widget {
		throw new Error("build() not implemented for abstract class");
	}
}