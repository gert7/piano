import { BuildContext, Element } from "./element";
import { Error } from "./error";
import { HookWidget } from "./widget";

export interface Hook<R> {
	keys: Array<object>;

	createState: () => HookState<R, Hook<R>>;
}

export interface HookState<R, H extends Hook<R>> {
	hook: H;

	_element: HookElement;

	initState(): void;

	didUpdateHook(oldHook: H): void;

	build(context: BuildContext): R | undefined;

	dispose(): void;
}

export function use<R>(hook: Hook<R>): R {
	return HookElement.useHook(hook);
}

export class HookElement extends Element {
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

	static keysIdentical<R>(hook1: Hook<R>, hook2: Hook<R>): boolean {
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
		if (hookState && HookElement.keysIdentical(hookState.hook, hook)) {
			const oldHook = hookState.hook as Hook<R>;
			hookState.hook = hook;
			hookState.didUpdateHook(oldHook);
			this._hookCounter++;
			return hookState.build(this) as R;
		} else {
			this._hooks[this._hookCounter]?.dispose();
			this._hooks[this._hookCounter] = hook.createState();
			const newHook = this._hooks[this._hookCounter];
			newHook._element = this;
			newHook.hook = hook;
			newHook.initState();
			this._hookCounter++;
			return newHook.build(this) as R;
		}
	}

	override update(widget: HookWidget): void {
		super.update(widget);
		this.rebuild();
	}

	override rebuild() {
		if (!this._dirty) return;
		HookElement.activeHookElement = this;
		const child = this.widget.build(this);
		this.updateChild(0, undefined, child, undefined);
		this._hookCounter = 0;
		super.rebuild();
		HookElement.activeHookElement = undefined;
	}

	constructor(widget: HookWidget) {
		super();
		this.widget = widget;
	}
}
