import { Model } from './base/model';
import {
	IAppState,
	IBasketProduct,
	ICatalogProduct,
	IOrder,
	FormErrors,
} from '../types';
import { ICard } from './Card';

export interface CatalogChangeEvent {
	products: ICatalogProduct[];
}

export class AppState extends Model<IAppState> {
	basket: IBasketProduct[] = [];
	catalog: ICatalogProduct[];
	loading: boolean;
	order: IOrder = {
		payment: '',
		address: '',
		email: '',
		phone: '',
		total: 0,
		items: [],
	};

	preview: string | null;
	formErrors: FormErrors = {};

	addToBasket(item: IBasketProduct) {
		if (item.price !== null && this.basket.indexOf(item) < 0) {
			this.basket.push(item);
			this.emitChanges('counter:changed', this.basket);
			this.emitChanges('basket:changed', this.basket);
		}
	}

	removeFromBasket(item: IBasketProduct) {
		this.basket = this.basket.filter((it) => it != item);
		this.emitChanges('counter:changed', this.basket);
		this.emitChanges('basket:changed', this.basket);
	}

	clearBasket() {
		this.basket = [];
		this.emitChanges('counter:changed', this.basket);
		this.emitChanges('basket:changed', this.basket);
	}

	getTotal() {
		return this.basket.reduce((total, item) => total + item.price, 0);
	}

	setCatalog(items: ICard[]) {
		this.catalog = items;
		this.emitChanges('items:changed', { catalog: this.catalog });
	}

	setPreview(item: ICard) {
		this.preview = item.id;
		this.emitChanges('preview:changed', item);
	}

	validateOrderForm() {
		const errors: typeof this.formErrors = {};

		if (!this.order.payment)
			errors.payment = 'Необходимо указать способ оплаты';
		if (!this.order.address) errors.address = 'Необходимо указать адрес';

		if (!this.order.email) errors.email = 'Необходимо указать email';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.order.email))
			errors.email = 'Некорректный формат email';
		if (!this.order.phone) errors.phone = 'Необходимо указать телефон';
		else if (
			!/^(\+7|8)\s?\(?\d{3}\)?\s?\d{3}\s?\d{2}\s?\d{2}$/.test(this.order.phone)
		)
			errors.phone = 'Некорректный формат телефона';

		this.formErrors = errors;
		this.events.emit('formErrors:change', this.formErrors);

		return Object.keys(errors).length === 0;
	}

	setOrderField(field: keyof IOrder, value: string | number) {
		if (field === 'total') this.order[field] = value as number;
		else if (field === 'items') {
			this.order[field].push(value as string);
		} else this.order[field] = value as string;
		if (this.validateOrderForm()) this.events.emit('order:success', this.order);
	}

	contactsReset() {
		this.order.email = '';
		this.order.phone = '';
	}
}