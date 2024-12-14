import { Form } from './common/Form';
import { IDataForm, IDeliveryForm } from '../types';
import { IEvents } from './base/events';
import { ensureAllElements } from '../utils/utils';

export class Order extends Form<IDeliveryForm & IDataForm> {
	protected _payment: HTMLButtonElement[];

	constructor(container: HTMLFormElement, events: IEvents) {
		super(container, events);

		this._payment = ensureAllElements<HTMLButtonElement>(
			'.button_alt',
			container
		);
		this._payment.forEach((button) =>
			button.addEventListener('click', () => this.activatedButton(button.name))
		);
	}

	set address(value: string) {
		(this.container.elements.namedItem('address') as HTMLInputElement).value =
			value;
	}

	set email(value: string) {
		(this.container.elements.namedItem('email') as HTMLInputElement).value =
			value;
	}

	set phone(value: string) {
		(this.container.elements.namedItem('phone') as HTMLInputElement).value =
			value;
	}

	set valid(value: boolean) {
		this._submit.disabled = !value;
	}

	activatedButton(name: string) {
		this._payment.forEach((button) =>
			this.toggleClass(button, 'button_alt-active', button.name === name)
		);
		this.events.emit('order.payment:change', { name });
	}
}