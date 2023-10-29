/// <reference types="@rbxts/types" />
/// <reference types="@rbxts/types" />
/// <reference types="@rbxts/types" />
/**
 * An element is the persistent, *real* state of a {@link Widget} that exists
 * for as long as a Widget of the same type occupies the same exact position in
 * the Element tree between rebuilds.
 *
 * If a Widget of a different type is in the same position, the old Element will
 * be unmounted, disposed, and replaced with a new one.
 * @module
 */
import { Constructor } from "./constructor";
import { BoxConstraints, BoxSize } from "./geometry";
import { Provider } from "./provider";
import { State } from "./state";
import { RbxComponent } from "./types";
import { FoundationWidget, InheritedWidget, ProxyWidget, StatefulWidget, StatelessWidget, Widget } from "./widget";
/** The basis for finding a Provider to subscribe to, either by giving the
 * Provider itself, or a typename that will be searched for by traversing the
 * Element tree upwards.
 */
export type ProviderName<T, A> = Provider<T, A> | (new (...args: any[]) => InheritedWidget<T, A>);
/** An element is the persistent, real state of a {@link Widget}. It forms
 * part of the Element tree, and has a lifecycle.
 */
export declare abstract class Element {
    widget?: Widget;
    slot?: object;
    protected _parent?: Element;
    _children: Array<Element>;
    protected _mounted: boolean;
    protected _oldWidget?: Widget;
    protected _dirty: boolean;
    /** Returns whether the Element is currently marked for rebuild. */
    isDirty(): boolean;
    private _owner?;
    /** Attempts to return the name of the Widget, or "Unknown widget" if the
     * Widget is null */
    widgetName(): string;
    /** Recursively prints a tree of itself and its children.
     *
     * @param level The nesting level of this Element that will
     * be represented using whitespace.
     */
    debugPrint(level?: number): void;
    /** If the Element has a Roblox Component, returns itself,
     * otherwise traverses down the tree.
     */
    findChildWithComponent(): FoundationElement;
    /** Climbs up the tree and calls the same method on its parent, until an
     * overload of this method (such as on {@link FoundationElement}) will
     * connect the Roblox component to a higher component. */
    connectComponentToParent(component: RbxComponent): Element | undefined;
    /** Collapse this element's child elements' subtrees to the first
     *  FoundationElements that are found. */
    static findChildrenWithComponents(children: Element[]): Array<FoundationElement>;
    /** Traverse down the element tree and attach RbxComponents when
     * the parent is known.
     */
    attachComponents(parent: RbxComponent): void;
    /** Creates a new Element from a {@link Widget}, sets this Element as its
     * parent, updates it and places it in this Element's child list at the `index`.
     */
    inflateWidget(widget: Widget, index?: number): Element;
    /** Updates the Widget at this Element, moves the old widget to _oldWidget,
     * and rebuilds itself.
     */
    update(widget: Widget): void;
    /** Sets this element's parent, build owner and sets it as mounted. */
    mount(parent: Element, owner?: RootElement): void;
    /** Resets this Element's `_mounted` to `false` and recursively unmounts
     * all of its children as well.
     */
    unmount(): void;
    updateChild(index: number, element?: Element, widget?: Widget, slot?: object): Element | undefined;
    /** Marks this Element as `_dirty` and adds it to its build owner's
     * set of elements to rebuild.
     */
    markRebuild(): void;
    /** Performs whatever actions are necessary to rebuild this Element, such as
     * calling `build()` if it represents a {@link StatelessWidget} or
     * {@link HookWidget} or updating and laying out a component if it
     * represents a {@link FoundationWidget}. By default will also reset `_dirty`
     * to `false`.
     */
    rebuild(): void;
    /** Returns `true` if the Element is set as mounted. */
    isMounted(): boolean;
    /** Returns the {@link InheritedElement} that corresponds to an InheritedWidget. */
    findInheritedProviderInAncestors<T, A>(cons: Constructor<InheritedWidget<T, A>>): Provider<T, A>;
    private providers;
    /** Reads a value from a Provider, either directly or by traversing up the
     * tree to find a Provider of the given type.
     *
     * @param provider Either a Provider, or a type of Provider to be found by
     * traversing up the Element tree.
     */
    read<T, A>(provider: Provider<T, A>, aspect?: A): T;
    watch<T, A>(provider: Provider<T, A>, aspect?: A): T;
    select<T, A>(provider: Provider<T, A>, _: {
        aspect?: A;
        selector: Selector<T>;
    }): T;
    announceDependencyChange<T, A>(dependency: Provider<T, A>): void;
    constructor(widget?: Widget);
}
export type BuildContext = Element;
export declare class FoundationElement extends Element {
    widget: FoundationWidget;
    private component;
    constraints?: BoxConstraints;
    connections: Map<string, RBXScriptConnection>;
    componentParentElement?: Element;
    /** The Position of the Roblox component. */
    position(): Vector2;
    /** Sets the Position of the Roblox component. */
    setPosition(position: UDim2): void;
    removeConnection(key: string): boolean;
    setConnection(key: string, conn: RBXScriptConnection): void;
    findChildWithComponent(): FoundationElement;
    connectComponentToParent(component: RbxComponent): Element | undefined;
    update(widget: FoundationWidget): void;
    layout(constraints: BoxConstraints): void;
    size(): BoxSize;
    rebuild(): void;
    /** Attach all children to the component. */
    attachChildren(): void;
    attachComponents(parent: GuiObject): void;
    unmount(): void;
    updateChildren(newChildren?: Array<Widget>, slots?: Array<object>): void;
    constructor(widget: FoundationWidget);
}
export declare class StatelessElement extends Element {
    widget: StatelessWidget;
    rebuild(): void;
    constructor(widget: StatelessWidget);
}
export declare class StatefulElement extends Element {
    widget: StatefulWidget;
    state: State<StatefulWidget>;
    constructor(widget: StatefulWidget);
    update(widget: StatefulWidget): void;
    rebuild(): void;
    unmount(): void;
}
export declare class ProxyElement extends Element {
    widget: ProxyWidget;
    update(widget: ProxyWidget): void;
    rebuild(): void;
    constructor(widget: ProxyWidget);
}
export declare class RootElement extends Element {
    eventHandler?: (event: string) => void;
    elementsToRebuild: Set<Element>;
    timePassed: number;
    interval: number;
    debugPrint(level?: number): void;
    /** Set this element as the immediate child of the
     * root element.. */
    appendToRoot(element: Element): void;
    addToRebuild(element: Element): void;
    removeFromRebuild(element: Element): void;
    manageTreeLoop(deltaTime?: number): void;
    constructor(eventHandler: (event: string) => void);
}
export type Selector<T> = (newValue: T, oldValue?: T) => boolean;
export declare class InheritedElement<T, A = void> extends ProxyElement implements Provider<T, A> {
    widget: InheritedWidget<T, A>;
    private dependents;
    updateDependent(element: Element, aspect?: A): void;
    removeDependent(element: Element): void;
    value(aspect?: A): T;
    oldValue(): T | undefined;
    update(widget: InheritedWidget<T, A>): void;
    constructor(widget: InheritedWidget<T, A>);
}
