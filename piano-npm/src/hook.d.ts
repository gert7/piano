import { BuildContext, Element } from "./element";
import { HookWidget } from "./widget";
/** The interface of a primitive Hook. A Hook should contain the immediate
 * parameters that were passed in a `use` call, while the persistent part of a
 * hook call is contained in {@link HookState}. Hooks can only be called from
 * inside the build method of a {@link HookWidget} (or the build method of a
 * {@link HookState}).
 *
 * You should consider writing a custom `use` function composed of other
 * `use` calls before deciding to implement this interface.
 */
export interface Hook<R> {
    /** The {@link HookElement} will replace the entire {@link HookState} with a
     * new one if it detects changes to this array. Elements being added or
     * removed will cause this, as well as any changes to `===` equality between
     * any two elements.
     */
    keys: Array<object>;
    /** A method that returns the corresponding {@link HookState} for this
     * primitive hook. */
    createState: () => HookState<R, Hook<R>>;
}
/** The persistent state of a {@link Hook}. This is very similar to
 * {@link State}. Hook state is persisted in the HookState array of a
 * single {@link HookElement}. */
export interface HookState<R, H extends Hook<R>> {
    /** A reference to the Hook in the most recent hook call (changes to this
     * member may often be irrelevant). */
    hook: H;
    /** The element that the HookState belongs to. */
    _element: HookElement;
    /** A method that will be called when the hook is inserted into
     * the HookState array of a {@link HookElement}.
     */
    initState(): void;
    /** A method that will be called whenever the hook is called from a build
     * method. This is useful for checking if relevant changes have happened
     * between rebuilds. This should **not** be used to check for changes in
     * `keys` arrays, because {@link Hook} already contains a `keys` array and
     * will replace the *entire* {@link HookState} when it detects changes.
     *
     * @param oldHook (Typically) short-lived reference to the previous Hook
     * instance.
     */
    didUpdateHook(oldHook: H): void;
    /** The method that provides the return value for each hook call. This is
     * the only other location where hooks can be called with `use` functions.
     *
     * @param context A reference to the owning {@link HookElement}.
     */
    build(context: BuildContext): R | undefined;
    /** A convenience function that will be called when the entire element is
     * unmounted from the tree. Intended for any cleanup that may be needed.
     */
    dispose(): void;
}
/** Sends a {@link Hook} instance to the currently active {@link HookElement}.
 * If hook rules are properly followed, this should either create a new
 * {@link HookState} based on the Hook, or update an existing HookState.
 */
export declare function use<R>(hook: Hook<R>): R;
/** An {@link Element} that corresponds to the {@link HookWidget} class.
 * Contains a global reference to the HookElement that is currently being
 * built. */
export declare class HookElement extends Element {
    /** The globally known HookElement that is currently being rebuilt on the
     * main thread. */
    static activeHookElement?: HookElement;
    widget: HookWidget;
    private _hooks;
    protected _hookCounter: number;
    static useHook<R>(hook: Hook<R>): R;
    static keysIdentical<R>(hook1: Hook<R>, hook2: Hook<R>): boolean;
    _useHook<R>(hook: Hook<R>): R;
    update(widget: HookWidget): void;
    rebuild(): void;
    constructor(widget: HookWidget);
}
