import { Element } from "./element";
/** The base for listenables that return a single value and are expected to
 * maintain an array of Element listeners that it can mark for rebuild. It may
 * also accept a custom `aspect` object for whatever purpose, such as for when a
 * listener wants to specify only a subset of changes to listen to.
 *
 * You should prefer using something like {@link InheritedWidget} instead of
 * implementing this interface directly.
 *
 * @typeParam V The value that the Element returns
 * @typeParam A An optional aspect type for subscribing only to select changes
 */
export interface Provider<V, A = void> {
    /** Adds an element to a list of subscribers that the Element maintains. */
    updateDependent(element: Element, aspect?: A): void;
    /** Removes an element from the list of subscribers. This should be called
     * from an unmounting or disposing method.
     */
    removeDependent(element: Element): void;
    /** An immediate value that the Element can provide. */
    value(aspect?: A): V;
    /** The previous value, if applicable. */
    oldValue(aspect?: A): V | undefined;
}
