import { BuildContext } from "./element";
import { Hook, HookElement, HookState, use } from "./hook";

export class ObjectRef<T> {
	value: T;

	constructor(value: T) {
		this.value = value;
	}
}

class _MemoizedHook<R> implements Hook<R> {
	keys: Array<object>;

	valueBuilder: () => R;

	createState = () => new _MemoizedHookState<R>();

	constructor(valueBuilder: () => R, keys: Array<object>) {
		this.valueBuilder = valueBuilder;
		this.keys = keys;
	}
}

class _MemoizedHookState<R> implements HookState<R, _MemoizedHook<R>> {
	hook!: _MemoizedHook<R>;

	_element!: HookElement;

	private value!: R;

	initState() {
		this.value = this.hook.valueBuilder();
	}

	didUpdateHook(oldHook: _MemoizedHook<R>): void { }

	build(): R {
		return this.value;
	}

	dispose(): void { }
}

export function useMemoized<T>(valueBuilder: () => T, keys?: Array<object>): T {
	return use(new _MemoizedHook(valueBuilder, keys ?? []));
}

export function useRef<R>(value: R): ObjectRef<R> {
	return use(new _MemoizedHook(() => new ObjectRef(value), []));
}

export function useCallback(callback: Callback, keys?: Array<object>): Callback {
	return use(new _MemoizedHook(() => callback, keys ?? []));
}

type ValueChangedCallback<T, R> = (oldValue: T, oldResult?: R) => R | undefined;

class _ValueChangedHook<T, R> implements Hook<R> {
	value: T;

	valueChanged: ValueChangedCallback<T, R>;

	keys = [];

	createState = () => new _ValueChangedHookState<T, R>();

	constructor(value: T, valueChanged: ValueChangedCallback<T, R>) {
		this.value = value;
		this.valueChanged = valueChanged;
	}
}

class _ValueChangedHookState<T, R> implements HookState<R, _ValueChangedHook<T, R>> {
	hook!: _ValueChangedHook<T, R>;

	_element!: HookElement;

	_result?: R;

	initState(): void { }

	didUpdateHook(oldHook: _ValueChangedHook<T, R>): void {
		if (oldHook.value !== this.hook.value) {
			this._result = this.hook.valueChanged(oldHook.value, this._result);
		}
	}

	build(): R | undefined {
		return this._result;
	}

	dispose(): void { }
}

/**
 * A {@link hook.Hook | Hook} that fires a callback whenever the value provided changes between
 * rebuilds, and returns the result of that callback.
 *
 * @param value The value to check against
 * @param callback A function that will be called when the value is no longer
 * equal to the previously given value.
 * @typeParam T The type of the value to be checked against
 * @typeParam R The return type of the callback
 */
export function useValueChanged<T, R>(
	value: T,
	callback: (oldValue: T, oldResult?: R) => R | undefined,
): R | undefined {
	return use(new _ValueChangedHook(value, callback));
}

class _EffectHook implements Hook<void> {
	callback: () => () => void;

	keys: object[];

	disposeNow: boolean;

	createState = () => new _EffectHookState();

	constructor(callback: () => () => void, keys: Array<object>, disposeNow = false) {
		this.keys = keys;
		this.callback = callback;
		this.disposeNow = disposeNow;
	}
}

class _EffectHookState implements HookState<void, _EffectHook> {
	hook!: _EffectHook;

	_element!: HookElement;

	disposeCallback!: Callback;

	initState(): void {
		this.disposeCallback = this.hook.callback();
	}

	didUpdateHook(oldHook: _EffectHook): void {
		if (this.hook.disposeNow) {
			this.disposeCallback();
			this.disposeCallback = this.hook.callback();
		}
	}

	build(): void | undefined { }

	dispose(): void {
		if (this.disposeCallback) {
			this.disposeCallback();
		}
	}
}

/** Trigger a side effect whenever the objects in `keys` change. Accepts a
 * function that returns a cleanup function. This cleanup function will be
 * called when the Widget is disposed, or if `disposeNow` is true (the effect
 * will be re-run in that case). The cleanup function can be used for any
 * purpose and doesn't have to do anything.
 *
 * @param effect A function that will be run if objects in `keys` have changed,
 * and must return a void function for cleanup.
 * @param keys A list of objects that will be checked for equality.
 * @param disposeNow If true, will call the dispose function now, and run the
 * effect again.
 */
export function useEffect(effect: () => () => void, keys: Array<object>, disposeNow = false) {
	use(new _EffectHook(effect, keys, disposeNow));
}

export type UseStateReturn<R> = [R, (value: R) => void];

class _StateHook<R> implements Hook<UseStateReturn<R>> {
	keys = [];

	initialValueBuilder: () => R;

	createState = () => new _StateHookState<R>();

	constructor(initialValueBuilder: () => R) {
		this.initialValueBuilder = initialValueBuilder;
	}
}

class _StateHookState<R> implements HookState<UseStateReturn<R>, _StateHook<R>> {
	hook!: _StateHook<R>;

	_element!: HookElement;

	value!: R;

	initState(): void {
		this.value = this.hook.initialValueBuilder();
	}

	didUpdateHook(oldHook: _StateHook<R>): void { }

	setter = (value: R) => {
		this.value = value;
		this._element.markRebuild();
	};

	build(context: BuildContext): UseStateReturn<R> {
		return [this.value, this.setter];
	}

	dispose(): void { }
}

/**
 * A {@link hook.Hook | Hook} for persisting values across rebuilds. Returns
 * the value and a function for changing the value, which will trigger a
 * rebuild.
 *
 * @param initialValue A function that returns the initial value.
 */
export function useState<R>(initialValue: () => R): UseStateReturn<R> {
	return use(new _StateHook(initialValue));
}
