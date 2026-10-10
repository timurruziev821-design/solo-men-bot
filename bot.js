const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const http = require('http');
const https = require('https');

// =========================
// МИНИ ВЕБ-СЕРВЕР
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

// =========================
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
    'сайт': 60,
    'бот': 80,
    'приложение': 350,
    'дизайн': 60
};

function getPriceForService(service) {
    const s = service.toLowerCase().trim();
    for (const key in SERVICE_PRICES) {
        if (s.includes(key)) return SERVICE_PRICES[key];
    }
    return 0;
}

// =========================
// МЕНЮ КОМАНД
// =========================

bot.setMyCommands([
    { command: 'start', description: '🏛 Главное меню' },
    { command: 'profile', description: '👤 Мой профиль' },
    { command: 'myref', description: '🔗 Моя реферальная ссылка' },
    { command: 'cancel', description: '❌ Отменить действие' }
]);

// =========================
// МЕНЮ
// =========================

const mainMenu = {
    reply_markup: {
        keyboard: [
            [{ text: 'Сайты' }, { text: 'Боты' }],
            [{ text: 'Приложения' }, { text: 'Дизайн' }],
            [{ text: 'Прайс-лист' }, { text: 'Портфолио' }],
            [{ text: 'Оставить заявку' }, { text: 'Связаться' }],
            [{ text: 'FAQ' }, { text: 'О студии' }],
            [{ text: 'Ввести промокод' }, { text: '👤 Профиль' }],
            [{ text: '🔗 Моя реф-ссылка' }]
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

bot.onText(/^\/broadcast (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) { bot.sendMessage(chatId, '❌ Нет прав.'); return; }
    const text = match[1];
    const allUsers = loadUsers();
    if (allUsers.length === 0) { bot.sendMessage(chatId, '❌ Нет юзеров.'); return; }
    await bot.sendMessage(chatId, '📢 Рассылка на ' + allUsers.length + '...');
    let sent = 0, failed = 0;
    for (const userId of allUsers) {
        try {
            await bot.sendMessage(userId, text);
            sent++;
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) { failed++; }
    }
    bot.sendMessage(chatId, '✅ Отправлено: ' + sent + '\n❌ Ошибок: ' + failed);
});

bot.onText(/^\/stats$/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) { bot.sendMessage(chatId, '❌'); return; }
    const users = loadUsers();
    const apps = loadApps();
    const promos = loadPromos();
    const n = apps.filter(a => a.status === 'new').length;
    const w = apps.filter(a => a.status === 'work').length;
    const d = apps.filter(a => a.status === 'done').length;
    bot.sendMessage(chatId,
        '📊 СТАТИСТИКА\n\n' +
        '👥 Пользователей: ' + users.length + '\n' +
        '📋 Заявок: ' + apps.length + '\n' +
        '   🆕 ' + n + ' | 🔨 ' + w + ' | ✅ ' + d + '\n\n' +
        '🎁 Промокодов: ' + Object.keys(promos).length
    );
});

bot.onText(/^\/newpromo (\S+) (\d+)$/, (msg, match) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) { bot.sendMessage(chatId, '❌'); return; }
    const code = match[1].toUpperCase();
    const discount = parseInt(match[2]);
    if (discount < 1 || discount > 100) { bot.sendMessage(chatId, '❌ 1-100'); return; }
    const promos = loadPromos();
    if (promos[code]) { bot.sendMessage(chatId, '❌ Уже есть.'); return; }
    promos[code] = { discount, created: new Date().toISOString(), uses: 0, active: true };
    savePromos(promos);
    bot.sendMessage(chatId, '✅ Промокод ' + code + ' — ' + discount + '%');
});

bot.onText(/^\/delpromo (\S+)$/, (msg, match) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) { bot.sendMessage(chatId, '❌'); return; }
    const code = match[1].toUpperCase();
    const promos = loadPromos();
    if (!promos[code]) { bot.sendMessage(chatId, '❌ Не найден.'); return; }
    delete promos[code];
    savePromos(promos);
    bot.sendMessage(chatId, '✅ Удалён ' + code);
});

bot.onText(/^\/promos$/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) { bot.sendMessage(chatId, '❌'); return; }
    const promos = loadPromos();
    const keys = Object.keys(promos);
    if (keys.length === 0) { bot.sendMessage(chatId, '📭 Нет.'); return; }
    let text = '🎁 ПРОМОКОДЫ\n\n';
    keys.forEach(c => { text += '🔹 ' + c + ' — ' + promos[c].discount + '% (исп: ' + promos[c].uses + ')\n'; });
    bot.sendMessage(chatId, text);
});

bot.onText(/^\/apps$/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) { bot.sendMessage(chatId, '❌'); return; }
    const apps = loadApps();
    if (apps.length === 0) { bot.sendMessage(chatId, '📭 Нет заявок.'); return; }
    bot.sendMessage(chatId, '📋 ЗАЯВОК: ' + apps.length);
    apps.slice().reverse().slice(0, 10).forEach((app) => {
        const emoji = app.status === 'new' ? '🆕' : (app.status === 'work' ? '🔨' : (app.status === 'paid' ? '💳' : '✅'));
        const text = emoji + ' #' + app.id + '\n👤 ' + app.name + '\n📱 ' + app.username + '\n🛠 ' + app.service + '\n💰 ' + app.budget + '\n📞 ' + app.contact;
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '🔨 В работу', callback_data: 'status_work_' + app.id },
                    { text: '✅ Выполнено', callback_data: 'status_done_' + app.id }
                ],
                [{ text: '❌ Отклонить', callback_data: 'status_reject_' + app.id }]
            ]
        };
        bot.sendMessage(chatId, text, { reply_markup: keyboard }).catch(() => {});
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
    if (!app) { bot.answerCallbackQuery(query.id, { text: '❌ Не найдено' }); return; }

    if (action === 'status_work') {
        app.status = 'work'; saveApps(apps);
        bot.answerCallbackQuery(query.id, { text: '🔨 В работе' });
        bot.sendMessage(chatId, '✅ #' + appId + ' → В РАБОТЕ');
        bot.sendMessage(app.userId, '🔨 Твоя заявка #' + appId + ' принята в работу!').catch(() => {});
    } else if (action === 'status_done') {
        app.status = 'done'; saveApps(apps);
        bot.answerCallbackQuery(query.id, { text: '✅ Выполнено' });
        bot.sendMessage(chatId, '✅ #' + appId + ' → ВЫПОЛНЕНО');
        bot.sendMessage(app.userId, '✅ Твоя заявка #' + appId + ' выполнена! Спасибо!').catch(() => {});
    } else if (action === 'status_reject') {
        app.status = 'rejected'; saveApps(apps);
        bot.answerCallbackQuery(query.id, { text: '❌ Отклонено' });
        bot.sendMessage(chatId, '❌ #' + appId + ' → ОТКЛОНЕНО');
    }
});// =========================
// /start с реферальной ссылкой
// =========================

bot.onText(/^\/start(.*)$/, (msg, match) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || 'друг';
    const param = (match[1] || '').trim();

    addUser(chatId);
    delete userStates[chatId];

    if (param && param.startsWith('ref_')) {
        const referrerId = param.replace('ref_', '');
        if (referrerId !== String(msg.from.id)) {
            const refs = loadRefs();
            const ref = refs[referrerId] || { code: param, invited: [] };
            if (!ref.invited.includes(msg.from.id)) {
                ref.invited.push(msg.from.id);
                refs[referrerId] = ref;
                saveRefs(refs);
                bot.sendMessage(referrerId,
                    '🎉 ПО ТВОЕЙ ССЫЛКЕ ПРИШЁЛ ДРУГ!\n\n👤 ID: ' + msg.from.id + '\n💰 Скидка 5% на следующий заказ!\n👥 Всего: ' + ref.invited.length
                ).catch(() => {});
                bot.sendMessage(chatId, '🎁 Ты пришёл по реферальной ссылке! Скидка 5% на первый заказ.');
            }
        }
    }

    const text =
        '🏛 Solo_Men Studios\n\n' +
        'Привет, ' + name + '!\n\n' +
        'Мы создаём сайты, Telegram-ботов, приложения и дизайн в премиум-стиле.\n\n' +
        '⚡ Быстро. Качественно. Красиво.\n\n' +
        'Выбирай, что тебя интересует:';

    bot.sendMessage(chatId, text, mainMenu);
});

// =========================
// /profile
// =========================

bot.onText(/^\/profile$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const name = msg.from.first_name || 'Не указано';
    const username = msg.from.username ? '@' + msg.from.username : 'без username';

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
        '📱 ' + username + '\n' +
        '🆔 ' + userId + '\n\n' +
        '📋 Заявок: ' + apps.length + '\n' +
        '   🆕 ' + newA + ' | 🔨 ' + workA + ' | ✅ ' + doneA + '\n\n' +
        '👥 Приглашено: ' + myRef.invited.length + '\n\n' +
        '🔗 Реф-ссылка:\nt.me/SoloMenStudiosBot?start=' + myRef.code,
        backMenu
    );
});

// =========================
// /myref
// =========================

bot.onText(/^\/myref$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const refs = loadRefs();
    const myRef = refs[userId] || { code: 'ref_' + userId, invited: [] };
    if (!refs[userId]) { refs[userId] = myRef; saveRefs(refs); }

    bot.sendMessage(chatId,
        '🔗 ТВОЯ РЕФЕРАЛЬНАЯ ССЫЛКА\n\n' +
        't.me/SoloMenStudiosBot?start=' + myRef.code + '\n\n' +
        'Отправь другу. Когда он зайдёт — ты получишь скидку 5%.\n\n' +
        '👥 Уже приглашено: ' + myRef.invited.length,
        backMenu
    );
});

// Кнопки профиля
bot.onText(/^👤 Профиль$/, (msg) => {
    const userId = msg.from.id;
    const refs = loadRefs();
    const myRef = refs[userId] || { code: 'ref_' + userId, invited: [] };
    if (!refs[userId]) { refs[userId] = myRef; saveRefs(refs); }
    const apps = loadApps().filter(a => a.userId === userId);
    bot.sendMessage(msg.chat.id,
        '👤 Профиль\n\n📛 ' + (msg.from.first_name || 'Не указано') + '\n🆔 ' + userId + '\n\n📋 Заявок: ' + apps.length + '\n👥 Приглашено: ' + myRef.invited.length,
        backMenu
    );
});

bot.onText(/^🔗 Моя реф-ссылка$/, (msg) => {
    const userId = msg.from.id;
    const refs = loadRefs();
    const myRef = refs[userId] || { code: 'ref_' + userId, invited: [] };
    if (!refs[userId]) { refs[userId] = myRef; saveRefs(refs); }
    bot.sendMessage(msg.chat.id,
        '🔗 ТВОЯ РЕФ-ССЫЛКА\n\nt.me/SoloMenStudiosBot?start=' + myRef.code + '\n\n👥 Приглашено: ' + myRef.invited.length,
        backMenu
    );
});

// =========================
// В МЕНЮ
// =========================

bot.onText(/^В меню$/, (msg) => {
    delete userStates[msg.chat.id];
    bot.sendMessage(msg.chat.id, '🏠 Главное меню.', mainMenu);
});

// =========================
// ПРОМОКОД
// =========================

bot.onText(/^Ввести промокод$/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'promo' };
    bot.sendMessage(chatId, '🎁 Введи промокод:\n\n/cancel — отмена', backMenu);
});

// =========================
// РАЗДЕЛЫ
// =========================

bot.onText(/^Сайты$/, (msg) => {
    bot.sendMessage(msg.chat.id,
        '🌐 РАЗРАБОТКА САЙТОВ\n\n• Лендинги\n• Многостраничные\n• Интернет-магазины\n• Корпоративные\n\n💰 от 5 000 ₽\n⏱ 3–7 дней',
        backMenu);
});

bot.onText(/^Боты$/, (msg) => {
    bot.sendMessage(msg.chat.id,
        '🤖 РАЗРАБОТКА БОТОВ\n\n• Telegram\n• Discord\n• Для магазинов\n• Помощники\n\n💰 от 7 000 ₽\n⏱ 5–10 дней',
        backMenu);
});

bot.onText(/^Приложения$/, (msg) => {
    bot.sendMessage(msg.chat.id,
        '📱 ПРИЛОЖЕНИЯ\n\n• Android\n• PWA\n• Web\n\n💰 от 30 000 ₽\n⏱ 2–4 недели',
        backMenu);
});

bot.onText(/^Дизайн$/, (msg) => {
    bot.sendMessage(msg.chat.id,
        '🎨 ДИЗАЙН\n\n• Логотипы\n• Баннеры\n• Обложки\n• Презентации\n\n💰 от 5 000 ₽\n⏱ 1–5 дней',
        backMenu);
});

bot.onText(/^Прайс-лист$/, (msg) => {
    bot.sendMessage(msg.chat.id,
        '💰 ПРАЙС-ЛИСТ\n\n🌐 Сайты — от 5 000 ₽\n🤖 Боты — от 7 000 ₽\n📱 Приложения — от 30 000 ₽\n🎨 Дизайн — от 5 000 ₽\n\n💳 USDT / TON\nПредоплата 50%',
        backMenu);
});

bot.onText(/^Портфолио$/, (msg) => {
    bot.sendMessage(msg.chat.id,
        '💼 НАШИ РАБОТЫ\n\n📱 Solo_Men Messenger\nsolomessenger.netlify.app\n\n🏛 Solo_Men Studios\nsozdaniesaitovbotovbtdsolomen.netlify.app\n\n🪙 BobraCoin',
        backMenu);
});

bot.onText(/^Связаться$/, (msg) => {
    bot.sendMessage(msg.chat.id,
        '📞 СВЯЗАТЬСЯ\n\n👤 @Elohimon\n👤 @K_S_1430\n\n📧 bobratoken@gmail.com\n📢 @BobraCoin',
        backMenu);
});

bot.onText(/^FAQ$/, (msg) => {
    bot.sendMessage(msg.chat.id,
        '❓ FAQ\n\n💰 Сайт от 5к, бот от 7к, приложение от 30к.\n⏱ Сайт 3-7 дней, бот 5-10 дней.\n💳 USDT/TON, предоплата 50%.',
        backMenu);
});

bot.onText(/^О студии$/, (msg) => {
    bot.sendMessage(msg.chat.id,
        '🏛 SOLO_MEN STUDIOS\n\nСтудия разработки из Дагестана.\n\nОснователь: Тимур (Solo_Men).\n\n✨ Делаем технологии красиво.',
        backMenu);
});

// =========================
// ЗАЯВКА
// =========================

bot.onText(/^Оставить заявку$/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'service' };
    bot.sendMessage(chatId, '📋 ЗАЯВКА\n\nШаг 1 из 4.\n\nЧто нужно: сайт, бот, приложение, дизайн?\n\n/cancel — отмена');
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

    if (state.step === 'promo') {
        const code = text.toUpperCase();
        const promos = loadPromos();
        if (promos[code] && promos[code].active) {
            promos[code].uses++;
            savePromos(promos);
            bot.sendMessage(chatId, '🎉 ПРОМОКОД АКТИВИРОВАН!\n\n🎁 ' + code + '\n💰 Скидка: ' + promos[code].discount + '%', mainMenu);
        } else {
            bot.sendMessage(chatId, '❌ Промокод не найден.', mainMenu);
        }
        delete userStates[chatId];
        return;
    }

    if (state.step === 'service') {
        state.service = text; state.step = 'desc';
        bot.sendMessage(chatId, '✅ Шаг 2 из 4.\n\nОпиши подробнее:');
        return;
    }
    if (state.step === 'desc') {
        state.desc = text; state.step = 'budget';
        bot.sendMessage(chatId, '✅ Шаг 3 из 4.\n\nБюджет?\n\n• до 10 000\n• 10 000–30 000\n• 30 000–50 000\n• более 50 000\n• не знаю');
        return;
    }
    if (state.step === 'budget') {
        state.budget = text; state.step = 'contact';
        bot.sendMessage(chatId, '✅ Шаг 4 из 4.\n\nКонтакт (Telegram или телефон):');
        return;
    }
    if (state.step === 'contact') {
        state.contact = text;
        const appId = Date.now().toString().slice(-6);
        const fromName = msg.from.first_name || 'Не указано';
        const fromUsername = msg.from.username ? '@' + msg.from.username : 'без username';

        const apps = loadApps();
        apps.push({
            id: appId, userId: msg.from.id, name: fromName, username: fromUsername,
            service: state.service, desc: state.desc, budget: state.budget,
            contact: state.contact, status: 'new', created: new Date().toISOString()
        });
        saveApps(apps);

        const adminText =
            '🔥 НОВАЯ ЗАЯВКА #' + appId + '\n\n' +
            '👤 ' + fromName + '\n📱 ' + fromUsername + '\n🆔 ' + msg.from.id + '\n\n' +
            '🛠 ' + state.service + '\n📝 ' + state.desc + '\n💰 ' + state.budget + '\n📞 ' + state.contact;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '🔨 В работу', callback_data: 'status_work_' + appId },
                    { text: '✅ Выполнено', callback_data: 'status_done_' + appId }
                ],
                [{ text: '❌ Отклонить', callback_data: 'status_reject_' + appId }]
            ]
        };

        try {
            await bot.sendMessage(ADMIN_ID, adminText, { reply_markup: keyboard });

            // Оплата
            const amount = getPriceForService(state.service);
            if (amount > 0 && CRYPTOBOT_TOKEN) {
                const invoice = await createInvoice(amount, 'Заявка #' + appId + ' — ' + state.service);
                if (invoice && invoice.bot_invoice_url) {
                    await bot.sendMessage(chatId,
                        '🎉 ЗАЯВКА #' + appId + ' ОТПРАВЛЕНА!\n\n' +
                        '💳 Оплата: ' + amount + ' USDT\n\n' +
                        'Нажми кнопку чтобы оплатить:',
                        {
                            reply_markup: {
                                inline_keyboard: [[
                                    { text: '💳 Оплатить ' + amount + ' USDT', url: invoice.bot_invoice_url }
                                ]]
                            }
                        }
                    );
                    await bot.sendMessage(chatId, 'Или вернись в меню:', mainMenu);
                } else {
                    await bot.sendMessage(chatId,
                        '🎉 ЗАЯВКА #' + appId + ' ОТПРАВЛЕНА!\n\n💳 Оплата: ' + amount + ' USDT\nМы свяжемся с тобой.',
                        mainMenu);
                }
            } else {
                await bot.sendMessage(chatId,
                    '🎉 ЗАЯВКА #' + appId + ' ОТПРАВЛЕНА!\n\nМы свяжемся с тобой.',
                    mainMenu);
            }
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
