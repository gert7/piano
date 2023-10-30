/// <reference types="@rbxts/types" />
import { expandRbxComponentToConstraints } from "./basic";
import { Element, FoundationElement } from "./element";
import { BoxConstraints, udim2Vector2 } from "./geometry";
import { RbxComponent } from "./types";
import { FoundationWidget } from "./widget";

/** Widget that corresponds to a Roblox TextButton component.
 *
 * ```typescript
 * RobloxTestButton("Hello World!", () => print("Hello World has been clicked"));
 * ```
 */
export class RobloxTextButton extends FoundationWidget {
	text: string;
	onClick: () => void;

	override _size(component: GuiObject): Vector2 {
		return udim2Vector2(component.Size);
	}

	override updateComponent(context: FoundationElement, component: GuiObject): boolean {
		const button = component as TextButton;
		button.Text = this.text;
		context.setConnection("onClick", button.Activated.Connect(this.onClick));
		return true;
	}

	createComponent(context: FoundationElement): RbxComponent {
		const button = new Instance("TextButton");
		button.Text = this.text;
		button.BorderMode = Enum.BorderMode.Inset;
		context.setConnection("onClick", button.Activated.Connect(this.onClick));
		return button;
	}

	_layout(component: GuiObject, constraints: BoxConstraints, children: Element[]): Vector2 {
		return expandRbxComponentToConstraints(component, constraints);
	}
	/**
	 * @param text Text string for the .Text attribute
	 * @param onClick Callback when button is pressed
	 */
	constructor(text: string, onClick: () => void) {
		super([]);
		this.text = text;
		this.onClick = onClick;
	}
}
