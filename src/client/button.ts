import { expandRbxComponentToConstraints } from "./basic";
import { FoundationElement } from "./element";
import { BoxConstraints } from "./geometry";
import { RbxComponent } from "./types";
import { FoundationWidget } from "./widget";

export class RobloxTextButton extends FoundationWidget {
	text: string;
	onClick: () => void;

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

	_layout(
		component: GuiObject,
		constraints: BoxConstraints,
		children: FoundationElement[],
	): Vector2 {
		return expandRbxComponentToConstraints(component, constraints);
	}

	constructor(text: string, onClick: () => void) {
		super([]);
		this.text = text;
		this.onClick = onClick;
	}
}
