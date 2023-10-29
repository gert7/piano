/// <reference types="@rbxts/compiler-types" />
/** A container that holds a single value. The value can be modified directly.
 * */
export declare class ObjectRef<T> {
    value: T;
    constructor(value: T);
}
/** Remembers the value returned by the `valueBuilder` function and returns it
 * across rebuilds. If anything in the `keys` array changes, the value will be
 * rebuilt and replaced by the `valueBuilder` function.
 */
export declare function useMemoized<T>(valueBuilder: () => T, keys?: Array<object>): T;
/** Remembers a value in {@link ObjectRef} and returns it across rebuilds. Changing
 * this value will not cause any side effects (such as rebuilds).
 */
export declare function useRef<R>(value: R): ObjectRef<R>;
/** Remembers a function and returns it across rebuilds. The saved function will
 * be rebuilt if anything in the `keys` array changes.
 */
export declare function useCallback(callback: Callback, keys?: Array<object>): Callback;
/**
 * A {@link Hook} that fires a callback whenever the value provided changes between
 * rebuilds, and returns the result of that callback. The callback also receives the
 * new value and the old result of the callback itself, if any.
 *
 * @param value The value to check against
 * @param callback A function that will be called when the value is no longer
 * equal to the previously given value.
 * @typeParam T The type of the value to be checked against
 * @typeParam R The return type of the callback
 */
export declare function useValueChanged<T, R>(value: T, callback: (oldValue: T, oldResult?: R) => R | undefined): R | undefined;
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
export declare function useEffect(effect: () => () => void, keys: Array<object>, disposeNow?: boolean): void;
export type UseStateReturn<R> = LuaTuple<[R, (value: R) => void]>;
/**
 * A {@link Hook} for persisting values across rebuilds. Returns
 * the value and a function for changing the value, which will trigger a
 * rebuild.
 *
 * @param initialValue A function that returns the initial value.
 */
export declare function useState<R>(initialValue: () => R): UseStateReturn<R>;
