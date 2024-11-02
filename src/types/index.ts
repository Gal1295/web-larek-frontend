//Интерфейс и типы данных, описывающих карточку товара

export interface IProductItem {
	id: string;
	title: string;
	price: number | null;
	image: string;
	category: string;
	description: string;
}

export type IBasket = Pick<IProductItem, 'id' | 'title' | 'price'>;
export type ICatalog = Pick<
	IProductItem,
	'id' | 'title' | 'price' | 'image' | 'category'
>;


//Интерфейс и типы данных, описывающих данные покупателя

export interface IOrderInfo {
	payment: string;
	address: string;
	email: string;
	phone: string;
}

export type IDeliveryForm = Pick<IOrderInfo, 'payment' | 'address'>;
export type IDataForm = Pick<IOrderInfo, 'email' | 'phone'>;


//Интерфейс, описывающий поля заказа товара и объеденяющий поля

export interface IOrder {
	items: string[];
	total: number;
}


//Интерфейс описывающий оформление заказа

export interface IOrderResult {
	id: string;
	total: number;
}


//Тип, описывающий ошибки валидации форм
export type FormErrors = Partial<Record<keyof IOrder, string>>;


//Интерфейс, для хранения актуального состояния приложения

export interface IAppState {
	product: IProductItem[];
	basket: string[];
	preview: string | null;
	order: IOrder | null;
	orderResponse: IOrderResult | null;
}