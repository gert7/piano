export interface SizeConstraints {
	isTight(): boolean;
}

export type constraint = number | "Infinity";

export class BoxConstraints implements SizeConstraints {
	minWidth: constraint;
	maxWidth: constraint;
	minHeight: constraint;
	maxHeight: constraint;

	constructor(minWidth: constraint, maxWidth: constraint, minHeight: constraint, maxHeight: constraint) {
		this.minWidth = minWidth;
		this.maxWidth = maxWidth;
		this.minHeight = minHeight;
		this.maxHeight = maxHeight;
	}

	isTight(): boolean {
		return this.minWidth === this.maxWidth && this.minHeight === this.maxHeight;
	}
}

export class EdgeInsets {
	/** Left in left-to-right context */
	start: number;
	/** Right in left-to-right context */
	end: number;
	top: number;
	bottom: number;

	constructor(insets: { start: number; end: number; top: number; bottom: number }) {
		this.start = insets.start ?? 0.0;
		this.end = insets.end ?? 0.0;
		this.top = insets.top ?? 0.0;
		this.bottom = insets.bottom ?? 0.0;
	}

	static all(inset: number): EdgeInsets {
		return new EdgeInsets({ start: inset, end: inset, top: inset, bottom: inset });
	}
}
