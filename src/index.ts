import { AppState, CatalogChangeEvent } from './components/AppData';
import { IProduct, Product } from './components/Product';
import { Order } from './components/Order';
import { Page } from './components/Page';
import { WebLarekApi } from './components/WebLarekApi';
import { EventEmitter } from './components/base/events';
import { Basket } from './components/common/Basket';
import { Modal } from './components/common/Modal';
import { Success } from './components/common/Success';
import './scss/styles.scss';
import { IDataForm, IDeliveryForm, IOrderForm } from './types';
import { API_URL, CDN_URL } from './utils/constants';
import { cloneTemplate, ensureElement } from './utils/utils';

//Константы
const api = new WebLarekApi(CDN_URL, API_URL);
const events = new EventEmitter();

// Глобальные контейнеры
const modal = new Modal(ensureElement<HTMLElement>('#modal-container'), events);
const page = new Page(document.body, events);

// Шаблоны
const cardCatalogTemplate = ensureElement<HTMLTemplateElement>('#card-catalog');
const cardBasketTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#card-preview');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const orderTemplate = ensureElement<HTMLTemplateElement>('#order');
const contactsTemplate = ensureElement<HTMLTemplateElement>('#contacts');
const successTemplate = ensureElement<HTMLTemplateElement>('#success');

// Модель данных приложения
const appData = new AppState({}, events);

// Переиспользуемые части интерфейса
const basket = new Basket(cloneTemplate(basketTemplate), events);
const order = new Order(cloneTemplate(orderTemplate), events);
const contacts = new Order(cloneTemplate(contactsTemplate), events);
const success = new Success(cloneTemplate(successTemplate), {
	onClick: () => modal.close(),
});


// Мониторинг отладки
events.onAll(({ eventName, data }) => {
	console.log(eventName, data);
});

//API  Получение списка карточек продуктов
api
	.getProductItems()
	.then(appData.setProduct.bind(appData))
	.catch(console.error);

// Открытие попапа карточки каталога
events.on('card:select', (item: IProduct) => {
	console.log('Product selected:', item);
	appData.setPreview(item);
});

// Выбор и открытие карточки товара
events.on('preview:changed', (item: IProduct) => {
	const card = new Product(cloneTemplate(cardPreviewTemplate), {
	  onClick: () => {
		events.emit('card:toBasket', item);
  
		card.buttonTitle = appData.basket.includes(item) 
		  ? 'Удалить из корзины' 
		  : 'В корзину';
	  },
	});
  
	modal.render({
	  content: card.render(item),
	});
  });

// Блокировка модального окна
events.on('modal:open', () => {
		page.locked = true;
 });
// Разблокировка модального окна
events.on('modal:close', () =>  {
	  page.locked = false;
 });

// Переключатель в/из корзины
events.on('card:toBasket', (item: IProduct) => {
	const isItemInBasket = appData.basket.includes(item);
  
	if (!isItemInBasket) {
	  appData.addToBasket(item);
	  events.emit('product:add', item); // Сообщаем об добавлении товара
	} else {
	  appData.removeFromBasket(item); // Удаляем товар из корзины
	  events.emit('product:delete', item); // Сообщаем об удалении товара
	}
  });

// Открытие корзины
events.on('basket:open', () => {
	basket.selected = appData.basket;
	modal.render({
		content: basket.render({}),
	});
});

// В корзину
events.on('product:add', (item: IProduct) => {
	appData.addToBasket(item);
	//modal.close();
});

// Из корзины
events.on('product:delete', (item: IProduct) => {
	appData.removeFromBasket(item);
	basket.selected = appData.basket;
});


// Обновление корзины
events.on('basket:changed', (items: IProduct[]) => {
	page.counter = appData.basket.length;
	basket.items = items.map((item, basketProductIndex) => {
		const card = new Product(cloneTemplate(cardBasketTemplate), {
			onClick: () => {
				events.emit('product:delete', item);
			},
		});
		return card.render({
			basketProductIndex: (basketProductIndex + 1).toString(),
			title: item.title,
			price: item.price,
		});
	});
	const total = items.reduce((total, item) => total + item.price, 0);
	basket.total = total;
	appData.order.total = total;
});

events.on('order:open', () => {
	appData.order.items = appData.basket.map((item) => item.id);
	modal.render({
		content: order.render({
			payment: '',
			address: '',
			valid: false,
			errors: [],
		}),
	});
});
  

// Отправка формы
events.on('order:submit', () => {
	appData.contactsReset();
	modal.render({
		content: contacts.render({
			email: '',
			phone: '',
			valid: false,
			errors: [],
		}),
	});
});

// Выбор способа оплаты
events.on('order.payment:change', ({ name }: { name: string }) => {
	appData.order.payment = name;
	appData.validateOrderForm();
});

// Состояние валидации формы заказа
const validateField = (fields: Partial<IOrderForm>) => {
	return Object.values(fields)
	  .filter(Boolean)
	  .join('; ');
  };
  
  events.on('formErrors:change', (errors: Partial<IOrderForm>) => {
	const { payment, address, email, phone } = errors;
  
	order.valid = !payment && !address;
	order.errors = validateField({ payment, address });
  
	contacts.valid = !email && !phone;
	contacts.errors = validateField({ email, phone });
  });
  

// Изменение полей
events.on(
	/^order\..*:change/,
	(data: { field: keyof IDeliveryForm; value: string }) => {
		appData.setOrderField(data.field, data.value);
	}
);

events.on(
	/^contacts\..*:change/,
	(data: { field: keyof IDataForm; value: string }) => {
		appData.setOrderField(data.field, data.value);
	}
);

/// Подтверждение заказа
events.on('contacts:submit', async () => {
	try {
	  await api.order(appData.order);
	  
	  success.total = `Списано ${appData.order.total} синапсов`;
	  appData.clearBasket();
	  
	  modal.render({
		content: success.render({}),
	  });
	} catch (err) {
	  console.error(err);
	}
  });
  
// Изменение карточек
events.on<CatalogChangeEvent>('items:changed', () => {
	page.catalog = appData.catalog.map((item) => {
		const card = new Product(cloneTemplate(cardCatalogTemplate), {
			onClick: () => events.emit('card:select', item),
		});

		return card.render({
			category: item.category,
			title: item.title,
			image: item.image,
			price: item.price,
		});
	});
});
