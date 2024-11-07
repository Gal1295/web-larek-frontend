import './scss/styles.scss';
import { WebLarekApi } from './components/WebLarekApi';
import { API_URL, CDN_URL } from './utils/constants';
import { EventEmitter } from './components/base/events';
import { AppState, CatalogChangeEvent } from './components/AppData';
import { Page } from './components/Page';
import { cloneTemplate, createElement, ensureElement } from './utils/utils';
import { Modal } from './components/common/Modal';
import { Product, IProduct } from './components/Card';
import { Basket } from './components/common/Basket';
import { Order } from './components/Order';
import { Success } from './components/common/Success';
import { IDataForm, IDeliveryForm, IOrderForm } from './types';

//Константы
const events = new EventEmitter();
const api = new WebLarekApi(CDN_URL, API_URL);

// Шаблоны
const cardCatalogTemplate = ensureElement<HTMLTemplateElement>('#card-catalog'),
	cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#card-preview'),
	cardBasketTemplate = ensureElement<HTMLTemplateElement>('#card-basket'),
	basketTemplate = ensureElement<HTMLTemplateElement>('#basket'),
	orderTemplate = ensureElement<HTMLTemplateElement>('#order'),
	contactsTemplate = ensureElement<HTMLTemplateElement>('#contacts'),
	successTemplate = ensureElement<HTMLTemplateElement>('#success');

// Модель данных приложения
const appData = new AppState({}, events);

// Глобальные контейнеры
const page = new Page(document.body, events),
	modal = new Modal(ensureElement<HTMLElement>('#modal-container'), events);

// Переиспользуемые части интерфейса
const basket = new Basket(cloneTemplate(basketTemplate), events),
	order = new Order(cloneTemplate(orderTemplate), events),
	contacts = new Order(cloneTemplate(contactsTemplate), events),
	success = new Success(cloneTemplate(successTemplate), {
		onClick: () => {
			modal.close();
		},
	});

//API  Получение списка карточек продуктов
api
	.getProductItems()
	.then(appData.setProduct.bind(appData))
	.catch((err) => {
		console.log(err);
	});

// Мониторинг всех событий  для отладки
events.onAll(({ eventName, data }) => {
	console.log(eventName, data);
});

// Изменение элементов каталога
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

// Открытие попапа карточки каталога
events.on('card:select', (item: IProduct) => appData.setPreview(item));

// Выбор и открытие карточки товара
events.on('preview:changed', (item: IProduct) => {
	const card = new Product(cloneTemplate(cardPreviewTemplate), {
		onClick: () => {
			events.emit('card:toBasket', item);

			card.buttonTitle =
				appData.basket.indexOf(item) !== -1
					? 'Удалить из корзины'
					: 'В корзину';
		},
	});

	modal.render({
		content: card.render({
			//id: item.id,
			title: item.title,
			image: item.image,
			category: item.category,
			description: item.description,
			price: item.price,
			buttonTitle: appData.basket.includes(item)
				? 'Удалить из корзины'
				: 'В корзину',
		}),
	});
});

// Переключатель кнопок 'В корзину', 'Удалить из корзины'
events.on('card:toBasket', (item: IProduct) => {
	if (appData.basket.indexOf(item) < 0) {
		events.emit('product:add', item);
	} else {
		events.emit('product:delete', item);
	}
});

// При открытии модального окна блокируем страницу
events.on('modal:open', () => {
	page.locked = true;
});

// При закрытии модального окна разблокируем страницу
events.on('modal:close', () => {
	page.locked = false;
});

// Открытие корзины
events.on('basket:open', () => {
	basket.selected = appData.basket;
	modal.render({
		content: basket.render({}),
	});
});

// Добавление товара в корзину
events.on('product:add', (item: IProduct) => {
	appData.addToBasket(item);
	//modal.close();
});

// Удаление товара из корзины
events.on('product:delete', (item: IProduct) => {
	appData.removeFromBasket(item);
	basket.selected = appData.basket;
});

// Изменение счетчика товаров корзины
events.on('counter:changed', () => (page.counter = appData.basket.length));

// Обновление корзины
events.on('basket:changed', (items: IProduct[]) => {
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

// Открытие формы контактов
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

// Проверка выбора способа оплаты
events.on('order.payment:change', ({ name }: { name: string }) => {
	appData.order.payment = name;
	appData.validateOrderForm();
});

// Измененине состояния валидации формы
events.on('formErrors:change', (errors: Partial<IOrderForm>) => {
	const { payment, address, email, phone } = errors;

	order.valid = !payment && !address;
	order.errors = Object.values({ payment, address })
		.filter((i) => !!i)
		.join('; ');
	contacts.valid = !email && !phone;
	contacts.errors = Object.values({ phone, email })
		.filter((i) => !!i)
		.join('; ');
});

// Изменилось одно из полей форм заказа
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

/// Отправление формы заказа
events.on('contacts:submit', () => {
	api
		.order(appData.order)
		.then(() => {
			success.total = `Списано ${appData.order.total} синапсов`;
			appData.clearBasket();
			modal.render({
				content: success.render({}),
			});
		})
		.catch((err) => console.error(err));
});