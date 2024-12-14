export interface IProductItem {
	id: string;
	title: string;
	image: string;
	category: string;
	description: string;
	price: number | null;
}

export interface IBasket {
	id: string;
	title: string;
	price: number | null;
}

export interface ICatalog {
	id: string;
	title: string;
	price: number | null;
	image: string;
	category: string;
}

//Интерфейс и типы данных, описывающих данные покупателя
export interface IOrderInfo {
	payment: string;
	address: string;
	email: string;
	phone: string;
}

// Интерфейс для доставки
export interface IDeliveryForm {
	payment: string;
	address: string;
}

// Интерфейс для данных покупателя
export interface IDataForm {
	email: string;
	phone: string;
}

// Объединенный интерфейс для формы заказа
export interface IOrderForm extends IDeliveryForm, IDataForm {}

//Интерфейс описывающий оформление заказа
export interface IOrder extends IOrderForm {
	items: string[];
	total: number;
}


// Интерфейс для результата заказа
export interface IOrderResult {
	id: string;
	total: number;
  }
  
  // Интерфейс для успешного результата, содержащий только поле total
  export interface ISuccess {
	total: number;
  }
  

//Интерфейс, для хранения актуального состояния приложения
export interface IAppState {
	catalog: ICatalog[];
	basket: IBasket[];
	preview: string | null;
	order: IOrder | null;
	orderResponse: IOrderResult | null;
	loading: boolean;
}
