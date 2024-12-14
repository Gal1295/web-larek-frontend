import { Model } from './base/model';
import {
	IAppState,
	IBasket,
	ICatalog,
	IOrder,
} from '../types';
import { IProduct } from './Product';

export interface CatalogChangeEvent {
	products: ICatalog[];
}

export class AppState extends Model<IAppState> {
	basket: IBasket[] = [];
	catalog: ICatalog[];
	order: IOrder = {
		payment: '',
		address: '',
		email: '',
		phone: '',
		items: [],
		total: 0,
	};

	preview: string | null;
	formErrors: Partial<Record<keyof IOrder, string>> = {};

	addToBasket(item: IBasket) {
		const { price } = item; // Деструктурируем price из item
		if (price !== null && !this.basket.some(existingItem => existingItem.id === item.id)) {
			this.basket.push(item);
			this.emitChanges('basket:changed', this.basket);
		}
	}
	
	removeFromBasket(item: IBasket) {
		this.basket = this.basket.filter((it) => it != item);
		this.emitChanges('basket:changed', this.basket);
	}

	clearBasket() {
		this.basket = [];
		this.emitChanges('basket:changed', this.basket);
	}


	setProduct(items: IProduct[]) {
		this.catalog = items;
		this.emitChanges('items:changed', { catalog: this.catalog });
	}

	setPreview(item: IProduct) {
		this.preview = item.id;
		this.emitChanges('preview:changed', item);
	}

	validateOrderForm() {
		const errors: typeof this.formErrors = {};

		if (!this.order.payment)  errors.payment = 'Необходимо указать способ оплаты';
		if (!this.order.address) errors.address = 'Необходимо указать адрес';

		if (!this.order.email) errors.email = 'Необходимо указать email';
		if (!this.order.phone) errors.phone = 'Необходимо указать телефон';

		this.formErrors = errors;
		this.events.emit('formErrors:change', this.formErrors);

		return Object.keys(errors).length === 0;
	}

	setOrderField(field: keyof IOrder, value: string | number) {
		// Устанавливаем значение для указанного поля
		if (field === 'total') {
			this.order[field] = value as number; // Присваиваем значение для поля total
		} else if (field === 'items') {
			// Проверяем, что value является строкой перед добавлением в массив items
			if (typeof value === 'string') {
				this.order[field].push(value); // Добавляем элемент в массив items
			} else {
				console.error('Значение для items должно быть строкой');
			}
		} else {
			this.order[field] = value as string; // Для остальных полей присваиваем значение как строку
		}
	
		// Проверяем валидность заказа и генерируем событие
		if (this.validateOrderForm()) {
			this.events.emit('order:success', this.order); // Генерируем событие с текущим заказом
		} else {
			console.error('Форма заказа не прошла валидацию');
		}
	}	

	contactsReset() {
		this.order.email = '';
		this.order.phone = '';
	}
}