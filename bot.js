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
const ADMIN_ID = 8447147405;

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
    if (logs.length > 100) logs = logs.slice(-100);
    saveJson(LOG_FILE, logs);
}

// =========================
// ЯЗЫКИ
// =========================

const TEXTS = {
    ru: {
        welcome: '🏛 Solo_Men Studios\n\nПривет, {name}!\n\nМы создаём сайты, Telegram-ботов, приложения и дизайн в премиум-стиле.\n\n⚡ Быстро. Качественно. Красиво.\n\nВыбирай, что тебя интересует:',
        sites: '🌐 РАЗРАБОТКА САЙТОВ\n\n• Лендинги\n• Многостраничные\n• Интернет-магазины\n• Корпоративные\n\n💰 от 5 000 ₽\n⏱ 3–7 дней',
        bots: '🤖 РАЗРАБОТКА БОТОВ\n\n• Telegram\n• Discord\n• Для магазинов\n• Помощники\n\n💰 от 7 000 ₽\n⏱ 5–10 дней',
        apps: '📱 ПРИЛОЖЕНИЯ\n\n• Android\n• PWA\n• Web\n\n💰 от 30 000 ₽\n⏱ 2–4 недели',
        design: '🎨 ДИЗАЙН\n\n• Логотипы\n• Баннеры\n• Обложки\n• Презентации\n\n💰 от 5 000 ₽\n⏱ 1–5 дней',
        price: '💰 ПРАЙС-ЛИСТ\n\n🌐 Сайты — от 5 000 ₽\n🤖 Боты — от 7 000 ₽\n📱 Приложения — от 30 000 ₽\n🎨 Дизайн — от 5 000 ₽\n\n💳 USDT / TON',
        portfolio: '💼 НАШИ РАБОТЫ\n\n📱 Solo_Men Messenger\nsolomessenger.netlify.app\n\n🏛 Solo_Men Studios\nsozdaniesaitovbotovbtdsolomen.netlify.app\n\n🪙 BobraCoin',
        contact: '📞 СВЯЗАТЬСЯ\n\n👤 @Elohimon\n👤 @K_S_1430\n\n📧 bobratoken@gmail.com\n📢 @BobraCoin',
        faq: '❓ FAQ\n\n💰 Сайт от 5к, бот от 7к, приложение от 30к.\n⏱ Сайт 3-7 дней, бот 5-10 дней.\n💳 USDT/TON, предоплата 50%.',
        about: '🏛 SOLO_MEN STUDIOS\n\nСтудия разработки из Дагестана.\n\nОснователь: Тимур (Solo_Men).\n\n✨ Делаем технологии красиво.',
        menuBtn: '🏠 Главное меню.',
        orderStep1: '📋 ЗАЯВКА\n\nШаг 1 из 4.\n\nЧто нужно: сайт, бот, приложение, дизайн?\n\n/cancel — отмена',
        orderStep2: '✅ Шаг 2 из 4.\n\nОпиши подробнее:',
        orderStep3: '✅ Шаг 3 из 4.\n\nБюджет?\n\n• до 10 000\n• 10 000–30 000\n• 30 000–50 000\n• более 50 000\n• не знаю',
        orderStep4: '✅ Шаг 4 из 4.\n\nКонтакт (Telegram или телефон):',
        orderDone: '🎉 ЗАЯВКА #{id} ОТПРАВЛЕНА!\n\nМы свяжемся с тобой.',
        cancelled: '❌ Отменено.',
        noActiveOrder: 'Нет активной заявки.',
        promoEnter: '🎁 Введи промокод:\n\n/cancel — отмена',
        promoOk: '🎉 ПРОМОКОД АКТИВИРОВАН!\n\n🎁 {code}\n💰 Скидка: {discount}%',
        promoNotFound: '❌ Промокод не найден.',
        supportAsk: '💬 Напиши свой вопрос — мы ответим в ближайшее время.\n\n/cancel — отмена',
        supportSent: '✅ Сообщение отправлено! Мы ответим скоро.',
        calcStep1: '🧮 КАЛЬКУЛЯТОР\n\nШаг 1 из 3.\n\nЧто нужно: сайт / бот / приложение / дизайн?\n\n/cancel — отмена',
        calcStep2: '✅ Шаг 2 из 3.\n\nСложность проекта:\n\n• простой (1)\n• средний (2)\n• сложный (3)\n\nНапиши 1, 2 или 3',
        calcStep3: '✅ Шаг 3 из 3.\n\nСрочность:\n\n• нет (1)\n• 3-5 дней (2)\n• 1-2 дня (3)\n\nНапиши 1, 2 или 3',
        langChoose: '🌐 Выбери язык / Choose language:'
    },
    en: {
        welcome: '🏛 Solo_Men Studios\n\nHi, {name}!\n\nWe create websites, Telegram bots, apps and design in premium style.\n\n⚡ Fast. Quality. Beautiful.\n\nChoose what interests you:',
        sites: '🌐 WEBSITE DEVELOPMENT\n\n• Landing pages\n• Multi-page\n• Online stores\n• Corporate\n\n💰 from 5 000 ₽\n⏱ 3-7 days',
        bots: '🤖 BOT DEVELOPMENT\n\n• Telegram\n• Discord\n• For stores\n• Assistants\n\n💰 from 7 000 ₽\n⏱ 5-10 days',
        apps: '📱 APPS\n\n• Android\n• PWA\n• Web\n\n💰 from 30 000 ₽\n⏱ 2-4 weeks',
        design: '🎨 DESIGN\n\n• Logos\n• Banners\n• Covers\n• Presentations\n\n💰 from 5 000 ₽\n⏱ 1-5 days',
        price: '💰 PRICE LIST\n\n🌐 Websites — from 5k\n🤖 Bots — from 7k\n📱 Apps — from 30k\n🎨 Design — from 5k\n\n💳 USDT / TON',
        portfolio: '💼 OUR WORKS\n\n📱 Solo_Men Messenger\nsolomessenger.netlify.app\n\n🏛 Solo_Men Studios\nsozdaniesaitovbotovbtdsolomen.netlify.app\n\n🪙 BobraCoin',
        contact: '📞 CONTACT\n\n👤 @Elohimon\n👤 @K_S_1430\n\n📧 bobratoken@gmail.com\n📢 @BobraCoin',
        faq: '❓ FAQ\n\n💰 Website from 5k, bot from 7k, app from 30k.\n⏱ Website 3-7 days.\n💳 USDT/TON, 50% prepayment.',
        about: '🏛 SOLO_MEN STUDIOS\n\nDevelopment studio from Dagestan.\n\nFounder: Timur (Solo_Men).\n\n✨ We make technologies beautiful.',
        menuBtn: '🏠 Main menu.',
        orderStep1: '📋 REQUEST\n\nStep 1 of 4.\n\nWhat: website, bot, app, design?\n\n/cancel — cancel',
        orderStep2: '✅ Step 2 of 4.\n\nDescribe:',
        orderStep3: '✅ Step 3 of 4.\n\nBudget?\n\n• up to 10k\n• 10k–30k\n• 30k–50k\n• more than 50k\n• not sure',
        orderStep4: '✅ Step 4 of 4.\n\nContact (Telegram or phone):',
        orderDone: '🎉 REQUEST #{id} SENT!\n\nWe will contact you.',
        cancelled: '❌ Cancelled.',
        noActiveOrder: 'No active request.',
        promoEnter: '🎁 Enter promo code:\n\n/cancel — cancel',
        promoOk: '🎉 PROMO ACTIVATED!\n\n🎁 {code}\n💰 Discount: {discount}%',
        promoNotFound: '❌ Promo not found.',
        supportAsk: '💬 Write your question:\n\n/cancel — cancel',
        supportSent: '✅ Message sent! We will reply.',
        calcStep1: '🧮 CALCULATOR\n\nStep 1 of 3.\n\nWhat: website / bot / app / design?\n\n/cancel — cancel',
        calcStep2: '✅ Step 2 of 3.\n\nComplexity:\n\n• simple (1)\n• medium (2)\n• complex (3)\n\nSend 1, 2 or 3',
        calcStep3: '✅ Step 3 of 3.\n\nUrgency:\n\n• no (1)\n• 3-5 days (2)\n• 1-2 days (3)\n\nSend 1, 2 or 3',
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
    const isAdmin = userId === ADMIN_ID;
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
    if (isAdmin) {
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
// АДМИН-ПАНЕЛЬ (через кнопки)
// =========================

function adminMenu() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📋 Заявки', callback_data: 'admin_apps' }],
                [{ text: '🎁 Промокоды', callback_data: 'admin_promos' }],
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

bot.onText(/^\/admin$/, (msg) => {
    if (msg.chat.id !== ADMIN_ID) return;
    bot.sendMessage(msg.chat.id, '👑 АДМИН-ПАНЕЛЬ\n\nВыбирай действие:', adminMenu());
});

bot.onText(/^👑 Админка$/, (msg) => {
    if (msg.chat.id !== ADMIN_ID) return;
    bot.sendMessage(msg.chat.id, '👑 АДМИН-ПАНЕЛЬ\n\nВыбирай действие:', adminMenu());
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
    // ЗАЯВКИ (список)
    // =========================
    if (data === 'admin_apps' && chatId === ADMIN_ID) {
        const apps = loadApps();
        if (apps.length === 0) {
            bot.answerCallbackQuery(query.id, { text: 'Заявок нет' });
            bot.sendMessage(chatId, '📭 Пока нет заявок.', adminMenu());
            return;
        }
        bot.answerCallbackQuery(query.id, { text: 'Заявки' });
        bot.sendMessage(chatId, '📋 ЗАЯВОК: ' + apps.length);

        const last = apps.slice(-5).reverse();
        for (const app of last) {
            const statusEmoji = app.status === 'new' ? '🆕' : (app.status === 'work' ? '🔨' : (app.status === 'done' ? '✅' : '❌'));
            const statusText = app.status === 'new' ? 'Новая' : (app.status === 'work' ? 'В работе' : (app.status === 'done' ? 'Выполнено' : 'Отклонено'));

            const text =
                statusEmoji + ' ЗАЯВКА #' + app.id + '\n\n' +
                '👤 ' + app.name + '\n' +
                '📱 ' + app.username + '\n' +
                '🛠 ' + app.service + '\n' +
                '💰 ' + app.budget + '\n' +
                '📞 ' + app.contact + '\n\n' +
                '📊 ' + statusText;

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

            bot.sendMessage(chatId, text, { reply_markup: { inline_keyboard: buttons } }).catch(() => {});
        }
        return;
    }

    // =========================
    // СТАТУСЫ ЗАЯВОК (кнопки исчезают)
    // =========================
    if (data.startsWith('status_') && chatId === ADMIN_ID) {
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
                '🔨 ЗАЯВКА #' + appId + '\n\n' +
                '👤 ' + app.name + '\n' +
                '📱 ' + app.username + '\n' +
                '🛠 ' + app.service + '\n' +
                '💰 ' + app.budget + '\n' +
                '📞 ' + app.contact + '\n\n' +
                '📊 Статус: 🔨 В РАБОТЕ\n' +
                '👤 Взял: ' + adminName + '\n' +
                '🕐 ' + now,
                { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [] } }
            ).catch(() => {});

            bot.answerCallbackQuery(query.id, { text: '🔨 В работе' });
            bot.sendMessage(app.userId, '🔨 Твоя заявка #' + appId + ' принята в работу!').catch(() => {});
            addLog('Заявка #' + appId + ' → В работу', adminName);

        } else if (action === 'status_done') {
            app.status = 'done';
            app.history.push({ action: 'Выполнил', admin: adminName, time: new Date().toISOString() });
            saveApps(apps);

            bot.editMessageText(
                '✅ ЗАЯВКА #' + appId + '\n\n' +
                '👤 ' + app.name + '\n' +
                '📱 ' + app.username + '\n' +
                '🛠 ' + app.service + '\n' +
                '💰 ' + app.budget + '\n' +
                '📞 ' + app.contact + '\n\n' +
                '📊 Статус: ✅ ВЫПОЛНЕНО\n' +
                '👤 Выполнил: ' + adminName + '\n' +
                '🕐 ' + now,
                { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [] } }
            ).catch(() => {});

            bot.answerCallbackQuery(query.id, { text: '✅ Выполнено' });
            bot.sendMessage(app.userId, '✅ Твоя заявка #' + appId + ' выполнена! Спасибо!').catch(() => {});
            addLog('Заявка #' + appId + ' → Выполнено', adminName);

        } else if (action === 'status_reject') {
            app.status = 'rejected';
            app.history.push({ action: 'Отклонил', admin: adminName, time: new Date().toISOString() });
            saveApps(apps);

            bot.editMessageText(
                '❌ ЗАЯВКА #' + appId + '\n\n' +
                '👤 ' + app.name + '\n' +
                '📱 ' + app.username + '\n' +
                '🛠 ' + app.service + '\n\n' +
                '📊 Статус: ❌ ОТКЛОНЕНО\n' +
                '👤 Отклонил: ' + adminName + '\n' +
                '🕐 ' + now,
                { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [] } }
            ).catch(() => {});

            bot.answerCallbackQuery(query.id, { text: '❌ Отклонено' });
            addLog('Заявка #' + appId + ' → Отклонено', adminName);
        }
        return;
    }

    // =========================
    // ОТВЕТИТЬ КЛИЕНТУ
    // =========================
    if (data.startsWith('reply_') && chatId === ADMIN_ID) {
        const clientId = data.replace('reply_', '');
        userStates[ADMIN_ID] = { step: 'admin_reply', clientId: clientId };
        bot.answerCallbackQuery(query.id, { text: 'Напиши ответ' });
        bot.sendMessage(chatId, '💬 Напиши ответ клиенту (ID: ' + clientId + '):\n\n/cancel — отмена');
        return;
    }

    // =========================
    // ПРОМОКОДЫ
    // =========================
    if (data === 'admin_promos' && chatId === ADMIN_ID) {
        bot.answerCallbackQuery(query.id, { text: 'Промокоды' });
        bot.sendMessage(chatId, '🎁 УПРАВЛЕНИЕ ПРОМОКОДАМИ\n\nВыбирай действие:', promosMenu());
        return;
    }

    if (data === 'promo_create' && chatId === ADMIN_ID) {
        userStates[ADMIN_ID] = { step: 'promo_code' };
        bot.answerCallbackQuery(query.id, { text: 'Создание' });
        bot.sendMessage(chatId, '➕ СОЗДАНИЕ ПРОМОКОДА\n\nШаг 1 из 2.\n\nНапиши КОД промокода (например: BOBR10)\n\n/cancel — отмена');
        return;
    }

    if (data === 'promo_list' && chatId === ADMIN_ID) {
        const promos = loadPromos();
        const keys = Object.keys(promos);
        bot.answerCallbackQuery(query.id, { text: 'Список' });
        if (keys.length === 0) {
            bot.sendMessage(chatId, '📭 Нет промокодов.', promosMenu());
            return;
        }
        let text = '🎁 ПРОМОКОДЫ\n\n';
        keys.forEach(c => {
            text += '🔹 ' + c + ' — ' + promos[c].discount + '% (исп: ' + promos[c].uses + ')\n';
        });
        bot.sendMessage(chatId, text, promosMenu());
        return;
    }

    if (data === 'promo_del_list' && chatId === ADMIN_ID) {
        const promos = loadPromos();
        const keys = Object.keys(promos);
        bot.answerCallbackQuery(query.id, { text: 'Удаление' });
        if (keys.length === 0) {
            bot.sendMessage(chatId, '📭 Нет промокодов.', promosMenu());
            return;
        }
        const buttons = keys.map(c => [{ text: '🗑 ' + c + ' (' + promos[c].discount + '%)', callback_data: 'promo_del_' + c }]);
        buttons.push([{ text: '⬅️ Назад', callback_data: 'admin_promos' }]);
        bot.sendMessage(chatId, '🗑 ВЫБЕРИ ПРОМОКОД ДЛЯ УДАЛЕНИЯ:', { reply_markup: { inline_keyboard: buttons } });
        return;
    }

    if (data.startsWith('promo_del_') && chatId === ADMIN_ID) {
        const code = data.replace('promo_del_', '');
        const promos = loadPromos();
        if (promos[code]) {
            delete promos[code];
            savePromos(promos);
            addLog('Промокод удалён: ' + code, adminName);
            bot.answerCallbackQuery(query.id, { text: 'Удалён' });
            bot.sendMessage(chatId, '✅ Промокод ' + code + ' удалён.\n👤 ' + adminName, promosMenu());
        }
        return;
    }

    if (data === 'promo_edit_list' && chatId === ADMIN_ID) {
        const promos = loadPromos();
        const keys = Object.keys(promos);
        bot.answerCallbackQuery(query.id, { text: 'Редактирование' });
        if (keys.length === 0) {
            bot.sendMessage(chatId, '📭 Нет промокодов.', promosMenu());
            return;
        }
        const buttons = keys.map(c => [{ text: '✏️ ' + c + ' (' + promos[c].discount + '%)', callback_data: 'promo_edit_' + c }]);
        buttons.push([{ text: '⬅️ Назад', callback_data: 'admin_promos' }]);
        bot.sendMessage(chatId, '✏️ ВЫБЕРИ ПРОМОКОД ДЛЯ РЕДАКТИРОВАНИЯ:', { reply_markup: { inline_keyboard: buttons } });
        return;
    }

    if (data.startsWith('promo_edit_') && chatId === ADMIN_ID) {
        const code = data.replace('promo_edit_', '');
        userStates[ADMIN_ID] = { step: 'promo_edit_discount', promoCode: code };
        bot.answerCallbackQuery(query.id, { text: 'Редактирование' });
        bot.sendMessage(chatId, '✏️ РЕДАКТИРОВАНИЕ ' + code + '\n\nНапиши новую скидку в % (1–100):\n\n/cancel — отмена');
        return;
    }

    // =========================
    // РАССЫЛКА
    // =========================
    if (data === 'admin_broadcast' && chatId === ADMIN_ID) {
        userStates[ADMIN_ID] = { step: 'broadcast_text' };
        bot.answerCallbackQuery(query.id, { text: 'Рассылка' });
        bot.sendMessage(chatId, '📢 РАССЫЛКА\n\nНапиши текст:\n\n/cancel — отмена');
        return;
    }

    // =========================
    // СТАТИСТИКА
    // =========================
    if (data === 'admin_stats' && chatId === ADMIN_ID) {
        const users = loadUsers();
        const apps = loadApps();
        const promos = loadPromos();
        const tickets = loadTickets();
        const n = apps.filter(a => a.status === 'new').length;
        const w = apps.filter(a => a.status === 'work').length;
        const d = apps.filter(a => a.status === 'done').length;
        const openTickets = tickets.filter(t => t.status === 'open').length;

        bot.answerCallbackQuery(query.id, { text: 'Статистика' });
        bot.sendMessage(chatId,
            '📊 СТАТИСТИКА\n\n' +
            '👥 Пользователей: ' + users.length + '\n' +
            '📋 Заявок: ' + apps.length + '\n' +
            '   🆕 ' + n + ' | 🔨 ' + w + ' | ✅ ' + d + '\n' +
            '🎁 Промокодов: ' + Object.keys(promos).length + '\n' +
            '💬 Открытых тикетов: ' + openTickets + '\n' +
            '📅 ' + new Date().toLocaleDateString('ru-RU'),
            adminMenu()
        );
        return;
    }

    // =========================
    // ЛОГИ
    // =========================
    if (data === 'admin_logs' && chatId === ADMIN_ID) {
        const logs = loadJson(LOG_FILE) || [];
        bot.answerCallbackQuery(query.id, { text: 'Логи' });
        if (logs.length === 0) {
            bot.sendMessage(chatId, '📭 Логов нет.', adminMenu());
            return;
        }
        let text = '📜 ПОСЛЕДНИЕ 20 ДЕЙСТВИЙ:\n\n';
        logs.slice(-20).reverse().forEach(l => {
            text += '• ' + l.admin + ' — ' + l.action + '\n' +
                '  🕐 ' + new Date(l.time).toLocaleString('ru-RU') + '\n\n';
        });
        bot.sendMessage(chatId, text, adminMenu());
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
        bot.editMessageText('👑 АДМИН-ПАНЕЛЬ\n\nВыбирай действие:', {
            chat_id: chatId,
            message_id: query.message.message_id,
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
        bot.sendMessage(chatId, '✅ Язык: Русский', mainMenu(userId));
        return;
    }
    if (data === 'lang_en') {
        setLang(userId, 'en');
        bot.answerCallbackQuery(query.id, { text: '🇬🇧 English' });
        bot.sendMessage(chatId, '✅ Language: English', mainMenu(userId));
        return;
    }

    // =========================
    // ЗАКРЫТИЕ ТИКЕТА
    // =========================
    if (data.startsWith('ticket_close_') && chatId === ADMIN_ID) {
        const ticketId = data.replace('ticket_close_', '');
        const tickets = loadTickets();
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
            ticket.status = 'closed';
            saveTickets(tickets);
            addLog('Тикет закрыт: #' + ticketId, adminName);
            bot.answerCallbackQuery(query.id, { text: 'Закрыт' });
            bot.sendMessage(chatId, '✅ Тикет #' + ticketId + ' закрыт.\n👤 ' + adminName);
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
                    '🎉 ПО ТВОЕЙ ССЫЛКЕ ПРИШЁЛ ДРУГ!\n\n👤 ID: ' + userId + '\n💰 Тебе скидка 5%!\n👥 Всего: ' + ref.invited.length
                ).catch(() => {});
                bot.sendMessage(chatId, '🎁 Ты пришёл по реферальной ссылке! Скидка 5% на первый заказ.');
            }
        }
    }

    const langs = loadLangs();
    if (!langs[userId]) {
        bot.sendMessage(chatId, '🌐 Выбери язык / Choose language:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🇷🇺 Русский', callback_data: 'lang_ru' }],
                    [{ text: '🇬🇧 English', callback_data: 'lang_en' }]
                ]
            }
        });
        return;
    }

    bot.sendMessage(chatId, t(userId, 'welcome', { name: name }), mainMenu(userId));
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
        '👤 ТВОЙ ПРОФИЛЬ\n\n' +
        '📛 ' + name + '\n' +
        '📱 ' + userTag + '\n' +
        '🆔 ' + userId + '\n\n' +
        '📋 Заявок: ' + apps.length + '\n' +
        '   🆕 ' + newA + ' | 🔨 ' + workA + ' | ✅ ' + doneA + '\n\n' +
        '👥 Приглашено: ' + myRef.invited.length + '\n\n' +
        '🔗 Реф-ссылка:\nt.me/SoloMenStudiosBot?start=' + myRef.code,
        backMenu(userId)
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
        '🔗 ТВОЯ РЕФЕРАЛЬНАЯ ССЫЛКА\n\n' +
        't.me/SoloMenStudiosBot?start=' + myRef.code + '\n\n' +
        'Отправь другу. Когда он зайдёт — ты получишь скидку 5%.\n\n' +
        '👥 Уже приглашено: ' + myRef.invited.length,
        backMenu(userId)
    );
}

// =========================
// СМЕНА ЯЗЫКА
// =========================

bot.onText(/^🌐 Язык \/ Language$/, (msg) => {
    bot.sendMessage(msg.chat.id, '🌐 Выбери язык / Choose language:', {
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
    bot.sendMessage(chatId, t(chatId, 'supportAsk'), backMenu(chatId));
});

// =========================
// НАВИГАЦИЯ
// =========================

bot.onText(/^🏠 Главное меню\.$/, (msg) => {
    delete userStates[msg.chat.id];
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'menuBtn'), mainMenu(msg.chat.id));
});

bot.onText(/^⬅️ Назад$/, (msg) => {
    delete userStates[msg.chat.id];
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'menuBtn'), mainMenu(msg.chat.id));
});

// =========================
// ПРОМОКОД
// =========================

bot.onText(/^🎁 Ввести промокод$/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'promo' };
    bot.sendMessage(chatId, t(chatId, 'promoEnter'), backMenu(chatId));
});

// =========================
// РАЗДЕЛЫ
// =========================

bot.onText(/^🌐 Сайты$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'sites'), backMenu(msg.chat.id));
});

bot.onText(/^🤖 Боты$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'bots'), backMenu(msg.chat.id));
});

bot.onText(/^📱 Приложения$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'apps'), backMenu(msg.chat.id));
});

bot.onText(/^🎨 Дизайн$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'design'), backMenu(msg.chat.id));
});

bot.onText(/^💰 Прайс-лист$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'price'), backMenu(msg.chat.id));
});

bot.onText(/^💼 Портфолио$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'portfolio'), backMenu(msg.chat.id));
});

bot.onText(/^📞 Связаться$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'contact'), backMenu(msg.chat.id));
});

bot.onText(/^❓ FAQ$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'faq'), backMenu(msg.chat.id));
});

bot.onText(/^🏛 О студии$/, (msg) => {
    bot.sendMessage(msg.chat.id, t(msg.chat.id, 'about'), backMenu(msg.chat.id));
});

// =========================
// 🧮 КАЛЬКУЛЯТОР
// =========================

bot.onText(/^🧮 Калькулятор$/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'calc_type' };
    bot.sendMessage(chatId, t(chatId, 'calcStep1'), backMenu(chatId));
});

// =========================
// ЗАЯВКА
// =========================

bot.onText(/^📋 Оставить заявку$/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'service' };
    bot.sendMessage(chatId, t(chatId, 'orderStep1'));
});

bot.onText(/^\/cancel$/, (msg) => {
    const chatId = msg.chat.id;
    if (userStates[chatId]) {
        delete userStates[chatId];
        bot.sendMessage(chatId, t(chatId, 'cancelled'), mainMenu(chatId));
    } else {
        bot.sendMessage(chatId, t(chatId, 'noActiveOrder'), mainMenu(chatId));
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
        const code = text.toUpperCase();
        const promos = loadPromos();
        if (promos[code] && promos[code].active) {
            promos[code].uses++;
            savePromos(promos);
            bot.sendMessage(chatId, t(chatId, 'promoOk', { code: code, discount: promos[code].discount }), mainMenu(chatId));
        } else {
            bot.sendMessage(chatId, t(chatId, 'promoNotFound'), mainMenu(chatId));
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
            '💬 СООБЩЕНИЕ В ПОДДЕРЖКУ #' + ticketId + '\n\n' +
            '👤 ' + (msg.from.first_name || 'Клиент') + '\n' +
            '📱 ' + (msg.from.username ? '@' + msg.from.username : 'без username') + '\n' +
            '🆔 ' + userId + '\n\n📝 ' + text;

        const keyboard = {
            inline_keyboard: [
                [{ text: '💬 Ответить', callback_data: 'reply_' + userId }],
                [{ text: '✅ Закрыть тикет', callback_data: 'ticket_close_' + ticketId }]
            ]
        };

        bot.sendMessage(ADMIN_ID, adminText, { reply_markup: keyboard }).catch(() => {});
        bot.sendMessage(chatId, t(chatId, 'supportSent'), mainMenu(chatId));
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
        bot.sendMessage(chatId, t(chatId, 'calcStep2'));
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
        bot.sendMessage(chatId, t(chatId, 'calcStep3'));
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

        bot.sendMessage(chatId,
            '🧮 РАСЧЁТ СТОИМОСТИ\n\n' +
            '📋 Услуга: ' + state.calcType + '\n' +
            '⚙️ Сложность: ' + state.calcComplexity + '/3\n' +
            '⚡ Срочность: ' + urgent + '/3\n\n' +
            '💰 ПРИМЕРНАЯ СТОИМОСТЬ:\n' +
            '💵 ' + price.toLocaleString('ru-RU') + ' ₽\n\n' +
            'Точную цену скажем после обсуждения ТЗ.\n\n' +
            'Хочешь оставить заявку? Нажми «📋 Оставить заявку».',
            mainMenu(chatId)
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
        bot.sendMessage(chatId, t(chatId, 'orderStep2'));
        return;
    }

    if (state.step === 'desc') {
        state.desc = text;
        state.step = 'budget';
        bot.sendMessage(chatId, t(chatId, 'orderStep3'));
        return;
    }

    if (state.step === 'budget') {
        state.budget = text;
        state.step = 'contact';
        bot.sendMessage(chatId, t(chatId, 'orderStep4'));
        return;
    }

    // ЗАЯВКА — ФИНАЛ
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
            '🔥 НОВАЯ ЗАЯВКА #' + appId + '\n\n' +
            '👤 ' + fromName + '\n📱 ' + fromUsername + '\n🆔 ' + userId + '\n\n' +
            '🛠 ' + state.service + '\n📝 ' + state.desc + '\n💰 ' + state.budget + '\n📞 ' + state.contact;

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
            await bot.sendMessage(ADMIN_ID, adminText, { reply_markup: keyboard });

            const amount = getPriceForService(state.service);
            if (amount > 0 && CRYPTOBOT_TOKEN) {
                const invoice = await createInvoice(amount, 'Заявка #' + appId + ' — ' + state.service);
                if (invoice && invoice.bot_invoice_url) {
                    await bot.sendMessage(chatId,
                        '🎉 ЗАЯВКА #' + appId + ' ОТПРАВЛЕНА!\n\n💳 Оплата: ' + amount + ' USDT\n\nНажми кнопку чтобы оплатить:',
                        { reply_markup: { inline_keyboard: [[{ text: '💳 Оплатить ' + amount + ' USDT', url: invoice.bot_invoice_url }]] } }
                    );
                    await bot.sendMessage(chatId, t(chatId, 'menuBtn'), mainMenu(chatId));
                } else {
                    await bot.sendMessage(chatId, t(chatId, 'orderDone', { id: appId }), mainMenu(chatId));
                }
            } else {
                await bot.sendMessage(chatId, t(chatId, 'orderDone', { id: appId }), mainMenu(chatId));
            }
            delete userStates[chatId];
        } catch (e) {
            console.log('Ошибка:', e.message);
            bot.sendMessage(chatId, '❌ Ошибка. Попробуй ещё раз.', mainMenu(chatId));
        }
        return;
    }

    // =========================
    // АДМИН — ОТВЕТ КЛИЕНТУ
    // =========================
    if (state.step === 'admin_reply' && chatId === ADMIN_ID) {
        const clientId = state.clientId;
        try {
            await bot.sendMessage(clientId, '💬 ОТВЕТ ОТ SOLO_MEN STUDIOS\n\n' + text);
            bot.sendMessage(chatId, '✅ Отправлено клиенту ' + clientId, adminMenu());
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
    if (state.step === 'broadcast_text' && chatId === ADMIN_ID) {
        const allUsers = loadUsers();
        await bot.sendMessage(chatId, '📢 Рассылка на ' + allUsers.length + '...');
        let sent = 0, failed = 0;
        for (const userId of allUsers) {
            try {
                await bot.sendMessage(userId, text);
                sent++;
                await new Promise(r => setTimeout(r, 1500));
            } catch (e) { failed++; }
        }
        addLog('Рассылка: ' + sent + '/' + allUsers.length, msg.from.first_name || 'Админ');
        bot.sendMessage(chatId, '✅ Отправлено: ' + sent + '\n❌ Ошибок: ' + failed, adminMenu());
        delete userStates[chatId];
        return;
    }

    // =========================
    // АДМИН — СОЗДАНИЕ ПРОМОКОДА
    // =========================
    if (state.step === 'promo_code' && chatId === ADMIN_ID) {
        const code = text.toUpperCase().replace(/\s/g, '');
        state.promoCode = code;
        state.step = 'promo_discount';
        bot.sendMessage(chatId, '➕ Шаг 2 из 2.\n\nНапиши скидку в % (1–100):');
        return;
    }

    if (state.step === 'promo_discount' && chatId === ADMIN_ID) {
        const discount = parseInt(text);
        if (!discount || discount < 1 || discount > 100) {
            bot.sendMessage(chatId, '❌ Введи число 1–100.');
            return;
        }
        const promos = loadPromos();
        if (promos[state.promoCode]) {
            bot.sendMessage(chatId, '❌ Промокод уже есть.', promosMenu());
            delete userStates[chatId];
            return;
        }
        promos[state.promoCode] = {
            discount, created: new Date().toISOString(),
            createdBy: msg.from.first_name || 'Админ',
            uses: 0, active: true
        };
        savePromos(promos);
        addLog('Промокод создан: ' + state.promoCode + ' (' + discount + '%)', msg.from.first_name || 'Админ');
        bot.sendMessage(chatId, '✅ ПРОМОКОД СОЗДАН\n\n🎁 ' + state.promoCode + '\n💰 Скидка: ' + discount + '%', promosMenu());
        delete userStates[chatId];
        return;
    }

    // =========================
    // АДМИН — РЕДАКТИРОВАНИЕ ПРОМОКОДА
    // =========================
    if (state.step === 'promo_edit_discount' && chatId === ADMIN_ID) {
        const discount = parseInt(text);
        if (!discount || discount < 1 || discount > 100) {
            bot.sendMessage(chatId, '❌ Введи число 1–100.');
            return;
        }
        const promos = loadPromos();
        if (promos[state.promoCode]) {
            promos[state.promoCode].discount = discount;
            savePromos(promos);
            addLog('Промокод ' + state.promoCode + ' → ' + discount + '%', msg.from.first_name || 'Админ');
            bot.sendMessage(chatId, '✅ Промокод обновлён → ' + discount + '%', promosMenu());
        } else {
            bot.sendMessage(chatId, '❌ Не найден.', promosMenu());
        }
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
