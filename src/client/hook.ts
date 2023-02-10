import { ComposingElement } from "./element";
import { Error } from "./error";
import { HookWidget } from "./widget";

interface Hook<R> {
	keys: Array<object>;

	createState: () => HookState<R, Hook<R>>;
}

interface HookState<R, H extends Hook<R>> {
	hook: H;

	_element: HookElement;

	initState(): void;

	didUpdateHook(oldHook: H): void;

	build(): R;

	dispose(): void;
}

class ObjectRef<T> {
	readonly value: T;

	constructor(value: T) {
		this.value = value;
	}
}

function use<R>(hook: Hook<R>): R {
	return HookElement.useHook(hook);
}

class _RefHook<R> implements Hook<R> {
	keys = [];
	createState = () => new _RefHookState<R>();

	value: R;

	constructor(value: R) {
		this.value = value;
	}
}

class _RefHookState<R> implements HookState<R, _RefHook<R>> {
	hook!: _RefHook<R>;

	_element!: HookElement;

	private ref!: ObjectRef<R>;

	initState() {
		this.ref = new ObjectRef(this.hook.value);
	}

	didUpdateHook(oldHook: _RefHook<R>): void { }

	build(): R {
		return this.ref.value;
	}

	dispose(): void { }
}

function useRef<R>(value: R) {
	return use(new _RefHook(value));
}

export class HookElement extends ComposingElement {
	/** Map of active HookElements based on the Build Owner. */
	static activeHookElement?: HookElement;

	widget: HookWidget;
	private _hooks: Array<HookState<any, Hook<any>>> = [];
	protected _hookCounter = 0;

	static useHook<R>(hook: Hook<R>): R {
		const active = HookElement.activeHookElement;
		if (active === undefined) {
			throw new Error("Hook used outside of build()");
		}
		return active._useHook(hook);
	}

	static arraysIdentical(hook1: Hook<object>, hook2: Hook<object>): boolean {
		const p1 = hook1.keys;
		const p2 = hook2.keys;

		if (p1 === p2) return true;
		if (p1?.size() !== p2?.size()) return false;

		for (let i = 0; i < p1?.size(); i++) {
			if (p1[i] !== p2[i]) {
				return false;
			}
		}
		return true;
	}

	_useHook<R>(hook: Hook<R>): R {
		const hookState = this._hooks[this._hookCounter];
		if (hookState) {
			const oldHook = hookState.hook;
			hookState.hook = hook;
			hookState.didUpdateHook(oldHook);
			this._hookCounter++;
			return hookState.build() as R;
		} else {
			this._hooks[this._hookCounter] = hook.createState();
			this._hooks[this._hookCounter]._element = this;
			this._hooks[this._hookCounter].hook = hook;
			this._hooks[this._hookCounter].initState();
			this._hookCounter++;
			return this._hooks[this._hookCounter].build() as R;
		}
	}

	override update(widget: HookWidget): void {
		super.update(widget);
		this.rebuild();
	}

	override rebuild() {
		if (this.owner) {
			HookElement.activeHookElement = this;
			if (!this._dirty) return;
			const child = this.widget.build();
			this.updateChild(0, undefined, child, undefined);
			this._hookCounter = 0;
			super.rebuild();
			HookElement.activeHookElement = undefined;
		} else {
			print("Error: HookElement has no Build Owner");
		}
	}

	constructor(widget: HookWidget) {
		super();
		this.widget = widget;
	}
}