export interface SizeConstraints {
	isTight(): boolean;
}

export type constraint = number | "Infinity";

export class BoxConstraints implements SizeConstraints {
	static Infinity: constraint = "Infinity";

	minWidth: constraint;
	maxWidth: constraint;
	minHeight: constraint;
	maxHeight: constraint;

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

	clone(): BoxConstraints {
		return new BoxConstraints(this.minWidth, this.maxWidth, this.minHeight, this.maxHeight);
	}

	isTight(): boolean {
		return this.minWidth === this.maxWidth && this.minHeight === this.maxHeight;
	}

	static fromVector2(vec2: Vector2): BoxConstraints {
		return new BoxConstraints(0, vec2.X, 0, vec2.Y);
	}

	toVector2(): Vector2 {
		return new Vector2(this.maxWidthN(), this.maxHeightN());
	}

	checkConstraints(boxSize: BoxSize): boolean {
		if (
			boxSize.X > this.maxWidth ||
			boxSize.Y > this.maxHeight ||
			boxSize.X < this.minWidth ||
			boxSize.Y < this.minHeight
		)
			return false;
		return true;
	}
}

export type BoxSize = Vector2;

export function udim2Vector2(udim2: UDim2): Vector2 {
	return new Vector2(udim2.X.Offset, udim2.Y.Offset);
}

export function clampToConstraints(size: BoxSize, constraints: BoxConstraints): BoxSize {
	let [newWidth, newHeight] = [size.X, size.Y];
	if (newWidth > constraints.maxWidth) {
		newWidth = constraints.maxWidthN();
	}
	if (newHeight > constraints.maxHeight) {
		newHeight = constraints.maxHeightN();
	}
	return new Vector2(newWidth, newHeight);
}

export class EdgeInsets {
	/** Left in left-to-right context */
	start: number;
	/** Right in left-to-right context */
	ending: number;
	top: number;
	bottom: number;

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
