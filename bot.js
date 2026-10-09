const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const http = require('http');

// =========================
// МИНИ ВЕБ-СЕРВЕР (чтобы Render не убивал бота)
// =========================

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Solo_Men Studios Bot is running!');
}).listen(PORT, () => {
    console.log('Веб-сервер запущен на порту ' + PORT);
});
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 8447147405;

const bot = new TelegramBot(TOKEN, { polling: true });

console.log('Solo_Men Studios Bot запущен!');

// =========================
// БАЗА ПОЛЬЗОВАТЕЛЕЙ
// =========================

const USERS_FILE = 'users.json';

function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        }
    } catch (e) {
        console.log('Ошибка загрузки users:', e.message);
    }
    return [];
}

function saveUsers(usersList) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(usersList, null, 2));
    } catch (e) {
        console.log('Ошибка сохранения users:', e.message);
    }
}

function addUser(chatId) {
    const usersList = loadUsers();
    if (!usersList.includes(chatId)) {
        usersList.push(chatId);
        saveUsers(usersList);
        console.log('Новый пользователь: ' + chatId + '. Всего: ' + usersList.length);
    }
}

let users = loadUsers();
console.log('Загружено пользователей: ' + users.length);

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
            [{ text: 'FAQ' }, { text: 'О студии' }]
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

// =========================
// КОМАНДЫ АДМИНА
// =========================

bot.onText(/^\/broadcast (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;

    if (chatId !== ADMIN_ID) {
        bot.sendMessage(chatId, '❌ У тебя нет прав.');
        return;
    }

    const text = match[1];
    const allUsers = loadUsers();

    if (allUsers.length === 0) {
        bot.sendMessage(chatId, '❌ Нет пользователей.');
        return;
    }

    await bot.sendMessage(chatId, '📢 Рассылка на ' + allUsers.length + ' чел...');

    let sent = 0;
    let failed = 0;

    for (const userId of allUsers) {
        try {
            await bot.sendMessage(userId, text);
            sent++;
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {
            failed++;
            console.log('Не доставлено ' + userId + ': ' + e.message);
        }
    }

    bot.sendMessage(
        chatId,
        '✅ РАССЫЛКА ГОТОВА\n\n' +
        '📨 Отправлено: ' + sent + '\n' +
        '❌ Ошибок: ' + failed + '\n' +
        '👥 Всего: ' + allUsers.length
    );
});

bot.onText(/^\/stats$/, (msg) => {
    const chatId = msg.chat.id;

    if (chatId !== ADMIN_ID) {
        bot.sendMessage(chatId, '❌ У тебя нет прав.');
        return;
    }

    const allUsers = loadUsers();

    bot.sendMessage(
        chatId,
        '📊 СТАТИСТИКА SOLO_MEN STUDIOS\n\n' +
        '👥 Пользователей: ' + allUsers.length + '\n' +
        '📅 ' + new Date().toLocaleDateString('ru-RU') + '\n' +
        '🕐 ' + new Date().toLocaleTimeString('ru-RU')
    );
});

// =========================
// /start
// =========================

bot.onText(/^\/start$/, (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || 'друг';

    addUser(chatId);

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
    bot.sendMessage(msg.chat.id, '🏠 Главное меню.\n\nЧто тебя интересует?', mainMenu);
});

// =========================
// САЙТЫ
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

// =========================
// БОТЫ
// =========================

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

// =========================
// ПРИЛОЖЕНИЯ
// =========================

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

// =========================
// ДИЗАЙН
// =========================

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

// =========================
// ПРАЙС
// =========================

bot.onText(/^Прайс-лист$/, (msg) => {
    const text =
        '💰 ПРАЙС-ЛИСТ SOLO_MEN STUDIOS\n\n' +
        '🌐 Сайты — от 5 000 ₽\n' +
        '🤖 Боты — от 7 000 ₽\n' +
        '📱 Приложения — от 30 000 ₽\n' +
        '🎨 Дизайн — от 5 000 ₽\n\n' +
        '💳 Оплата:\n' +
        'USDT / TON\n\n' +
        'Предоплата — 50%.';

    bot.sendMessage(msg.chat.id, text, backMenu);
});

// =========================
// ПОРТФОЛИО
// =========================

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

// =========================
// СВЯЗАТЬСЯ
// =========================

bot.onText(/^Связаться$/, (msg) => {
    const text =
        '📞 СВЯЗАТЬСЯ С НАМИ\n\n' +
        '👤 Основатель: @Elohimon\n' +
        '👤 Менеджер: @K_S_1430\n\n' +
        '📧 Email: bobratoken@gmail.com\n' +
        '📢 Канал: @BobraCoin';

    bot.sendMessage(msg.chat.id, text, backMenu);
});

// =========================
// FAQ
// =========================

bot.onText(/^FAQ$/, (msg) => {
    const text =
        '❓ ЧАСТЫЕ ВОПРОСЫ\n\n' +
        '💰 Сколько стоит?\n' +
        'Сайт от 5к, бот от 7к, приложение от 30к.\n\n' +
        '⏱ Как быстро?\n' +
        'Сайт 3–7 дней.\n' +
        'Бот 5–10 дней.\n\n' +
        '💳 Как оплатить?\n' +
        'USDT или TON.\n\n' +
        'Предоплата — 50%.';

    bot.sendMessage(msg.chat.id, text, backMenu);
});

// =========================
// О СТУДИИ
// =========================

bot.onText(/^О студии$/, (msg) => {
    const text =
        '🏛 SOLO_MEN STUDIOS\n\n' +
        'Молодая студия разработки из Дагестана.\n\n' +
        'Основатель: Тимур (Solo_Men).\n\n' +
        'Создаём:\n' +
        '• сайты\n' +
        '• Telegram-ботов\n' +
        '• приложения\n' +
        '• дизайн\n\n' +
        'Стиль — современный Old Money.\n\n' +
        '✨ Делаем технологии красиво.';

    bot.sendMessage(msg.chat.id, text, backMenu);
});

// =========================
// СИСТЕМА ЗАЯВОК
// =========================

const userStates = {};

bot.onText(/^Оставить заявку$/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'service' };

    bot.sendMessage(
        chatId,
        '📋 ОФОРМЛЕНИЕ ЗАЯВКИ\n\n' +
        'Шаг 1 из 4.\n\n' +
        'Что нужно сделать?\n\n' +
        'Напиши:\n' +
        '• сайт\n' +
        '• бот\n' +
        '• приложение\n' +
        '• дизайн\n\n' +
        'Для отмены напиши /cancel'
    );
});

bot.onText(/^\/cancel$/, (msg) => {
    const chatId = msg.chat.id;
    if (userStates[chatId]) {
        delete userStates[chatId];
        bot.sendMessage(chatId, '❌ Заявка отменена.', mainMenu);
    } else {
        bot.sendMessage(chatId, 'Сейчас нет активной заявки.', mainMenu);
    }
});

// =========================
// ОБРАБОТКА ЗАЯВКИ
// =========================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;
    if (text.startsWith('/')) return;
    if (!userStates[chatId]) return;

    const state = userStates[chatId];

    if (state.step === 'service') {
        state.service = text;
        state.step = 'desc';
        await bot.sendMessage(
            chatId,
            '✅ Отлично!\n\n' +
            'Шаг 2 из 4.\n\n' +
            'Опиши подробнее, что именно нужно сделать.\n\n' +
            'Например:\n' +
            '«Нужен Telegram-бот для магазина одежды»'
        );
        return;
    }

    if (state.step === 'desc') {
        state.desc = text;
        state.step = 'budget';
        await bot.sendMessage(
            chatId,
            '✅ Записал.\n\n' +
            'Шаг 3 из 4.\n\n' +
            'Какой примерный бюджет проекта?\n\n' +
            'Можно написать:\n' +
            '• до 10 000\n' +
            '• 10 000–30 000\n' +
            '• 30 000–50 000\n' +
            '• более 50 000\n' +
            '• пока не знаю'
        );
        return;
    }

    if (state.step === 'budget') {
        state.budget = text;
        state.step = 'contact';
        await bot.sendMessage(
            chatId,
            '✅ Понял.\n\n' +
            'Шаг 4 из 4.\n\n' +
            'Оставь контакт для связи:\n\n' +
            'Telegram username или номер телефона.'
        );
        return;
    }

    if (state.step === 'contact') {
        state.contact = text;

        const fromName = msg.from.first_name || 'Не указано';
        const fromUsername = msg.from.username ? '@' + msg.from.username : 'без username';

        const adminText =
            '🔥 НОВАЯ ЗАЯВКА\n\n' +
            '👤 Имя: ' + fromName + '\n' +
            '📱 Telegram: ' + fromUsername + '\n' +
            '🆔 ID: ' + msg.from.id + '\n\n' +
            '🛠 Услуга: ' + state.service + '\n\n' +
            '📝 Описание:\n' + state.desc + '\n\n' +
            '💰 Бюджет:\n' + state.budget + '\n\n' +
            '📞 Контакт:\n' + state.contact;

        try {
            await bot.sendMessage(ADMIN_ID, adminText);
            await bot.sendMessage(
                chatId,
                '🎉 Заявка успешно отправлена!\n\n' +
                'Спасибо! Мы получили твою заявку и свяжемся с тобой в ближайшее время.',
                mainMenu
            );
            delete userStates[chatId];
        } catch (error) {
            console.log('Ошибка отправки заявки:', error.message);
            await bot.sendMessage(
                chatId,
                '❌ Не удалось отправить заявку.\n\n' +
                'Попробуй ещё раз или свяжись с нами напрямую.',
                mainMenu
            );
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
