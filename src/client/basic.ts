import { BuildContext, Element } from "./element";
import { EdgeInsets } from "./geometry";
import { FoundationWidget, LeafChildFoundationWidget, SingleChildFoundationWidget, Widget } from "./widget";

export class TextWidget extends LeafChildFoundationWidget {
	text: string;

	constructor(_: { text: string }) {
		super();
		this.text = _.text;
	}

	override createComponent(context: BuildContext): GuiBase2d {
		const text = new Instance("TextLabel");
		text.Text = this.text;
		text.BackgroundTransparency = 1.0;
		text.Size = new UDim2(0, 1, 0, 1);
		text.Position = new UDim2(0, 0, 0, 0);
		text.AutomaticSize = Enum.AutomaticSize.XY;
		return text;
	}
}

export class BaseFrame extends SingleChildFoundationWidget {
	override createComponent(context: BuildContext): Frame {
		const frame = new Instance("Frame");
		frame.BackgroundTransparency = 1.0;
		frame.Size = new UDim2(0, 1, 0, 1);
		return frame;
	}
}

export class Padding extends BaseFrame {
	private edgeInsets: EdgeInsets;

	override createComponent(context: Element): Frame {
		const frame = super.createComponent(context);
		const constraints = context.constraints();
		let newWidth = frame.Size.Width.Offset;
		let newHeight = frame.Size.Width.Offset;
		if (constraints !== undefined) {
			if (constraints.maxWidth !== "Infinity") {
				newWidth = constraints.maxWidth - (this.edgeInsets.start + this.edgeInsets.end);
				if (newWidth < 0) {
					print("Warning: 0-width Padding");
					newWidth = 0;
				}
			}
			if (constraints.maxHeight !== "Infinity") {
				newHeight = constraints.maxHeight - (this.edgeInsets.top + this.edgeInsets.bottom);
				if (newHeight < 0) {
					print("Warning: 0-height Padding");
					newHeight = 0;
				}
			}
		} else {
			print("Error: No constraints received from element at Padding");
		}
		frame.Size = new UDim2(0, newWidth, 0, newHeight);
		frame.Position = new UDim2(0, this.edgeInsets.start, 0, this.edgeInsets.top);
		return frame;
	}

	constructor(_: { child: Widget; edgeInsets: EdgeInsets }) {
		super();
		this._child = _.child;
		this.edgeInsets = _.edgeInsets;
	}
}
