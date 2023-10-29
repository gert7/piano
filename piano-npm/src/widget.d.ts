/**
 * Widgets are blueprints for creating Elements.
 * @module
 */
import { BuildContext, Element, ProxyElement } from "./element";
import { BoxConstraints, BoxSize } from "./geometry";
import { State } from "./state";
import { RbxComponent } from "./types";
/** A Widget is a blueprint for creating an {@link Element}. */
export interface Widget {
    createElement(): Element;
}
/** A {@link Widget} that corresponds to {@link RbxComponent}. Can have 0 or
 * more children.
 *
 * If the `_children` array becomes `undefined` rather than empty during a
 * rebuild, the children will *not* be updated in the {@link Element} tree. */
export declare abstract class FoundationWidget implements Widget {
    abstract _layout(component: RbxComponent, constraints: BoxConstraints, children: Element[]): void;
    abstract _size(component: RbxComponent): BoxSize;
    _children?: Array<Widget>;
    children(): Array<Widget> | undefined;
    createElement(): Element;
    abstract createComponent(context: BuildContext): RbxComponent;
    updateComponent(context: BuildContext, component: RbxComponent, oldWidget?: Widget): boolean;
    constructor(children?: Array<Widget>);
}
export declare abstract class StatelessWidget implements Widget {
    createElement(): Element;
    abstract build(context: BuildContext): Widget;
}
/** A {@link Widget} that will persist a {@link State} in its {@link Element}
 * for as long as a widget of the same type remains in the same position in the
 * tree. Consider using {@link HookWidget} instead.
 *
 * ```typescript
 * export class CounterWidget extends StatefulWidget {
 * 		initialValue: number;
 *
 * 		createState = () => new _CounterWidgetState();
 *
 * 		constructor(initValue: number) {
 * 			super();
 * 			this.initialValue = initValue;
 * 		}
 * }
 *
 * export class _CounterWidgetState extends State<CounterWidget> {
 * 		counter!: number;
 *
 * 		override initState() {
 *  		this.counter = this.widget.initialValue;
 * 		}
 *
 * 		increment() {
 * 			this.setState(() => {
 * 				this.counter += 1;
 * 			});
 * 		}
 *
 * 		override build() {
 * 			return new RobloxTextButton(`The number is: ${this.counter}`, this.increment);
 * 		}
 * }
 * ```
 * */
export declare abstract class StatefulWidget implements Widget {
    createElement(): Element;
    /** @returns An instance of {@link State} that corresponds to this StatefulWidget. */
    abstract createState: () => State<StatefulWidget>;
}
export declare abstract class HookWidget implements Widget {
    createElement(): Element;
    abstract build(context: BuildContext): Widget;
}
export declare abstract class ProxyWidget implements Widget {
    createElement(): Element;
    child: Widget;
    constructor(child: Widget);
}
/**
 * Propagates a value down the tree. The value can be read or observed by
 * calling a build context's `read`, `watch` or `select` methods on the class
 * name.
 *
 * Note: May have a bug that occasionally causes subscribed Widgets not to mark
 * for rebuild. Usually occurs once per application run. */
export declare abstract class InheritedWidget<T, A = void> extends ProxyWidget {
    createElement(): ProxyElement;
    /** {@link InheritedElement} will call this when the Widget is rebuilt to
     * check if subscribers should be notified.
     *
     * @param oldWidget The old Widget instance for comparing.
     */
    abstract updateShouldNotify(oldWidget: InheritedWidget<T, A>): boolean;
    abstract value(): T;
}
