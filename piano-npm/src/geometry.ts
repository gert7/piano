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
export class BoxConstraints implements SizeConstraints {
	static Infinity: constraint = "Infinity";

	readonly minWidth: constraint;
	readonly maxWidth: constraint;
	readonly minHeight: constraint;
	readonly maxHeight: constraint;

	constructor(
		minWidth?: constraint,
		maxWidth?: constraint,
		minHeight?: constraint,
		maxHeight?: constraint,
	) {
		this.minWidth = minWidth ?? 0;
		this.maxWidth = maxWidth ?? "Infinity";
		this.minHeight = minHeight ?? 0;
		this.maxHeight = maxHeight ?? "Infinity";
	}

	maxWidthN(): number {
		if (this.maxWidth !== "Infinity") {
			return this.maxWidth;
		} else {
			return 9999;
		}
	}

	maxHeightN(): number {
		if (this.maxWidth !== "Infinity") {
			return this.maxWidth;
		} else {
			return 9999;
		}
	}

	minWidthN(): number {
		if (this.minWidth !== "Infinity") {
			return this.minWidth;
		} else {
			return 0;
		}
	}

	minHeightN(): number {
		if (this.minHeight !== "Infinity") {
			return this.minHeight;
		} else {
			return 0;
		}
	}

	clone(): BoxConstraints {
		return new BoxConstraints(this.minWidth, this.maxWidth, this.minHeight, this.maxHeight);
	}

	static tight(width: constraint, height: constraint): BoxConstraints {
		return new BoxConstraints(width, width, height, height);
	}

	isTight(): boolean {
		return this.minWidth === this.maxWidth && this.minHeight === this.maxHeight;
	}

	static fromVector2(vec2: Vector2): BoxConstraints {
		return new BoxConstraints(0, vec2.X, 0, vec2.Y);
	}

	static unbounded(): BoxConstraints {
		return new BoxConstraints(0, "Infinity", 0, "Infinity");
	}

	toVector2(): Vector2 {
		return new Vector2(this.maxWidthN(), this.maxHeightN());
	}

	checkConstraints(boxSize: BoxSize): boolean {
		if (
			boxSize.X > this.maxWidthN() ||
			boxSize.Y > this.maxHeightN() ||
			boxSize.X < this.minWidthN() ||
			boxSize.Y < this.minHeightN()
		)
			return false;
		return true;
	}

	toString() {
		return `${this.minWidth} - ${this.maxWidth}; ${this.minHeight} - ${this.maxHeight}`;
	}
}

/** Executes the same function on a {@link Vector2} and returns both results as a tuple. */
export const mapVector2 = (f: (d: number) => number, vec: Vector2): LuaTuple<[number, number]> =>
	[f(vec.X), f(vec.Y)] as LuaTuple<[number, number]>;

export type BoxSize = Vector2;

export function udim2Vector2(udim2: UDim2): Vector2 {
	return new Vector2(udim2.X.Offset, udim2.Y.Offset);
}

export function clampToConstraints(size: BoxSize, constraints: BoxConstraints): BoxSize {
	let [newWidth, newHeight] = [size.X, size.Y];
	if (newWidth > constraints.maxWidthN()) {
		newWidth = constraints.maxWidthN();
	}
	if (newHeight > constraints.maxHeightN()) {
		newHeight = constraints.maxHeightN();
	}
	return new Vector2(newWidth, newHeight);
}

export class EdgeInsets {
	/** Left in left-to-right context */
	readonly start: number;
	/** Right in left-to-right context */
	readonly ending: number;
	readonly top: number;
	readonly bottom: number;

	constructor(insets: { start: number; end: number; top: number; bottom: number }) {
		this.start = insets.start ?? 0.0;
		this.ending = insets.end ?? 0.0;
		this.top = insets.top ?? 0.0;
		this.bottom = insets.bottom ?? 0.0;
	}

	static all(inset: number): EdgeInsets {
		return new EdgeInsets({ start: inset, end: inset, top: inset, bottom: inset });
	}
}

export enum Direction {
	Horizontal,
	Vertical,
}

export function mainAxisValue(vec: Vector2, direction: Direction): number {
	switch (direction) {
		case Direction.Horizontal:
			return vec.X;
		case Direction.Vertical:
			return vec.Y;
	}
}

export class Alignment {
	readonly x: number;
	readonly y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	static topLeft = new Alignment(-1.0, -1.0);
	static topCenter = new Alignment(0.0, -1.0);
	static topRight = new Alignment(1.0, -1.0);
	static centerLeft = new Alignment(-1.0, 0.0);
	static center = new Alignment(0.0, 0.0);
	static centerRight = new Alignment(1.0, 0.0);
	static bottomLeft = new Alignment(-1.0, 1.0);
	static bottomCenter = new Alignment(0.0, 1.0);
	static bottomRight = new Alignment(1.0, 1.0);

	// /** Converts to a Vector2 whose x and y are in the range of 0 to 1. */
	// clampToPositive(): Vector2 {
	// 	const x = (this.x + 1.0) / 2;
	// 	const y = (this.y + 1.0) / 2;
	// 	return new Vector2(x, y);
	// }
}

/** Returns the top-left position of a rectangle based on an {@link Alignment}
 * and a container size. */
export function manualAlign(childSize: BoxSize, alignment: Alignment, containerSize: BoxSize) {
	const [xCenter, yCenter] = mapVector2((d) => d / 2, containerSize);
}
