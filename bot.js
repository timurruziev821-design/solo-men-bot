const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const http = require('http');

// =========================
// МИНИ ВЕБ-СЕРВЕР (для Render)
// =========================

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Solo_Men Studios Bot is running!');
}).listen(PORT, () => {
    console.log('Веб-сервер запущен на порту ' + PORT);
});

// =========================
// КОНФИГ
// =========================

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 8447147405;

const bot = new TelegramBot(TOKEN, { polling: true });

console.log('Solo_Men Studios Bot запущен!');

// =========================
// ФАЙЛЫ БАЗЫ
// =========================

const USERS_FILE = 'users.json';
const PROMOS_FILE = 'promos.json';
const APPS_FILE = 'applications.json';

function loadJson(file) {
    try {
        if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) { console.log('Ошибка загрузки ' + file + ':', e.message); }
    return null;
}

function saveJson(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (e) { console.log('Ошибка сохранения ' + file + ':', e.message); }
}

// =========================
// БАЗА ПОЛЬЗОВАТЕЛЕЙ
// =========================

function loadUsers() { return loadJson(USERS_FILE) || []; }
function saveUsers(u) { saveJson(USERS_FILE, u); }

function addUser(chatId) {
    const users = loadUsers();
    if (!users.includes(chatId)) {
        users.push(chatId);
        saveUsers(users);
        console.log('Новый пользователь: ' + chatId + '. Всего: ' + users.length);
    }
}

// =========================
// БАЗА ПРОМОКОДОВ
// =========================

function loadPromos() { return loadJson(PROMOS_FILE) || {}; }
function savePromos(p) { saveJson(PROMOS_FILE, p); }

// =========================
// БАЗА ЗАЯВОК
// =========================

function loadApps() { return loadJson(APPS_FILE) || []; }
function saveApps(a) { saveJson(APPS_FILE, a); }

// =========================
// ГЛАВНОЕ МЕНЮ
// =========================

const mainMenu = {
    reply_markup: {
        keyboard: [
            [{ text: 'Сайты' }, { text: 'Боты' }],
            [{ text: 'Приложения' }, { text: 'Дизайн' }],
            [{ text: 'Прайс-лист' }, { text: 'Портфолио' }],
            [{ text: 'Оставить заявку' }, { text: 'Связаться' }],
            [{ text: 'FAQ' }, { text: 'О студии' }],
            [{ text: 'Ввести промокод' }]
        ],
        resize_keyboard: true
    }
};

const backMenu = {
    reply_markup: {
        keyboard: [[{ text: 'В меню' }]],
        resize_keyboard: true
    }
};

const userStates = {};

// =========================
// КОМАНДЫ АДМИНА
// =========================

// /broadcast — рассылка
bot.onText(/^\/broadcast (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) { bot.sendMessage(chatId, '❌ Нет прав.'); return; }

    const text = match[1];
    const allUsers = loadUsers();
    if (allUsers.length === 0) { bot.sendMessage(chatId, '❌ Нет пользователей.'); return; }

    await bot.sendMessage(chatId, '📢 Рассылка на ' + allUsers.length + ' чел...');
    let sent = 0, failed = 0;

    for (const userId of allUsers) {
        try {
            await bot.sendMessage(userId, text);
            sent++;
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) { failed++; }
    }

    bot.sendMessage(chatId, '✅ Готово\n📨 Отправлено: ' + sent + '\n❌ Ошибок: ' + failed);
});

// /stats — статистика
bot.onText(/^\/stats$/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) { bot.sendMessage(chatId, '❌ Нет прав.'); return; }

    const users = loadUsers();
    const apps = loadApps();
    const promos = loadPromos();

    const newApps = apps.filter(a => a.status === 'new').length;
    const workApps = apps.filter(a => a.status === 'work').length;
    const doneApps = apps.filter(a => a.status === 'done').length;

    bot.sendMessage(chatId,
        '📊 СТАТИСТИКА SOLO_MEN STUDIOS\n\n' +
        '👥 Пользователей: ' + users.length + '\n' +
        '📋 Всего заявок: ' + apps.length + '\n' +
        '   🆕 Новых: ' + newApps + '\n' +
        '   🔨 В работе: ' + workApps + '\n' +
        '   ✅ Выполнено: ' + doneApps + '\n\n' +
        '🎁 Промокодов: ' + Object.keys(promos).length + '\n' +
        '📅 ' + new Date().toLocaleDateString('ru-RU')
    );
});

// /newpromo КОД СКИДКА — создать промокод
bot.onText(/^\/newpromo (\S+) (\d+)$/, (msg, match) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) { bot.sendMessage(chatId, '❌ Нет прав.'); return; }

    const code = match[1].toUpperCase();
    const discount = parseInt(match[2]);

    if (discount < 1 || discount > 100) {
        bot.sendMessage(chatId, '❌ Скидка должна быть от 1 до 100.');
        return;
    }

    const promos = loadPromos();
    if (promos[code]) {
        bot.sendMessage(chatId, '❌ Промокод ' + code + ' уже существует.');
        return;
    }

    promos[code] = {
        discount: discount,
        created: new Date().toISOString(),
        uses: 0,
        active: true
    };
    savePromos(promos);

    bot.sendMessage(chatId,
        '✅ ПРОМОКОД СОЗДАН\n\n' +
        '🎁 Код: ' + code + '\n' +
        '💰 Скидка: ' + discount + '%\n' +
        '📅 ' + new Date().toLocaleDateString('ru-RU')
    );
});

// /delpromo КОД — удалить промокод
bot.onText(/^\/delpromo (\S+)$/, (msg, match) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) { bot.sendMessage(chatId, '❌ Нет прав.'); return; }

    const code = match[1].toUpperCase();
    const promos = loadPromos();

    if (!promos[code]) {
        bot.sendMessage(chatId, '❌ Промокод ' + code + ' не найден.');
        return;
    }

    delete promos[code];
    savePromos(promos);
    bot.sendMessage(chatId, '✅ Промокод ' + code + ' удалён.');
});

// /promos — список промокодов
bot.onText(/^\/promos$/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) { bot.sendMessage(chatId, '❌ Нет прав.'); return; }

    const promos = loadPromos();
    const keys = Object.keys(promos);

    if (keys.length === 0) {
        bot.sendMessage(chatId, '📭 Нет активных промокодов.');
        return;
    }

    let text = '🎁 АКТИВНЫЕ ПРОМОКОДЫ\n\n';
    keys.forEach(code => {
        const p = promos[code];
        text += '🔹 ' + code + '\n';
        text += '   Скидка: ' + p.discount + '%\n';
        text += '   Использований: ' + p.uses + '\n\n';
    });

    bot.sendMessage(chatId, text);
});

// /admin — панель заявок
bot.onText(/^\/admin$/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) { bot.sendMessage(chatId, '❌ Нет прав.'); return; }

    const apps = loadApps();
    if (apps.length === 0) {
        bot.sendMessage(chatId, '📭 Пока нет заявок.');
        return;
    }

    bot.sendMessage(chatId, '👑 АДМИН-ПАНЕЛЬ\n\nВсего заявок: ' + apps.length + '\nПоказываю последние 5:');

    const last = apps.slice(-5).reverse();
    last.forEach((app, i) => {
        const statusEmoji = app.status === 'new' ? '🆕' : (app.status === 'work' ? '🔨' : '✅');
        const statusText = app.status === 'new' ? 'Новая' : (app.status === 'work' ? 'В работе' : 'Выполнена');

        const text =
            statusEmoji + ' ЗАЯВКА #' + (apps.length - i) + '\n\n' +
            '👤 ' + app.name + '\n' +
            '📱 ' + app.username + '\n' +
            '🆔 ' + app.userId + '\n\n' +
            '🛠 ' + app.service + '\n' +
            '📝 ' + app.desc + '\n' +
            '💰 ' + app.budget + '\n' +
            '📞 ' + app.contact + '\n\n' +
            '📊 Статус: ' + statusText;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '🔨 В работу', callback_data: 'status_work_' + app.id },
                    { text: '✅ Выполнено', callback_data: 'status_done_' + app.id }
                ],
                [
                    { text: '💬 Написать', url: 'https://t.me/' + app.username.replace('@', '') }
                ]
            ]
        };

        bot.sendMessage(chatId, text, { reply_markup: keyboard });
    });
});

// Обработка кнопок статуса
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    if (chatId !== ADMIN_ID) return;

    const data = query.data;
    const parts = data.split('_');
    const action = parts[0] + '_' + parts[1];
    const appId = parts[2];

    const apps = loadApps();
    const app = apps.find(a => a.id === appId);
    if (!app) { bot.answerCallbackQuery(query.id, { text: '❌ Заявка не найдена' }); return; }

    if (action === 'status_work') {
        app.status = 'work';
        saveApps(apps);
        bot.answerCallbackQuery(query.id, { text: '🔨 Заявка в работе' });
        bot.sendMessage(chatId, '✅ Статус изменён: заявка #' + appId + ' — В РАБОТЕ');
    } else if (action === 'status_done') {
        app.status = 'done';
        saveApps(apps);
        bot.answerCallbackQuery(query.id, { text: '✅ Заявка выполнена' });
        bot.sendMessage(chatId, '✅ Статус изменён: заявка #' + appId + ' — ВЫПОЛНЕНА');
    }
});

// =========================
// /start
// =========================

bot.onText(/^\/start$/, (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || 'друг';

    addUser(chatId);
    delete userStates[chatId];

    const text =
        '🏛 Solo_Men Studios\n\n' +
        'Привет, ' + name + '!\n\n' +
        'Мы создаём сайты, Telegram-ботов, приложения и дизайн в премиум-стиле.\n\n' +
        '⚡ Быстро. Качественно. Красиво.\n\n' +
        'Выбирай, что тебя интересует:';

    bot.sendMessage(chatId, text, mainMenu);
});

// =========================
// В МЕНЮ
// =========================

bot.onText(/^В меню$/, (msg) => {
    delete userStates[msg.chat.id];
    bot.sendMessage(msg.chat.id, '🏠 Главное меню.', mainMenu);
});

// =========================
// ПРОМОКОД ОТ КЛИЕНТА
// =========================

bot.onText(/^Ввести промокод$/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'promo' };
    bot.sendMessage(chatId, '🎁 Введи промокод:\n\nДля отмены напиши /cancel', backMenu);
});

// =========================
// РАЗДЕЛЫ
// =========================

bot.onText(/^Сайты$/, (msg) => {
    const text =
        '🌐 РАЗРАБОТКА САЙТОВ\n\n' +
        'Что делаем:\n' +
        '• Лендинги\n' +
        '• Многостраничные сайты\n' +
        '• Интернет-магазины\n' +
        '• Корпоративные сайты\n\n' +
        '💰 Цена: от 5 000 ₽\n' +
        '⏱ Срок: 3–7 дней\n\n' +
        'Что входит:\n' +
        '• Дизайн\n' +
        '• Вёрстка\n' +
        '• Адаптация под телефон\n' +
        '• Хостинг + домен\n' +
        '• Обучение';
    bot.sendMessage(msg.chat.id, text, backMenu);
});

bot.onText(/^Боты$/, (msg) => {
    const text =
        '🤖 РАЗРАБОТКА БОТОВ\n\n' +
        'Что делаем:\n' +
        '• Telegram-боты\n' +
        '• Discord-боты\n' +
        '• Боты для магазинов\n' +
        '• Боты-помощники\n\n' +
        '💰 Цена: от 7 000 ₽\n' +
        '⏱ Срок: 5–10 дней';
    bot.sendMessage(msg.chat.id, text, backMenu);
});

bot.onText(/^Приложения$/, (msg) => {
    const text =
        '📱 МОБИЛЬНЫЕ ПРИЛОЖЕНИЯ\n\n' +
        '• Android-приложения\n' +
        '• PWA\n' +
        '• Web-приложения\n\n' +
        '💰 Цена: от 30 000 ₽\n' +
        '⏱ Срок: 2–4 недели';
    bot.sendMessage(msg.chat.id, text, backMenu);
});

bot.onText(/^Дизайн$/, (msg) => {
    const text =
        '🎨 ДИЗАЙН\n\n' +
        '• Логотипы\n' +
        '• Баннеры\n' +
        '• Обложки\n' +
        '• Презентации\n\n' +
        '💰 Цена: от 5 000 ₽\n' +
        '⏱ Срок: 1–5 дней';
    bot.sendMessage(msg.chat.id, text, backMenu);
});

bot.onText(/^Прайс-лист$/, (msg) => {
    const text =
        '💰 ПРАЙС-ЛИСТ SOLO_MEN STUDIOS\n\n' +
        '🌐 Сайты — от 5 000 ₽\n' +
        '🤖 Боты — от 7 000 ₽\n' +
        '📱 Приложения — от 30 000 ₽\n' +
        '🎨 Дизайн — от 5 000 ₽\n\n' +
        '💳 Оплата: USDT / TON\n' +
        'Предоплата — 50%.';
    bot.sendMessage(msg.chat.id, text, backMenu);
});

bot.onText(/^Портфолио$/, (msg) => {
    const text =
        '💼 НАШИ РАБОТЫ\n\n' +
        '📱 Solo_Men Messenger\n' +
        'solomessenger.netlify.app\n\n' +
        '🏛 Solo_Men Studios\n' +
        'sozdaniesaitovbotovbtdsolomen.netlify.app\n\n' +
        '🪙 BobraCoin\n' +
        'Мем-коин на Solana';
    bot.sendMessage(msg.chat.id, text, backMenu);
});

bot.onText(/^Связаться$/, (msg) => {
    const text =
        '📞 СВЯЗАТЬСЯ С НАМИ\n\n' +
        '👤 Основатель: @Elohimon\n' +
        '👤 Менеджер: @K_S_1430\n\n' +
        '📧 Email: bobratoken@gmail.com\n' +
        '📢 Канал: @BobraCoin';
    bot.sendMessage(msg.chat.id, text, backMenu);
});

bot.onText(/^FAQ$/, (msg) => {
    const text =
        '❓ ЧАСТЫЕ ВОПРОСЫ\n\n' +
        '💰 Сколько стоит?\n' +
        'Сайт от 5к, бот от 7к, приложение от 30к.\n\n' +
        '⏱ Как быстро?\n' +
        'Сайт 3–7 дней. Бот 5–10 дней.\n\n' +
        '💳 Как оплатить?\n' +
        'USDT или TON. Предоплата — 50%.';
    bot.sendMessage(msg.chat.id, text, backMenu);
});

bot.onText(/^О студии$/, (msg) => {
    const text =
        '🏛 SOLO_MEN STUDIOS\n\n' +
        'Молодая студия разработки из Дагестана.\n\n' +
        'Основатель: Тимур (Solo_Men).\n\n' +
        'Создаём: сайты, Telegram-ботов, приложения, дизайн.\n\n' +
        '✨ Делаем технологии красиво.';
    bot.sendMessage(msg.chat.id, text, backMenu);
});

// =========================
// ЗАЯВКА
// =========================

bot.onText(/^Оставить заявку$/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'service' };

    bot.sendMessage(chatId,
        '📋 ОФОРМЛЕНИЕ ЗАЯВКИ\n\n' +
        'Шаг 1 из 4.\n\n' +
        'Что нужно сделать? Напиши: сайт, бот, приложение или дизайн\n\n' +
        'Для отмены напиши /cancel'
    );
});

bot.onText(/^\/cancel$/, (msg) => {
    const chatId = msg.chat.id;
    if (userStates[chatId]) {
        delete userStates[chatId];
        bot.sendMessage(chatId, '❌ Отменено.', mainMenu);
    } else {
        bot.sendMessage(chatId, 'Нет активной заявки.', mainMenu);
    }
});

// =========================
// ОБРАБОТКА СООБЩЕНИЙ
// =========================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return;
    if (!userStates[chatId]) return;

    const state = userStates[chatId];

    // ===== ПРОМОКОД =====
    if (state.step === 'promo') {
        const code = text.toUpperCase();
        const promos = loadPromos();

        if (promos[code] && promos[code].active) {
            promos[code].uses++;
            savePromos(promos);

            bot.sendMessage(chatId,
                '🎉 ПРОМОКОД АКТИВИРОВАН!\n\n' +
                '🎁 Код: ' + code + '\n' +
                '💰 Скидка: ' + promos[code].discount + '%\n\n' +
                'Скидка будет применена к твоему заказу.',
                mainMenu
            );
        } else {
            bot.sendMessage(chatId, '❌ Промокод не найден или неактивен.', mainMenu);
        }
        delete userStates[chatId];
        return;
    }

    // ===== ЗАЯВКА =====
    if (state.step === 'service') {
        state.service = text;
        state.step = 'desc';
        await bot.sendMessage(chatId,
            '✅ Отлично!\n\nШаг 2 из 4.\n\n' +
            'Опиши подробнее, что нужно сделать:'
        );
        return;
    }

    if (state.step === 'desc') {
        state.desc = text;
        state.step = 'budget';
        await bot.sendMessage(chatId,
            '✅ Записал.\n\nШаг 3 из 4.\n\n' +
            'Какой примерный бюджет?\n\n' +
            '• до 10 000\n• 10 000–30 000\n• 30 000–50 000\n• более 50 000\n• не знаю'
        );
        return;
    }

    if (state.step === 'budget') {
        state.budget = text;
        state.step = 'contact';
        await bot.sendMessage(chatId,
            '✅ Понял.\n\nШаг 4 из 4.\n\n' +
            'Оставь контакт для связи (Telegram или телефон):'
        );
        return;
    }

    if (state.step === 'contact') {
        state.contact = text;

        const appId = Date.now().toString().slice(-6);
        const fromName = msg.from.first_name || 'Не указано';
        const fromUsername = msg.from.username ? '@' + msg.from.username : 'без username';

        const apps = loadApps();
        apps.push({
            id: appId,
            userId: msg.from.id,
            name: fromName,
            username: fromUsername,
            service: state.service,
            desc: state.desc,
            budget: state.budget,
            contact: state.contact,
            status: 'new',
            created: new Date().toISOString()
        });
        saveApps(apps);

        const adminText =
            '🔥 НОВАЯ ЗАЯВКА #' + appId + '\n\n' +
            '👤 ' + fromName + '\n' +
            '📱 ' + fromUsername + '\n' +
            '🆔 ' + msg.from.id + '\n\n' +
            '🛠 ' + state.service + '\n' +
            '📝 ' + state.desc + '\n' +
            '💰 ' + state.budget + '\n' +
            '📞 ' + state.contact;

        const keyboard = {
            inline_keyboard: [
                [{ text: '🔨 В работу', callback_data: 'status_work_' + appId }],
                [{ text: '✅ Выполнено', callback_data: 'status_done_' + appId }],
                [{ text: '💬 Написать', url: 'https://t.me/' + (msg.from.username || '') }]
            ]
        };

        try {
            await bot.sendMessage(ADMIN_ID, adminText, { reply_markup: keyboard });
            await bot.sendMessage(chatId,
                '🎉 ЗАЯВКА ОТПРАВЛЕНА!\n\n' +
                'Номер: #' + appId + '\n' +
                'Мы свяжемся с тобой в ближайшее время.',
                mainMenu
            );
            delete userStates[chatId];
        } catch (e) {
            console.log('Ошибка:', e.message);
            bot.sendMessage(chatId, '❌ Ошибка. Попробуй ещё раз.', mainMenu);
        }
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
