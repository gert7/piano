/// <reference types="@rbxts/types" />
/// <reference types="@rbxts/types" />
/// <reference types="@rbxts/compiler-types" />
export interface SizeConstraints {
    isTight(): boolean;
}
/** A single constraint. */
export type constraint = number | "Infinity";
/** A set of box constraints with minimum and maximum widths and heights. These
 * are passed down the element tree and form the foundation of Piano's box-based
 * geometry model. Constraints can also be absent by being set to the string
 * "Infinity".
 */
export declare class BoxConstraints implements SizeConstraints {
    static Infinity: constraint;
    readonly minWidth: constraint;
    readonly maxWidth: constraint;
    readonly minHeight: constraint;
    readonly maxHeight: constraint;
    constructor(minWidth?: constraint, maxWidth?: constraint, minHeight?: constraint, maxHeight?: constraint);
    maxWidthN(): number;
    maxHeightN(): number;
    minWidthN(): number;
    minHeightN(): number;
    clone(): BoxConstraints;
    static tight(width: constraint, height: constraint): BoxConstraints;
    isTight(): boolean;
    static fromVector2(vec2: Vector2): BoxConstraints;
    static unbounded(): BoxConstraints;
    toVector2(): Vector2;
    checkConstraints(boxSize: BoxSize): boolean;
    toString(): string;
}
/** Executes the same function on a {@link Vector2} and returns both results as a tuple. */
export declare const mapVector2: (f: (d: number) => number, vec: Vector2) => LuaTuple<[number, number]>;
export type BoxSize = Vector2;
export declare function udim2Vector2(udim2: UDim2): Vector2;
export declare function clampToConstraints(size: BoxSize, constraints: BoxConstraints): BoxSize;
export declare class EdgeInsets {
    /** Left in left-to-right context */
    readonly start: number;
    /** Right in left-to-right context */
    readonly ending: number;
    readonly top: number;
    readonly bottom: number;
    constructor(insets: {
        start: number;
        end: number;
        top: number;
        bottom: number;
    });
    static all(inset: number): EdgeInsets;
}
export declare enum Direction {
    Horizontal = 0,
    Vertical = 1
}
export declare function mainAxisValue(vec: Vector2, direction: Direction): number;
export declare class Alignment {
    readonly x: number;
    readonly y: number;
    constructor(x: number, y: number);
    static topLeft: Alignment;
    static topCenter: Alignment;
    static topRight: Alignment;
    static centerLeft: Alignment;
    static center: Alignment;
    static centerRight: Alignment;
    static bottomLeft: Alignment;
    static bottomCenter: Alignment;
    static bottomRight: Alignment;
}
/** Returns the top-left position of a rectangle based on an {@link Alignment}
 * and a container size. */
export declare function manualAlign(childSize: BoxSize, alignment: Alignment, containerSize: BoxSize): void;
