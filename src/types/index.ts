//Интерфейс и типы данных, описывающих карточку товара

export interface IProductItem {
	id: string;
	title: string;
	image: string;
	category: string;
	description: string;
	price: number | null;
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
export type IOrderForm = IDeliveryForm & IDataForm;

//Интерфейс описывающий оформление заказа

export interface IOrder extends IOrderForm {
	items: string[];
	total: number;
}

//Интерфейс описывающий результат оформления заказа

export interface IOrderResult {
	id: string;
	total: number;
}
export type ISuccess = Pick<IOrderResult, 'total'>;


//Тип, описывающий ошибки валидации форм
export type FormErrors = Partial<Record<keyof IOrder, string>>;


//Интерфейс, для хранения актуального состояния приложения

export interface IAppState {
	catalog: ICatalog[];
	basket: IBasket[];
	preview: string | null;
	order: IOrder | null;
	orderResponse: IOrderResult | null;
	loading: boolean;
}