const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const http = require('http');
const https = require('https');

// =========================
// МИНИ ВЕБ-СЕРВЕР (Render)
// =========================

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Solo_Men Studios Bot is running!');
}).listen(PORT, () => {
    console.log('Веб-сервер на порту ' + PORT);
});

// =========================
// КОНФИГ
// =========================

const TOKEN = process.env.BOT_TOKEN;
const CRYPTOBOT_TOKEN = process.env.CRYPTOBOT_TOKEN;
const SUPER_ADMIN_ID = 8447147405;

const bot = new TelegramBot(TOKEN, { polling: true });
console.log('Solo_Men Studios Bot запущен!');

// =========================
// ФАЙЛЫ
// =========================

const USERS_FILE = 'users.json';
const PROMOS_FILE = 'promos.json';
const APPS_FILE = 'applications.json';
const REFS_FILE = 'referrals.json';
const TICKETS_FILE = 'tickets.json';
const LANG_FILE = 'langs.json';
const LOG_FILE = 'log.json';
const ADMINS_FILE = 'admins.json';

function loadJson(file) {
    try {
        if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) { console.log('Ошибка ' + file + ':', e.message); }
    return null;
}

function saveJson(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (e) { console.log('Ошибка ' + file + ':', e.message); }
}

function loadUsers() { return loadJson(USERS_FILE) || []; }
function saveUsers(u) { saveJson(USERS_FILE, u); }
function addUser(chatId) {
    const users = loadUsers();
    if (!users.includes(chatId)) {
        users.push(chatId);
        saveUsers(users);
        console.log('+Юзер ' + chatId + '. Всего: ' + users.length);
    }
}

function loadPromos() { return loadJson(PROMOS_FILE) || {}; }
function savePromos(p) { saveJson(PROMOS_FILE, p); }
function loadApps() { return loadJson(APPS_FILE) || []; }
function saveApps(a) { saveJson(APPS_FILE, a); }
function loadRefs() { return loadJson(REFS_FILE) || {}; }
function saveRefs(r) { saveJson(REFS_FILE, r); }
function loadTickets() { return loadJson(TICKETS_FILE) || []; }
function saveTickets(t) { saveJson(TICKETS_FILE, t); }
function loadLangs() { return loadJson(LANG_FILE) || {}; }
function saveLangs(l) { saveJson(LANG_FILE, l); }

function addLog(action, admin) {
    const logs = loadJson(LOG_FILE) || [];
    logs.push({ action, admin: admin || 'Админ', time: new Date().toISOString() });
    if (logs.length > 200) logs = logs.slice(-200);
    saveJson(LOG_FILE, logs);
}

// =========================
// СИСТЕМА АДМИНОВ
// =========================

function loadAdmins() {
    let admins = loadJson(ADMINS_FILE);
    if (!admins || !Array.isArray(admins)) {
        admins = [SUPER_ADMIN_ID];
        saveJson(ADMINS_FILE, admins);
    }
    if (!admins.includes(SUPER_ADMIN_ID)) {
        admins.push(SUPER_ADMIN_ID);
        saveJson(ADMINS_FILE, admins);
    }
    return admins;
}

function saveAdmins(admins) { saveJson(ADMINS_FILE, admins); }
function isAdmin(userId) { return loadAdmins().includes(userId); }
function isSuperAdmin(userId) { return userId === SUPER_ADMIN_ID; }

// =========================
// ЯЗЫКИ
// =========================

const TEXTS = {
    ru: {
        welcome: '🏛 <b>Solo_Men Studios</b>\n\n👋 Привет, {name}!\n\nМы создаём <b>сайты</b>, <b>Telegram-ботов</b>, <b>приложения</b> и <b>дизайн</b> в премиум-стиле.\n\n⚡ Быстро\n💎 Качественно\n🎨 Красиво\n\n<i>Выбирай, что тебя интересует:</i>',
        sites: '🌐 <b>РАЗРАБОТКА САЙТОВ</b>\n\n┣ Лендинги\n┣ Многостраничные сайты\n┣ Интернет-магазины\n┗ Корпоративные\n\n💰 <b>Цена:</b> от 5 000 ₽\n⏱ <b>Срок:</b> 3–7 дней\n\n📦 <b>Что входит:</b>\n┣ Дизайн\n┣ Вёрстка\n┣ Адаптив под телефон\n┣ Хостинг + домен\n┗ Обучение',
        bots: '🤖 <b>РАЗРАБОТКА БОТОВ</b>\n\n┣ Telegram-боты\n┣ Discord-боты\n┣ Боты для магазинов\n┗ Боты-помощники\n\n💰 <b>Цена:</b> от 7 000 ₽\n⏱ <b>Срок:</b> 5–10 дней',
        apps: '📱 <b>ПРИЛОЖЕНИЯ</b>\n\n┣ Android-приложения\n┣ PWA\n┗ Web-приложения\n\n💰 <b>Цена:</b> от 30 000 ₽\n⏱ <b>Срок:</b> 2–4 недели',
        design: '🎨 <b>ДИЗАЙН</b>\n\n┣ Логотипы\n┣ Баннеры\n┣ Обложки\n┗ Презентации\n\n💰 <b>Цена:</b> от 5 000 ₽\n⏱ <b>Срок:</b> 1–5 дней',
        price: '💰 <b>ПРАЙС-ЛИСТ</b>\n\n━━━━━━━━━━━━━━\n🌐 Сайты — <b>от 5 000 ₽</b>\n🤖 Боты — <b>от 7 000 ₽</b>\n📱 Приложения — <b>от 30 000 ₽</b>\n🎨 Дизайн — <b>от 5 000 ₽</b>\n━━━━━━━━━━━━━━\n\n💳 <b>Оплата:</b> USDT / TON\n📅 <b>Предоплата:</b> 50%',
        portfolio: '💼 <b>НАШИ РАБОТЫ</b>\n\n━━━━━━━━━━━━━━\n📱 <b>Solo_Men Messenger</b>\n<i>solomessenger.netlify.app</i>\n\n🏛 <b>Solo_Men Studios</b>\n<i>sozdaniesaitovbotovbtdsolomen.netlify.app</i>\n\n🪙 <b>BobraCoin</b>\n<i>Мем-коин на Solana</i>\n━━━━━━━━━━━━━━',
        contact: '📞 <b>СВЯЗАТЬСЯ С НАМИ</b>\n\n👤 <b>Основатель:</b> @Elohimon\n👤 <b>Менеджер:</b> @K_S_1430\n\n📧 <b>Email:</b> bobratoken@gmail.com\n📢 <b>Канал:</b> @BobraCoin',
        faq: '❓ <b>ЧАСТЫЕ ВОПРОСЫ</b>\n\n💰 <b>Сколько стоит?</b>\nСайт от 5к, бот от 7к, приложение от 30к.\n\n⏱ <b>Как быстро?</b>\nСайт 3-7 дней, бот 5-10 дней.\n\n💳 <b>Как оплатить?</b>\nUSDT или TON. Предоплата 50%.',
        about: '🏛 <b>SOLO_MEN STUDIOS</b>\n\nМолодая студия разработки из Дагестана.\n\n👤 <b>Основатель:</b> Тимур (Solo_Men)\n\n🎯 <b>Создаём:</b>\n┣ Сайты\n┣ Telegram-ботов\n┣ Приложения\n┗ Дизайн\n\n✨ <i>Делаем технологии красиво.</i>',
        menuBtn: '🏠 <b>Главное меню</b>',
        orderStep1: '📋 <b>ОФОРМЛЕНИЕ ЗАЯВКИ</b>\n\n━━━━━━━━━━━━━━\n<b>Шаг 1 из 4</b>\n━━━━━━━━━━━━━━\n\nЧто нужно сделать?\n\nНапиши:\n• сайт\n• бот\n• приложение\n• дизайн\n\n/cancel — отмена',
        orderStep2: '✅ <b>Отлично!</b>\n\n━━━━━━━━━━━━━━\n<b>Шаг 2 из 4</b>\n━━━━━━━━━━━━━━\n\nОпиши подробнее что нужно:',
        orderStep3: '✅ <b>Записал!</b>\n\n━━━━━━━━━━━━━━\n<b>Шаг 3 из 4</b>\n━━━━━━━━━━━━━━\n\n💰 Какой примерный бюджет?\n\n• до 10 000\n• 10 000–30 000\n• 30 000–50 000\n• более 50 000\n• не знаю',
        orderStep4: '✅ <b>Понял!</b>\n\n━━━━━━━━━━━━━━\n<b>Шаг 4 из 4</b>\n━━━━━━━━━━━━━━\n\n📞 Оставь контакт (Telegram или телефон):',
        orderDone: '🎉 <b>ЗАЯВКА #{id} ОТПРАВЛЕНА!</b>\n\nМы свяжемся с тобой в ближайшее время.\n\n💚 Спасибо что выбрал Solo_Men Studios!',
        cancelled: '❌ <b>Отменено.</b>',
        noActiveOrder: 'Нет активной заявки.',
        promoEnter: '🎁 <b>ВВОД ПРОМОКОДА</b>\n\nНапиши код:\n\n/cancel — отмена',
        promoOk: '🎉 <b>ПРОМОКОД АКТИВИРОВАН!</b>\n\n🎁 Код: <b>{code}</b>\n💰 Скидка: <b>{discount}%</b>\n\nСкидка будет применена к заказу.',
        promoNotFound: '❌ <b>Промокод не найден или неактивен.</b>',
        supportAsk: '💬 <b>НАПИСАТЬ В ПОДДЕРЖКУ</b>\n\nОпиши свой вопрос — мы ответим в ближайшее время.\n\n/cancel — отмена',
        supportSent: '✅ <b>Сообщение отправлено!</b>\n\nМы ответим тебе скоро 💚',
        calcStep1: '🧮 <b>КАЛЬКУЛЯТОР СТОИМОСТИ</b>\n\n━━━━━━━━━━━━━━\n<b>Шаг 1 из 3</b>\n━━━━━━━━━━━━━━\n\nЧто нужно сделать?\n\nНапиши: сайт / бот / приложение / дизайн\n\n/cancel — отмена',
        calcStep2: '✅ <b>Шаг 2 из 3</b>\n\n⚙️ Насколько сложный проект?\n\n• простой (1)\n• средний (2)\n• сложный (3)\n\nНапиши 1, 2 или 3',
        calcStep3: '✅ <b>Шаг 3 из 3</b>\n\n⚡ Насколько срочно?\n\n• нет (1)\n• 3-5 дней (2)\n• 1-2 дня (3)\n\nНапиши 1, 2 или 3',
        langChoose: '🌐 Выбери язык / Choose language:'
    },
    en: {
        welcome: '🏛 <b>Solo_Men Studios</b>\n\n👋 Hi, {name}!\n\nWe create <b>websites</b>, <b>Telegram bots</b>, <b>apps</b> and <b>design</b> in premium style.\n\n⚡ Fast\n💎 Quality\n🎨 Beautiful\n\n<i>Choose what interests you:</i>',
        sites: '🌐 <b>WEBSITE DEVELOPMENT</b>\n\n┣ Landing pages\n┣ Multi-page sites\n┣ Online stores\n┗ Corporate sites\n\n💰 <b>Price:</b> from 5 000 ₽\n⏱ <b>Time:</b> 3-7 days',
        bots: '🤖 <b>BOT DEVELOPMENT</b>\n\n┣ Telegram bots\n┣ Discord bots\n┣ Store bots\n┗ Assistant bots\n\n💰 <b>Price:</b> from 7 000 ₽\n⏱ <b>Time:</b> 5-10 days',
        apps: '📱 <b>APPS</b>\n\n┣ Android apps\n┣ PWA\n┗ Web apps\n\n💰 <b>Price:</b> from 30 000 ₽\n⏱ <b>Time:</b> 2-4 weeks',
        design: '🎨 <b>DESIGN</b>\n\n┣ Logos\n┣ Banners\n┣ Covers\n┗ Presentations\n\n💰 <b>Price:</b> from 5 000 ₽\n⏱ <b>Time:</b> 1-5 days',
        price: '💰 <b>PRICE LIST</b>\n\n━━━━━━━━━━━━━━\n🌐 Websites — <b>from 5k</b>\n🤖 Bots — <b>from 7k</b>\n📱 Apps — <b>from 30k</b>\n🎨 Design — <b>from 5k</b>\n━━━━━━━━━━━━━━\n\n💳 USDT / TON\n📅 Prepayment 50%',
        portfolio: '💼 <b>OUR WORKS</b>\n\n━━━━━━━━━━━━━━\n📱 <b>Solo_Men Messenger</b>\n<i>solomessenger.netlify.app</i>\n\n🏛 <b>Solo_Men Studios</b>\n<i>sozdaniesaitovbotovbtdsolomen.netlify.app</i>\n\n🪙 <b>BobraCoin</b>\n━━━━━━━━━━━━━━',
        contact: '📞 <b>CONTACT US</b>\n\n👤 <b>Founder:</b> @Elohimon\n👤 <b>Manager:</b> @K_S_1430\n\n📧 bobratoken@gmail.com\n📢 @BobraCoin',
        faq: '❓ <b>FAQ</b>\n\n💰 Website from 5k, bot from 7k, app from 30k.\n⏱ Website 3-7 days.\n💳 USDT/TON, 50% prepayment.',
        about: '🏛 <b>SOLO_MEN STUDIOS</b>\n\nDevelopment studio from Dagestan.\n\n👤 <b>Founder:</b> Timur (Solo_Men)\n\n✨ <i>We make technologies beautiful.</i>',
        menuBtn: '🏠 <b>Main menu</b>',
        orderStep1: '📋 <b>REQUEST</b>\n\n━━━━━━━━━━━━━━\n<b>Step 1 of 4</b>\n━━━━━━━━━━━━━━\n\nWhat do you need?\n\n• website\n• bot\n• app\n• design\n\n/cancel — cancel',
        orderStep2: '✅ <b>Step 2 of 4</b>\n\nDescribe:',
        orderStep3: '✅ <b>Step 3 of 4</b>\n\nBudget?\n\n• up to 10k\n• 10k–30k\n• 30k–50k\n• more than 50k\n• not sure',
        orderStep4: '✅ <b>Step 4 of 4</b>\n\nContact (Telegram or phone):',
        orderDone: '🎉 <b>REQUEST #{id} SENT!</b>\n\nWe will contact you soon.',
        cancelled: '❌ <b>Cancelled.</b>',
        noActiveOrder: 'No active request.',
        promoEnter: '🎁 <b>ENTER PROMO CODE</b>\n\nSend code:\n\n/cancel — cancel',
        promoOk: '🎉 <b>PROMO ACTIVATED!</b>\n\n🎁 {code}\n💰 Discount: <b>{discount}%</b>',
        promoNotFound: '❌ <b>Promo not found.</b>',
        supportAsk: '💬 <b>CONTACT SUPPORT</b>\n\nWrite your question:\n\n/cancel — cancel',
        supportSent: '✅ <b>Message sent!</b>',
        calcStep1: '🧮 <b>CALCULATOR</b>\n\n<b>Step 1 of 3</b>\n\nWhat: website / bot / app / design?\n\n/cancel — cancel',
        calcStep2: '✅ <b>Step 2 of 3</b>\n\nComplexity:\n\n• simple (1)\n• medium (2)\n• complex (3)\n\nSend 1, 2 or 3',
        calcStep3: '✅ <b>Step 3 of 3</b>\n\nUrgency:\n\n• no (1)\n• 3-5 days (2)\n• 1-2 days (3)\n\nSend 1, 2 or 3',
        langChoose: '🌐 Choose language / Выбери язык:'
    }
};

function getLang(userId) {
    const langs = loadLangs();
    return langs[userId] || 'ru';
}

function setLang(userId, lang) {
    const langs = loadLangs();
    langs[userId] = lang;
    saveLangs(langs);
}

function t(userId, key, vars) {
    const lang = getLang(userId);
    let text = TEXTS[lang][key] || TEXTS.ru[key] || key;
    if (vars) {
        for (const k in vars) text = text.replace('{' + k + '}', vars[k]);
    }
    return text;
}

// =========================
// МЕНЮ
// =========================

function mainMenu(userId) {
    const rows = [
        [{ text: '🌐 Сайты' }, { text: '🤖 Боты' }],
        [{ text: '📱 Приложения' }, { text: '🎨 Дизайн' }],
        [{ text: '🧮 Калькулятор' }, { text: '💰 Прайс-лист' }],
        [{ text: '💼 Портфолио' }, { text: '📋 Оставить заявку' }],
        [{ text: '📞 Связаться' }, { text: '❓ FAQ' }],
        [{ text: '🏛 О студии' }, { text: '🎁 Ввести промокод' }],
        [{ text: '👤 Профиль' }, { text: '🔗 Моя реф-ссылка' }],
        [{ text: '💬 Написать в поддержку' }, { text: '🌐 Язык / Language' }]
    ];
    if (isAdmin(userId)) {
        rows.push([{ text: '👑 Админка' }]);
    }
    return { reply_markup: { keyboard: rows, resize_keyboard: true } };
}

function backMenu(userId) {
    return { reply_markup: { keyboard: [[{ text: '🏠 Главное меню.' }]], resize_keyboard: true } };
}

const userStates = {};

bot.setMyCommands([
    { command: 'start', description: '🏛 Главное меню' },
    { command: 'profile', description: '👤 Мой профиль' },
    { command: 'myref', description: '🔗 Моя реф-ссылка' },
    { command: 'cancel', description: '❌ Отменить' }
]);// =========================
// АДМИН-ПАНЕЛЬ
// =========================

function adminMenu() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📋 Заявки', callback_data: 'admin_apps' }],
                [{ text: '🎁 Промокоды', callback_data: 'admin_promos' }],
                [{ text: '👥 Админы', callback_data: 'admin_admins' }],
                [{ text: '📢 Рассылка', callback_data: 'admin_broadcast' }],
                [{ text: '📊 Статистика', callback_data: 'admin_stats' }],
                [{ text: '📜 Логи', callback_data: 'admin_logs' }],
                [{ text: '❌ Закрыть', callback_data: 'admin_close' }]
            ]
        }
    };
}

function promosMenu() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Создать промокод', callback_data: 'promo_create' }],
                [{ text: '📋 Список промокодов', callback_data: 'promo_list' }],
                [{ text: '✏️ Редактировать', callback_data: 'promo_edit_list' }],
                [{ text: '🗑 Удалить', callback_data: 'promo_del_list' }],
                [{ text: '⬅️ Назад', callback_data: 'admin_back' }]
            ]
        }
    };
}

function adminsMenu() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Добавить админа', callback_data: 'admin_add' }],
                [{ text: '📋 Список админов', callback_data: 'admin_list' }],
                [{ text: '🗑 Удалить админа', callback_data: 'admin_del_list' }],
                [{ text: '⬅️ Назад', callback_data: 'admin_back' }]
            ]
        }
    };
}

// =========================
// /admin и кнопка Админка
// =========================

bot.onText(/^\/admin$/, (msg) => {
    if (!isAdmin(msg.chat.id)) return;
    bot.sendMessage(msg.chat.id, '👑 <b>АДМИН-ПАНЕЛЬ</b>\n\n<i>Выбирай действие:</i>', { parse_mode: 'HTML', ...adminMenu() });
});

bot.onText(/^👑 Админка$/, (msg) => {
    if (!isAdmin(msg.chat.id)) return;
    bot.sendMessage(msg.chat.id, '👑 <b>АДМИН-ПАНЕЛЬ</b>\n\n<i>Выбирай действие:</i>', { parse_mode: 'HTML', ...adminMenu() });
});

// =========================
// ОБРАБОТКА АДМИН-КНОПОК
// =========================

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const userId = query.from.id;
    const adminName = query.from.first_name || 'Админ';

    // =========================
    // ЗАЯВКИ
    // =========================
    if (data === 'admin_apps' && isAdmin(chatId)) {
        const apps = loadApps();
        if (apps.length === 0) {
            bot.answerCallbackQuery(query.id, { text: 'Заявок нет' });
            bot.sendMessage(chatId, '📭 <b>Пока нет заявок.</b>', { parse_mode: 'HTML', ...adminMenu() });
            return;
        }
        bot.answerCallbackQuery(query.id, { text: 'Заявки' });
        bot.sendMessage(chatId, '📋 <b>ЗАЯВОК: ' + apps.length + '</b>', { parse_mode: 'HTML' });

        const last = apps.slice(-5).reverse();
        for (const app of last) {
            const statusEmoji = app.status === 'new' ? '🆕' : (app.status === 'work' ? '🔨' : (app.status === 'done' ? '✅' : '❌'));
            const statusText = app.status === 'new' ? 'Новая' : (app.status === 'work' ? 'В работе' : (app.status === 'done' ? 'Выполнено' : 'Отклонено'));

            const text =
                statusEmoji + ' <b>ЗАЯВКА #' + app.id + '</b>\n\n' +
                '━━━━━━━━━━━━━━\n' +
                '👤 ' + app.name + '\n' +
                '📱 ' + app.username + '\n' +
                '🆔 <code>' + app.userId + '</code>\n' +
                '━━━━━━━━━━━━━━\n' +
                '🛠 <b>' + app.service + '</b>\n' +
                '📝 ' + app.desc + '\n' +
                '💰 ' + app.budget + '\n' +
                '📞 ' + app.contact + '\n' +
                '━━━━━━━━━━━━━━\n' +
                '📊 <b>' + statusText + '</b>';

            const buttons = [];
            if (app.status === 'new' || app.status === 'work') {
                buttons.push([
                    { text: '🔨 В работу', callback_data: 'status_work_' + app.id },
                    { text: '✅ Выполнено', callback_data: 'status_done_' + app.id }
                ]);
                buttons.push([
                    { text: '💬 Написать клиенту', callback_data: 'reply_' + app.userId }
                ]);
                buttons.push([
                    { text: '❌ Отклонить', callback_data: 'status_reject_' + app.id }
                ]);
            }

            bot.sendMessage(chatId, text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } }).catch(() => {});
        }
        return;
    }

    // =========================
    // СТАТУСЫ ЗАЯВОК
    // =========================
    if (data.startsWith('status_') && isAdmin(chatId)) {
        const parts = data.split('_');
        const action = parts[0] + '_' + parts[1];
        const appId = parts[2];
        const apps = loadApps();
        const app = apps.find(a => a.id === appId);
        if (!app) { bot.answerCallbackQuery(query.id, { text: '❌' }); return; }

        if (!app.history) app.history = [];
        const now = new Date().toLocaleString('ru-RU');

        if (action === 'status_work') {
            app.status = 'work';
            app.history.push({ action: 'Взял в работу', admin: adminName, time: new Date().toISOString() });
            saveApps(apps);

            bot.editMessageText(
                '🔨 <b>ЗАЯВКА #' + appId + '</b>\n\n' +
                '━━━━━━━━━━━━━━\n' +
                '👤 ' + app.name + '\n' +
                '📱 ' + app.username + '\n' +
                '🛠 ' + app.service + '\n' +
                '💰 ' + app.budget + '\n' +
                '📞 ' + app.contact + '\n' +
                '━━━━━━━━━━━━━━\n' +
                '📊 <b>В РАБОТЕ</b>\n' +
                '👤 Взял: ' + adminName + '\n' +
                '🕐 ' + now,
                { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } }
            ).catch(() => {});

            bot.answerCallbackQuery(query.id, { text: '🔨 В работе' });
            bot.sendMessage(app.userId, '🔨 <b>Твоя заявка #' + appId + ' принята в работу!</b>', { parse_mode: 'HTML' }).catch(() => {});
            addLog('Заявка #' + appId + ' → В работу', adminName);

        } else if (action === 'status_done') {
            app.status = 'done';
            app.history.push({ action: 'Выполнил', admin: adminName, time: new Date().toISOString() });
            saveApps(apps);

            bot.editMessageText(
                '✅ <b>ЗАЯВКА #' + appId + '</b>\n\n' +
                '━━━━━━━━━━━━━━\n' +
                '👤 ' + app.name + '\n' +
                '📱 ' + app.username + '\n' +
                '🛠 ' + app.service + '\n' +
                '💰 ' + app.budget + '\n' +
                '📞 ' + app.contact + '\n' +
                '━━━━━━━━━━━━━━\n' +
                '📊 <b>ВЫПОЛНЕНО</b>\n' +
                '👤 Выполнил: ' + adminName + '\n' +
                '🕐 ' + now,
                { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } }
            ).catch(() => {});

            bot.answerCallbackQuery(query.id, { text: '✅ Выполнено' });
            bot.sendMessage(app.userId, '✅ <b>Твоя заявка #' + appId + ' выполнена!</b>\n\n💚 Спасибо за заказ!', { parse_mode: 'HTML' }).catch(() => {});
            addLog('Заявка #' + appId + ' → Выполнено', adminName);

        } else if (action === 'status_reject') {
            app.status = 'rejected';
            app.history.push({ action: 'Отклонил', admin: adminName, time: new Date().toISOString() });
            saveApps(apps);

            bot.editMessageText(
                '❌ <b>ЗАЯВКА #' + appId + '</b>\n\n' +
                '👤 ' + app.name + '\n' +
                '📱 ' + app.username + '\n' +
                '🛠 ' + app.service + '\n\n' +
                '📊 <b>ОТКЛОНЕНО</b>\n' +
                '👤 Отклонил: ' + adminName + '\n' +
                '🕐 ' + now,
                { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } }
            ).catch(() => {});

            bot.answerCallbackQuery(query.id, { text: '❌ Отклонено' });
            addLog('Заявка #' + appId + ' → Отклонено', adminName);
        }
        return;
    }

    // =========================
    // ОТВЕТИТЬ КЛИЕНТУ
    // =========================
    if (data.startsWith('reply_') && isAdmin(chatId)) {
        const clientId = data.replace('reply_', '');
        userStates[chatId] = { step: 'admin_reply', clientId: clientId };
        bot.answerCallbackQuery(query.id, { text: 'Напиши ответ' });
        bot.sendMessage(chatId, '💬 <b>Напиши ответ клиенту</b> (ID: <code>' + clientId + '</code>):\n\n/cancel — отмена', { parse_mode: 'HTML' });
        return;
    }

    // =========================
    // ПРОМОКОДЫ
    // =========================
    if (data === 'admin_promos' && isAdmin(chatId)) {
        bot.answerCallbackQuery(query.id, { text: 'Промокоды' });
        bot.sendMessage(chatId, '🎁 <b>УПРАВЛЕНИЕ ПРОМОКОДАМИ</b>', { parse_mode: 'HTML', ...promosMenu() });
        return;
    }

    if (data === 'promo_create' && isAdmin(chatId)) {
        userStates[chatId] = { step: 'promo_code' };
        bot.answerCallbackQuery(query.id, { text: 'Создание' });
        bot.sendMessage(chatId, '➕ <b>СОЗДАНИЕ ПРОМОКОДА</b>\n\n<b>Шаг 1 из 2</b>\n\nНапиши КОД (например: BOBR10)\n\n/cancel — отмена', { parse_mode: 'HTML' });
        return;
    }

    if (data === 'promo_list' && isAdmin(chatId)) {
        const promos = loadPromos();
        const keys = Object.keys(promos);
        bot.answerCallbackQuery(query.id, { text: 'Список' });
        if (keys.length === 0) {
            bot.sendMessage(chatId, '📭 Нет промокодов.', promosMenu());
            return;
        }
        let text = '🎁 <b>ПРОМОКОДЫ</b>\n\n━━━━━━━━━━━━━━\n';
        keys.forEach(c => {
            text += '🔹 <b>' + c + '</b> — ' + promos[c].discount + '% (исп: ' + promos[c].uses + ')\n';
        });
        bot.sendMessage(chatId, text, { parse_mode: 'HTML', ...promosMenu() });
        return;
    }

    if (data === 'promo_del_list' && isAdmin(chatId)) {
        const promos = loadPromos();
        const keys = Object.keys(promos);
        bot.answerCallbackQuery(query.id, { text: 'Удаление' });
        if (keys.length === 0) {
            bot.sendMessage(chatId, '📭 Нет промокодов.', promosMenu());
            return;
        }
        const buttons = keys.map(c => [{ text: '🗑 ' + c + ' (' + promos[c].discount + '%)', callback_data: 'promo_del_' + c }]);
        buttons.push([{ text: '⬅️ Назад', callback_data: 'admin_promos' }]);
        bot.sendMessage(chatId, '🗑 <b>ВЫБЕРИ ПРОМОКОД ДЛЯ УДАЛЕНИЯ:</b>', { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
        return;
    }

    if (data.startsWith('promo_del_') && isAdmin(chatId)) {
        const code = data.replace('promo_del_', '');
        const promos = loadPromos();
        if (promos[code]) {
            delete promos[code];
            savePromos(promos);
            addLog('Промокод удалён: ' + code, adminName);
            bot.answerCallbackQuery(query.id, { text: 'Удалён' });
            bot.sendMessage(chatId, '✅ Промокод <b>' + code + '</b> удалён.\n👤 ' + adminName, { parse_mode: 'HTML', ...promosMenu() });
        }
        return;
    }

    if (data === 'promo_edit_list' && isAdmin(chatId)) {
        const promos = loadPromos();
        const keys = Object.keys(promos);
        bot.answerCallbackQuery(query.id, { text: 'Редактирование' });
        if (keys.length === 0) {
            bot.sendMessage(chatId, '📭 Нет промокодов.', promosMenu());
            return;
        }
        const buttons = keys.map(c => [{ text: '✏️ ' + c + ' (' + promos[c].discount + '%)', callback_data: 'promo_edit_' + c }]);
        buttons.push([{ text: '⬅️ Назад', callback_data: 'admin_promos' }]);
        bot.sendMessage(chatId, '✏️ <b>ВЫБЕРИ ПРОМОКОД ДЛЯ РЕДАКТИРОВАНИЯ:</b>', { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
        return;
    }

    if (data.startsWith('promo_edit_') && isAdmin(chatId)) {
        const code = data.replace('promo_edit_', '');
        userStates[chatId] = { step: 'promo_edit_discount', promoCode: code };
        bot.answerCallbackQuery(query.id, { text: 'Редактирование' });
        bot.sendMessage(chatId, '✏️ <b>РЕДАКТИРОВАНИЕ ' + code + '</b>\n\nНапиши новую скидку в % (1–100):\n\n/cancel — отмена', { parse_mode: 'HTML' });
        return;
    }

    // =========================
    // АДМИНЫ
    // =========================
    if (data === 'admin_admins' && isAdmin(chatId)) {
        bot.answerCallbackQuery(query.id, { text: 'Админы' });
        bot.sendMessage(chatId, '👥 <b>УПРАВЛЕНИЕ АДМИНАМИ</b>\n\n<i>Только супер-админ может добавлять/удалять:</i>', { parse_mode: 'HTML', ...adminsMenu() });
        return;
    }

    if (data === 'admin_list' && isAdmin(chatId)) {
        const admins = loadAdmins();
        bot.answerCallbackQuery(query.id, { text: 'Список' });
        let text = '👥 <b>СПИСОК АДМИНОВ</b> (' + admins.length + '):\n\n━━━━━━━━━━━━━━\n';
        admins.forEach((id, i) => {
            const mark = id === SUPER_ADMIN_ID ? ' 👑 (супер)' : '';
            text += (i + 1) + '. 🆔 <code>' + id + '</code>' + mark + '\n';
        });
        bot.sendMessage(chatId, text, { parse_mode: 'HTML', ...adminsMenu() });
        return;
    }

    if (data === 'admin_add' && isAdmin(chatId)) {
        if (!isSuperAdmin(chatId)) {
            bot.answerCallbackQuery(query.id, { text: '❌ Только супер-админ' });
            return;
        }
        userStates[chatId] = { step: 'admin_add_id' };
        bot.answerCallbackQuery(query.id, { text: 'Добавление' });
        bot.sendMessage(chatId,
            '➕ <b>ДОБАВЛЕНИЕ АДМИНА</b>\n\n' +
            'Отправь ID пользователя (только цифры).\n\n' +
            '⚠️ <i>Username не подойдёт — только цифры!</i>\n' +
            'Как узнать: пусть человек напишет @userinfobot в Telegram.\n\n' +
            '/cancel — отмена',
            { parse_mode: 'HTML' }
        );
        return;
    }

    if (data === 'admin_del_list' && isAdmin(chatId)) {
        if (!isSuperAdmin(chatId)) {
            bot.answerCallbackQuery(query.id, { text: '❌ Только супер-админ' });
            return;
        }
        const admins = loadAdmins().filter(id => id !== SUPER_ADMIN_ID);
        bot.answerCallbackQuery(query.id, { text: 'Удаление' });
        if (admins.length === 0) {
            bot.sendMessage(chatId, '📭 Нет других админов (кроме тебя).', adminsMenu());
            return;
        }
        const buttons = admins.map(id => [{ text: '🗑 ' + id, callback_data: 'admin_del_' + id }]);
        buttons.push([{ text: '⬅️ Назад', callback_data: 'admin_admins' }]);
        bot.sendMessage(chatId, '🗑 <b>ВЫБЕРИ АДМИНА ДЛЯ УДАЛЕНИЯ:</b>', { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
        return;
    }

    if (data.startsWith('admin_del_') && isAdmin(chatId)) {
        if (!isSuperAdmin(chatId)) {
            bot.answerCallbackQuery(query.id, { text: '❌ Только супер-админ' });
            return;
        }
        const delId = parseInt(data.replace('admin_del_', ''));
        let admins = loadAdmins();
        if (admins.includes(delId) && delId !== SUPER_ADMIN_ID) {
            admins = admins.filter(id => id !== delId);
            saveAdmins(admins);
            addLog('Админ удалён: ' + delId, adminName);
            bot.answerCallbackQuery(query.id, { text: 'Удалён' });
            bot.sendMessage(chatId, '✅ Админ <code>' + delId + '</code> удалён.', { parse_mode: 'HTML', ...adminsMenu() });
        } else {
            bot.answerCallbackQuery(query.id, { text: '❌ Нельзя удалить' });
        }
        return;
    }

    // =========================
    // РАССЫЛКА
    // =========================
    if (data === 'admin_broadcast' && isAdmin(chatId)) {
        userStates[chatId] = { step: 'broadcast_text' };
        bot.answerCallbackQuery(query.id, { text: 'Рассылка' });
        bot.sendMessage(chatId, '📢 <b>РАССЫЛКА</b>\n\nНапиши текст:\n\n/cancel — отмена', { parse_mode: 'HTML' });
        return;
    }

    // =========================
    // СТАТИСТИКА
    // =========================
    if (data === 'admin_stats' && isAdmin(chatId)) {
        const users = loadUsers();
        const apps = loadApps();
        const promos = loadPromos();
        const tickets = loadTickets();
        const n = apps.filter(a => a.status === 'new').length;
        const w = apps.filter(a => a.status === 'work').length;
        const d = apps.filter(a => a.status === 'done').length;
        const r = apps.filter(a => a.status === 'rejected').length;
        const openTickets = tickets.filter(t => t.status === 'open').length;
        const logs = loadJson(LOG_FILE) || [];

        let logText = '';
        if (logs.length > 0) {
            logText = '\n\n📜 <b>Последние действия:</b>\n';
            logs.slice(-5).reverse().forEach(l => {
                logText += '• ' + l.admin + ' — ' + l.action + '\n';
            });
        }

        bot.answerCallbackQuery(query.id, { text: 'Статистика' });
        bot.sendMessage(chatId,
            '📊 <b>СТАТИСТИКА SOLO_MEN</b>\n\n' +
            '━━━━━━━━━━━━━━\n' +
            '👥 Пользователей: <b>' + users.length + '</b>\n' +
            '📋 Заявок: <b>' + apps.length + '</b>\n' +
            '   🆕 ' + n + ' | 🔨 ' + w + ' | ✅ ' + d + ' | ❌ ' + r + '\n' +
            '🎁 Промокодов: <b>' + Object.keys(promos).length + '</b>\n' +
            '💬 Открытых тикетов: <b>' + openTickets + '</b>\n' +
            '👑 Админов: <b>' + loadAdmins().length + '</b>\n' +
            '📅 ' + new Date().toLocaleDateString('ru-RU') +
            logText,
            { parse_mode: 'HTML', ...adminMenu() }
        );
        return;
    }

    // =========================
    // ЛОГИ
    // =========================
    if (data === 'admin_logs' && isAdmin(chatId)) {
        const logs = loadJson(LOG_FILE) || [];
        bot.answerCallbackQuery(query.id, { text: 'Логи' });
        if (logs.length === 0) {
            bot.sendMessage(chatId, '📭 Логов нет.', adminMenu());
            return;
        }
        let text = '📜 <b>ПОСЛЕДНИЕ 20 ДЕЙСТВИЙ:</b>\n\n━━━━━━━━━━━━━━\n';
        logs.slice(-20).reverse().forEach(l => {
            text += '👤 <b>' + l.admin + '</b>\n' +
                '📌 ' + l.action + '\n' +
                '🕐 ' + new Date(l.time).toLocaleString('ru-RU') + '\n\n';
        });
        bot.sendMessage(chatId, text, { parse_mode: 'HTML', ...adminMenu() });
        return;
    }

    // =========================
    // ЗАКРЫТЬ / НАЗАД
    // =========================
    if (data === 'admin_close') {
        bot.answerCallbackQuery(query.id, { text: 'Закрыто' });
        bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
        return;
    }

    if (data === 'admin_back') {
        bot.answerCallbackQuery(query.id, { text: 'Назад' });
        bot.editMessageText('👑 <b>АДМИН-ПАНЕЛЬ</b>\n\n<i>Выбирай действие:</i>', {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: 'HTML',
            reply_markup: adminMenu().reply_markup
        }).catch(() => {});
        return;
    }

    // =========================
    // ЯЗЫК
    // =========================
    if (data === 'lang_ru') {
        setLang(userId, 'ru');
        bot.answerCallbackQuery(query.id, { text: '🇷🇺 Русский' });
        bot.sendMessage(chatId, '✅ <b>Язык:</b> Русский', { parse_mode: 'HTML', ...mainMenu(userId) });
        return;
    }
    if (data === 'lang_en') {
        setLang(userId, 'en');
        bot.answerCallbackQuery(query.id, { text: '🇬🇧 English' });
        bot.sendMessage(chatId, '✅ <b>Language:</b> English', { parse_mode: 'HTML', ...mainMenu(userId) });
        return;
    }

    // =========================
    // ЗАКРЫТИЕ ТИКЕТА
    // =========================
    if (data.startsWith('ticket_close_') && isAdmin(chatId)) {
        const ticketId = data.replace('ticket_close_', '');
        const tickets = loadTickets();
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
            ticket.status = 'closed';
            saveTickets(tickets);
            addLog('Тикет закрыт: #' + ticketId, adminName);
            bot.answerCallbackQuery(query.id, { text: 'Закрыт' });
            bot.sendMessage(chatId, '✅ Тикет <b>#' + ticketId + '</b> закрыт.\n👤 ' + adminName, { parse_mode: 'HTML' });
        }
        return;
    }
});// =========================
// /start с реферальной ссылкой
// =========================

bot.onText(/^\/start(.*)$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const name = msg.from.first_name || 'друг';
    const param = (match[1] || '').trim();

    addUser(chatId);
    delete userStates[chatId];

    if (param && param.startsWith('ref_')) {
        const referrerId = param.replace('ref_', '');
        if (referrerId !== String(userId)) {
            const refs = loadRefs();
            const ref = refs[referrerId] || { code: param, invited: [] };
            if (!ref.invited.includes(userId)) {
                ref.invited.push(userId);
                refs[referrerId] = ref;
                saveRefs(refs);
                bot.sendMessage(referrerId,
                    '🎉 <b>ПО ТВОЕЙ ССЫЛКЕ ПРИШЁЛ ДРУГ!</b>\n\n' +
                    '👤 ID: <code>' + userId + '</code>\n' +
                    '💰 Тебе скидка <b>5%</b>!\n' +
                    '👥 Всего: <b>' + ref.invited.length + '</b>',
                    { parse_mode: 'HTML' }
                ).catch(() => {});
                bot.sendMessage(chatId, '🎁 <b>Ты пришёл по реферальной ссылке!</b>\n\nСкидка <b>5%</b> на первый заказ.', { parse_mode: 'HTML' });
            }
        }
    }

    const langs = loadLangs();
    if (!langs[userId]) {
        bot.sendMessage(chatId, '🌐 <b>Выбери язык / Choose language:</b>', {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🇷🇺 Русский', callback_data: 'lang_ru' }],
                    [{ text: '🇬🇧 English', callback_data: 'lang_en' }]
                ]
            }
        });
        return;
    }

    bot.sendMessage(chatId, t(userId, 'welcome', { name: name }), { parse_mode: 'HTML', ...mainMenu(userId) });
});

// =========================
// /profile
// =========================

bot.onText(/^\/profile$/, (msg) => {
    showProfile(msg.chat.id, msg.from.id, msg.from.first_name, msg.from.username);
});

bot.onText(/^👤 Профиль$/, (msg) => {
    showProfile(msg.chat.id, msg.from.id, msg.from.first_name, msg.from.username);
});

function showProfile(chatId, userId, firstName, username) {
    const name = firstName || 'Не указано';
    const userTag = username ? '@' + username : 'без username';

    const apps = loadApps().filter(a => a.userId === userId);
    const refs = loadRefs();
    const myRef = refs[userId] || { code: 'ref_' + userId, invited: [] };
    if (!refs[userId]) { refs[userId] = myRef; saveRefs(refs); }

    const newA = apps.filter(a => a.status === 'new').length;
    const workA = apps.filter(a => a.status === 'work').length;
    const doneA = apps.filter(a => a.status === 'done').length;

    bot.sendMessage(chatId,
        '👤 <b>ТВОЙ ПРОФИЛЬ</b>\n\n' +
        '━━━━━━━━━━━━━━\n' +
        '📛 <b>' + name + '</b>\n' +
        '📱 ' + userTag + '\n' +
        '🆔 <code>' + userId + '</code>\n' +
        '━━━━━━━━━━━━━━\n' +
        '📋 Заявок: <b>' + apps.length + '</b>\n' +
        '   🆕 ' + newA + ' | 🔨 ' + workA + ' | ✅ ' + doneA + '\n\n' +
        '👥 Приглашено: <b>' + myRef.invited.length + '</b>\n\n' +
        '🔗 <b>Реф-ссылка:</b>\n<code>t.me/SoloMenStudiosBot?start=' + myRef.code + '</code>',
        { parse_mode: 'HTML', ...backMenu(userId) }
    );
}

// =========================
// /myref
// =========================

bot.onText(/^\/myref$/, (msg) => {
    showRef(msg.chat.id, msg.from.id);
});

bot.onText(/^🔗 Моя реф-ссылка$/, (msg) => {
    showRef(msg.chat.id, msg.from.id);
});

function showRef(chatId, userId) {
    const refs = loadRefs();
    const myRef = refs[userId] || { code: 'ref_' + userId, invited: [] };
    if (!refs[userId]) { refs[userId] = myRef; saveRefs(refs); }

    bot.sendMessage(chatId,
        '🔗 <b>ТВОЯ РЕФЕРАЛЬНАЯ ССЫЛКА</b>\n\n' +
        '━━━━━━━━━━━━━━\n' +
        '<code>t.me/SoloMenStudiosBot?start=' + myRef.code + '</code>\n' +
        '━━━━━━━━━━━━━━\n\n' +
        '📌 Отправь другу.\n' +
        '🎁 Когда он зайдёт — <b>ты получишь скидку 5%</b>.\n\n' +
        '👥 Уже приглашено: <b>' + myRef.invited.length + '</b>',
        { parse_mode: 'HTML', ...backMenu(userId) }
    );
}

// =========================
// СМЕНА ЯЗЫКА
// =========================

bot.onText(/^🌐 Язык \/ Language$/, (msg) => {
    bot.sendMessage(msg.chat.id, '🌐 <b>Выбери язык / Choose language:</b>', {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🇷🇺 Русский', callback_data: 'lang_ru' }],
                [{ text: '🇬🇧 English', callback_data: 'lang_en' }]
            ]
        }
    });
});

// =========================
// ПОДДЕРЖКА
// =========================

bot.onText(/^💬 Написать в поддержку$/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'support_msg' };
    bot.sendMessage(chatId, t(chatId, 'supportAsk'), { parse_mode: 'HTML', ...backMenu(chatId) });
});

// =========================
// НАВИГАЦИЯ
// =========================

bot.onText(/^🏠 Главное меню\.$/, (msg) => {
    delete userStates[msg.chat.id];
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'menuBtn'), { parse_mode: 'HTML', ...mainMenu(msg.chat.id) });
});

bot.onText(/^⬅️ Назад$/, (msg) => {
    delete userStates[msg.chat.id];
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'menuBtn'), { parse_mode: 'HTML', ...mainMenu(msg.chat.id) });
});

// =========================
// ПРОМОКОД
// =========================

bot.onText(/^🎁 Ввести промокод$/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'promo' };
    bot.sendMessage(chatId, t(chatId, 'promoEnter'), { parse_mode: 'HTML', ...backMenu(chatId) });
});

// =========================
// РАЗДЕЛЫ
// =========================

bot.onText(/^🌐 Сайты$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'sites'), { parse_mode: 'HTML', ...backMenu(msg.chat.id) });
});

bot.onText(/^🤖 Боты$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'bots'), { parse_mode: 'HTML', ...backMenu(msg.chat.id) });
});

bot.onText(/^📱 Приложения$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'apps'), { parse_mode: 'HTML', ...backMenu(msg.chat.id) });
});

bot.onText(/^🎨 Дизайн$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'design'), { parse_mode: 'HTML', ...backMenu(msg.chat.id) });
});

bot.onText(/^💰 Прайс-лист$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'price'), { parse_mode: 'HTML', ...backMenu(msg.chat.id) });
});

bot.onText(/^💼 Портфолио$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'portfolio'), { parse_mode: 'HTML', ...backMenu(msg.chat.id) });
});

bot.onText(/^📞 Связаться$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'contact'), { parse_mode: 'HTML', ...backMenu(msg.chat.id) });
});

bot.onText(/^❓ FAQ$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'faq'), { parse_mode: 'HTML', ...backMenu(msg.chat.id) });
});

bot.onText(/^🏛 О студии$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'about'), { parse_mode: 'HTML', ...backMenu(msg.chat.id) });
});

// =========================
// КАЛЬКУЛЯТОР
// =========================

bot.onText(/^🧮 Калькулятор$/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'calc_type' };
    bot.sendMessage(chatId, t(chatId, 'calcStep1'), { parse_mode: 'HTML', ...backMenu(chatId) });
});

// =========================
// ЗАЯВКА
// =========================

bot.onText(/^📋 Оставить заявку$/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'service' };
    bot.sendMessage(chatId, t(chatId, 'orderStep1'), { parse_mode: 'HTML' });
});

bot.onText(/^\/cancel$/, (msg) => {
    const chatId = msg.chat.id;
    if (userStates[chatId]) {
        delete userStates[chatId];
        bot.sendMessage(chatId, t(chatId, 'cancelled'), { parse_mode: 'HTML', ...mainMenu(chatId) });
    } else {
        bot.sendMessage(chatId, t(chatId, 'noActiveOrder'), { parse_mode: 'HTML', ...mainMenu(chatId) });
    }
});// =========================
// CRYPTOBOT — ОПЛАТА
// =========================

function cryptoRequest(method, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const req = https.request({
            hostname: 'pay.crypt.bot',
            path: '/api/' + method,
            method: 'POST',
            headers: {
                'Crypto-Pay-API-Token': CRYPTOBOT_TOKEN,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let response = '';
            res.on('data', chunk => response += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(response)); }
                catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function createInvoice(amount, description) {
    try {
        const result = await cryptoRequest('createInvoice', {
            asset: 'USDT',
            amount: String(amount),
            description: description,
            payload: 'order_' + Date.now(),
            expires_in: 3600
        });
        if (result.ok && result.result) return result.result;
        console.log('Ошибка счёта:', JSON.stringify(result));
        return null;
    } catch (e) {
        console.log('Ошибка CryptoBot:', e.message);
        return null;
    }
}

const SERVICE_PRICES = {
    'сайт': 60, 'website': 60, 'site': 60,
    'бот': 80, 'bot': 80,
    'приложение': 350, 'app': 350,
    'дизайн': 60, 'design': 60
};

function getPriceForService(service) {
    const s = (service || '').toLowerCase().trim();
    for (const key in SERVICE_PRICES) {
        if (s.includes(key)) return SERVICE_PRICES[key];
    }
    return 0;
}

// =========================
// ОБРАБОТКА СООБЩЕНИЙ
// =========================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return;
    if (!userStates[chatId]) return;

    const state = userStates[chatId];

    // =========================
    // ПРОМОКОД
    // =========================
    if (state.step === 'promo') {
        const code = text.toUpperCase().trim();
        const promos = loadPromos();
        if (promos[code] && promos[code].active) {
            promos[code].uses++;
            savePromos(promos);
            bot.sendMessage(chatId, t(chatId, 'promoOk', { code: code, discount: promos[code].discount }), { parse_mode: 'HTML', ...mainMenu(chatId) });
        } else {
            bot.sendMessage(chatId, t(chatId, 'promoNotFound'), { parse_mode: 'HTML', ...mainMenu(chatId) });
        }
        delete userStates[chatId];
        return;
    }

    // =========================
    // ПОДДЕРЖКА
    // =========================
    if (state.step === 'support_msg') {
        const tickets = loadTickets();
        const ticketId = Date.now().toString().slice(-6);
        tickets.push({
            id: ticketId, userId, name: msg.from.first_name || 'Клиент',
            username: msg.from.username ? '@' + msg.from.username : 'без username',
            message: text, status: 'open', created: new Date().toISOString()
        });
        saveTickets(tickets);

        const adminText =
            '💬 <b>НОВОЕ СООБЩЕНИЕ В ПОДДЕРЖКУ #' + ticketId + '</b>\n\n' +
            '━━━━━━━━━━━━━━\n' +
            '👤 ' + (msg.from.first_name || 'Клиент') + '\n' +
            '📱 ' + (msg.from.username ? '@' + msg.from.username : 'без username') + '\n' +
            '🆔 <code>' + userId + '</code>\n' +
            '━━━━━━━━━━━━━━\n' +
            '📝 ' + text;

        const keyboard = {
            inline_keyboard: [
                [{ text: '💬 Ответить', callback_data: 'reply_' + userId }],
                [{ text: '✅ Закрыть тикет', callback_data: 'ticket_close_' + ticketId }]
            ]
        };

        bot.sendMessage(SUPER_ADMIN_ID, adminText, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
        bot.sendMessage(chatId, t(chatId, 'supportSent'), { parse_mode: 'HTML', ...mainMenu(chatId) });
        delete userStates[chatId];
        return;
    }

    // =========================
    // КАЛЬКУЛЯТОР — ШАГ 1
    // =========================
    if (state.step === 'calc_type') {
        const type = text.toLowerCase().trim();
        const validTypes = ['сайт', 'бот', 'приложение', 'дизайн', 'site', 'bot', 'app', 'design'];
        if (!validTypes.includes(type)) {
            bot.sendMessage(chatId, '❌ Напиши: сайт / бот / приложение / дизайн');
            return;
        }
        state.calcType = type;
        state.step = 'calc_complexity';
        bot.sendMessage(chatId, t(chatId, 'calcStep2'), { parse_mode: 'HTML' });
        return;
    }

    // КАЛЬКУЛЯТОР — ШАГ 2
    if (state.step === 'calc_complexity') {
        const complexity = parseInt(text);
        if (![1, 2, 3].includes(complexity)) {
            bot.sendMessage(chatId, '❌ Напиши 1, 2 или 3');
            return;
        }
        state.calcComplexity = complexity;
        state.step = 'calc_urgent';
        bot.sendMessage(chatId, t(chatId, 'calcStep3'), { parse_mode: 'HTML' });
        return;
    }

    // КАЛЬКУЛЯТОР — ШАГ 3 (расчёт)
    if (state.step === 'calc_urgent') {
        const urgent = parseInt(text);
        if (![1, 2, 3].includes(urgent)) {
            bot.sendMessage(chatId, '❌ Напиши 1, 2 или 3');
            return;
        }

        const BASE = {
            'сайт': 5000, 'site': 5000,
            'бот': 7000, 'bot': 7000,
            'приложение': 30000, 'app': 30000,
            'дизайн': 5000, 'design': 5000
        };

        let price = BASE[state.calcType] || 5000;
        price *= state.calcComplexity;
        if (urgent === 2) price *= 1.3;
        if (urgent === 3) price *= 1.7;
        price = Math.round(price / 500) * 500;

        const urgencyText = urgent === 1 ? 'Обычная' : (urgent === 2 ? '3-5 дней' : '1-2 дня');

        bot.sendMessage(chatId,
            '🧮 <b>РАСЧЁТ СТОИМОСТИ</b>\n\n' +
            '━━━━━━━━━━━━━━\n' +
            '📋 Услуга: <b>' + state.calcType + '</b>\n' +
            '⚙️ Сложность: <b>' + state.calcComplexity + '/3</b>\n' +
            '⚡ Срочность: <b>' + urgencyText + '</b>\n' +
            '━━━━━━━━━━━━━━\n\n' +
            '💰 <b>ПРИМЕРНАЯ СТОИМОСТЬ:</b>\n' +
            '💵 <b>' + price.toLocaleString('ru-RU') + ' ₽</b>\n\n' +
            '📌 Точную цену скажем после обсуждения ТЗ.\n\n' +
            '🎯 Хочешь оставить заявку? Нажми <b>«📋 Оставить заявку»</b>.',
            { parse_mode: 'HTML', ...mainMenu(chatId) }
        );
        delete userStates[chatId];
        return;
    }

    // =========================
    // ЗАЯВКА — ШАГ 1
    // =========================
    if (state.step === 'service') {
        state.service = text;
        state.step = 'desc';
        bot.sendMessage(chatId, t(chatId, 'orderStep2'), { parse_mode: 'HTML' });
        return;
    }

    if (state.step === 'desc') {
        state.desc = text;
        state.step = 'budget';
        bot.sendMessage(chatId, t(chatId, 'orderStep3'), { parse_mode: 'HTML' });
        return;
    }

    if (state.step === 'budget') {
        state.budget = text;
        state.step = 'contact';
        bot.sendMessage(chatId, t(chatId, 'orderStep4'), { parse_mode: 'HTML' });
        return;
    }

    // =========================
    // ЗАЯВКА — ФИНАЛ
    // =========================
    if (state.step === 'contact') {
        state.contact = text;
        const appId = Date.now().toString().slice(-6);
        const fromName = msg.from.first_name || 'Не указано';
        const fromUsername = msg.from.username ? '@' + msg.from.username : 'без username';

        const apps = loadApps();
        apps.push({
            id: appId, userId, name: fromName, username: fromUsername,
            service: state.service, desc: state.desc, budget: state.budget,
            contact: state.contact, status: 'new', created: new Date().toISOString(),
            history: []
        });
        saveApps(apps);

        const adminText =
            '🔥 <b>НОВАЯ ЗАЯВКА #' + appId + '</b>\n\n' +
            '━━━━━━━━━━━━━━\n' +
            '👤 ' + fromName + '\n' +
            '📱 ' + fromUsername + '\n' +
            '🆔 <code>' + userId + '</code>\n' +
            '━━━━━━━━━━━━━━\n' +
            '🛠 <b>' + state.service + '</b>\n' +
            '📝 ' + state.desc + '\n' +
            '💰 ' + state.budget + '\n' +
            '📞 ' + state.contact + '\n' +
            '━━━━━━━━━━━━━━\n' +
            '📊 <b>НОВАЯ</b>';

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '🔨 В работу', callback_data: 'status_work_' + appId },
                    { text: '✅ Выполнено', callback_data: 'status_done_' + appId }
                ],
                [{ text: '💬 Написать клиенту', callback_data: 'reply_' + userId }],
                [{ text: '❌ Отклонить', callback_data: 'status_reject_' + appId }]
            ]
        };

        try {
            await bot.sendMessage(SUPER_ADMIN_ID, adminText, { parse_mode: 'HTML', reply_markup: keyboard });

            const amount = getPriceForService(state.service);
            if (amount > 0 && CRYPTOBOT_TOKEN) {
                const invoice = await createInvoice(amount, 'Заявка #' + appId + ' — ' + state.service);
                if (invoice && invoice.bot_invoice_url) {
                    await bot.sendMessage(chatId,
                        '🎉 <b>ЗАЯВКА #' + appId + ' ОТПРАВЛЕНА!</b>\n\n' +
                        '━━━━━━━━━━━━━━\n' +
                        '💳 <b>Оплата:</b> ' + amount + ' USDT\n' +
                        '━━━━━━━━━━━━━━\n\n' +
                        '👇 Нажми кнопку чтобы оплатить:',
                        {
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [[
                                    { text: '💳 Оплатить ' + amount + ' USDT', url: invoice.bot_invoice_url }
                                ]]
                            }
                        }
                    );
                    await bot.sendMessage(chatId, t(chatId, 'menuBtn'), { parse_mode: 'HTML', ...mainMenu(chatId) });
                } else {
                    await bot.sendMessage(chatId, t(chatId, 'orderDone', { id: appId }), { parse_mode: 'HTML', ...mainMenu(chatId) });
                }
            } else {
                await bot.sendMessage(chatId, t(chatId, 'orderDone', { id: appId }), { parse_mode: 'HTML', ...mainMenu(chatId) });
            }
            delete userStates[chatId];
        } catch (e) {
            console.log('Ошибка:', e.message);
            bot.sendMessage(chatId, '❌ Ошибка. Попробуй ещё раз.', mainMenu(chatId));
        }
        return;
    }    // =========================
    // АДМИН — ОТВЕТ КЛИЕНТУ
    // =========================
    if (state.step === 'admin_reply' && isAdmin(chatId)) {
        const clientId = state.clientId;
        try {
            await bot.sendMessage(clientId,
                '💬 <b>ОТВЕТ ОТ SOLO_MEN STUDIOS</b>\n\n' +
                '━━━━━━━━━━━━━━\n' +
                text + '\n' +
                '━━━━━━━━━━━━━━',
                { parse_mode: 'HTML' }
            );
            bot.sendMessage(chatId, '✅ <b>Отправлено клиенту</b> <code>' + clientId + '</code>', { parse_mode: 'HTML', ...adminMenu() });
            addLog('Ответ клиенту ' + clientId, msg.from.first_name || 'Админ');
        } catch (e) {
            bot.sendMessage(chatId, '❌ Не удалось: ' + e.message);
        }
        delete userStates[chatId];
        return;
    }

    // =========================
    // АДМИН — РАССЫЛКА
    // =========================
    if (state.step === 'broadcast_text' && isAdmin(chatId)) {
        const allUsers = loadUsers();
        await bot.sendMessage(chatId, '📢 <b>Рассылка на ' + allUsers.length + ' пользователей...</b>', { parse_mode: 'HTML' });
        let sent = 0, failed = 0;
        for (const uId of allUsers) {
            try {
                await bot.sendMessage(uId, text, { parse_mode: 'HTML' });
                sent++;
                await new Promise(r => setTimeout(r, 1500));
            } catch (e) { failed++; }
        }
        addLog('Рассылка: ' + sent + '/' + allUsers.length, msg.from.first_name || 'Админ');
        bot.sendMessage(chatId,
            '✅ <b>РАССЫЛКА ЗАВЕРШЕНА</b>\n\n' +
            '━━━━━━━━━━━━━━\n' +
            '📨 Отправлено: <b>' + sent + '</b>\n' +
            '❌ Ошибок: <b>' + failed + '</b>\n' +
            '👥 Всего: <b>' + allUsers.length + '</b>',
            { parse_mode: 'HTML', ...adminMenu() }
        );
        delete userStates[chatId];
        return;
    }

    // =========================
    // АДМИН — СОЗДАНИЕ ПРОМОКОДА (шаг 1: код)
    // =========================
    if (state.step === 'promo_code' && isAdmin(chatId)) {
        const code = text.toUpperCase().replace(/\s/g, '');
        if (code.length < 3 || code.length > 20) {
            bot.sendMessage(chatId, '❌ Код должен быть 3-20 символов. Попробуй снова:');
            return;
        }
        state.promoCode = code;
        state.step = 'promo_discount';
        bot.sendMessage(chatId, '➕ <b>Шаг 2 из 2</b>\n\nНапиши скидку в % (1–100):', { parse_mode: 'HTML' });
        return;
    }

    // АДМИН — скидка промокода (шаг 2)
    if (state.step === 'promo_discount' && isAdmin(chatId)) {
        const discount = parseInt(text);
        if (!discount || discount < 1 || discount > 100) {
            bot.sendMessage(chatId, '❌ Введи число от 1 до 100.');
            return;
        }
        const promos = loadPromos();
        if (promos[state.promoCode]) {
            bot.sendMessage(chatId, '❌ Промокод с таким кодом уже существует.', promosMenu());
            delete userStates[chatId];
            return;
        }
        promos[state.promoCode] = {
            discount,
            created: new Date().toISOString(),
            createdBy: msg.from.first_name || 'Админ',
            uses: 0,
            active: true
        };
        savePromos(promos);
        addLog('Промокод создан: ' + state.promoCode + ' (' + discount + '%)', msg.from.first_name || 'Админ');
        bot.sendMessage(chatId,
            '✅ <b>ПРОМОКОД СОЗДАН</b>\n\n' +
            '━━━━━━━━━━━━━━\n' +
            '🎁 Код: <b>' + state.promoCode + '</b>\n' +
            '💰 Скидка: <b>' + discount + '%</b>\n' +
            '👤 Создал: ' + (msg.from.first_name || 'Админ') + '\n' +
            '━━━━━━━━━━━━━━',
            { parse_mode: 'HTML', ...promosMenu() }
        );
        delete userStates[chatId];
        return;
    }

    // =========================
    // АДМИН — РЕДАКТИРОВАНИЕ ПРОМОКОДА
    // =========================
    if (state.step === 'promo_edit_discount' && isAdmin(chatId)) {
        const discount = parseInt(text);
        if (!discount || discount < 1 || discount > 100) {
            bot.sendMessage(chatId, '❌ Введи число от 1 до 100.');
            return;
        }
        const promos = loadPromos();
        if (promos[state.promoCode]) {
            promos[state.promoCode].discount = discount;
            savePromos(promos);
            addLog('Промокод ' + state.promoCode + ' → ' + discount + '%', msg.from.first_name || 'Админ');
            bot.sendMessage(chatId,
                '✅ <b>ПРОМОКОД ОБНОВЛЁН</b>\n\n' +
                '🎁 ' + state.promoCode + ' → <b>' + discount + '%</b>\n' +
                '👤 ' + (msg.from.first_name || 'Админ'),
                { parse_mode: 'HTML', ...promosMenu() }
            );
        } else {
            bot.sendMessage(chatId, '❌ Промокод не найден.', promosMenu());
        }
        delete userStates[chatId];
        return;
    }

    // =========================
    // АДМИН — ДОБАВЛЕНИЕ ID АДМИНА
    // =========================
    if (state.step === 'admin_add_id' && isAdmin(chatId)) {
        if (!isSuperAdmin(chatId)) {
            bot.sendMessage(chatId, '❌ Только супер-админ может добавлять.');
            delete userStates[chatId];
            return;
        }
        const newId = parseInt(text.trim());
        if (!newId || isNaN(newId) || newId < 100000) {
            bot.sendMessage(chatId, '❌ Введи корректный ID (только цифры, от 100000).');
            return;
        }
        const admins = loadAdmins();
        if (admins.includes(newId)) {
            bot.sendMessage(chatId, '❌ Этот ID уже админ.', adminsMenu());
            delete userStates[chatId];
            return;
        }
        admins.push(newId);
        saveAdmins(admins);
        addLog('Админ добавлен: ' + newId, msg.from.first_name || 'Супер-админ');
        bot.sendMessage(chatId,
            '✅ <b>АДМИН ДОБАВЛЕН</b>\n\n' +
            '🆔 <code>' + newId + '</code>\n\n' +
            '📌 Теперь у него есть доступ к <b>👑 Админке</b>.',
            { parse_mode: 'HTML', ...adminsMenu() }
        );
        delete userStates[chatId];
        return;
    }
});

// =========================
// ОШИБКИ
// =========================

bot.on('polling_error', (error) => {
    console.log('Polling error:', error.message);
});

process.on('uncaughtException', (error) => {
    console.error('Критическая ошибка:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});
