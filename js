require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const Queue = require('queue');

// Инициализация бота
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Максимальное количество одновременных запросов
const MAX_CONCURRENT_REQUESTS = 5;

// Очередь запросов
const requestQueue = new Queue({ concurrency: MAX_CONCURRENT_REQUESTS, autostart: true });
const activeRequests = new Set();

// Команда /start
bot.start((ctx) => {
  ctx.reply('Привет! Нажми кнопку, чтобы отправить запрос.', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Отправить запрос', callback_data: 'send_request' }]
      ]
    }
  });
});

// Обработка кнопки "Отправить запрос"
bot.action('send_request', async (ctx) => {
  const userId = ctx.from.id;
  
  // Если текущих запросов меньше 5, отправляем запрос сразу
  if (activeRequests.size < MAX_CONCURRENT_REQUESTS) {
    await processRequest(ctx, userId);
  } else {
    // Если лимит достигнут, добавляем запрос в очередь
    ctx.reply('Ваш запрос добавлен в очередь.');
    addToQueue(ctx, userId);
  }
});

// Функция обработки запроса
async function processRequest(ctx, userId) {
  activeRequests.add(userId);
  const message = await ctx.reply('Запрос обрабатывается, пожалуйста подождите...');
  
  try {
    // Симуляция запроса к внешнему API с задержкой
    await simulateApiRequest();
    await ctx.telegram.editMessageText(ctx.chat.id, message.message_id, null, 'Запрос выполнен!');
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error);
    await ctx.telegram.editMessageText(ctx.chat.id, message.message_id, null, 'Произошла ошибка при выполнении запроса.');
  } finally {
    activeRequests.delete(userId);
    processQueue();
  }
}

// Симуляция API-запроса
function simulateApiRequest() {
  return new Promise((resolve) => setTimeout(resolve, 180000)); // 3 минуты
}

// Добавление запроса в очередь
function addToQueue(ctx, userId) {
  requestQueue.push(async () => {
    await processRequest(ctx, userId);
  });

  // Сообщение пользователю о позиции в очереди
  notifyUserQueuePosition(ctx, userId);
}

// Обработка очереди
function processQueue() {
  if (requestQueue.length > 0 && activeRequests.size < MAX_CONCURRENT_REQUESTS) {
    requestQueue.start();
  }
}

// Уведомление пользователя о позиции в очереди
function notifyUserQueuePosition(ctx, userId) {
  const position = requestQueue.length;
  ctx.reply(`Вы в очереди. Ваша позиция: ${position}`);
}

// Запуск бота
bot.launch().then(() => {
  console.log('Бот запущен');
});

// Остановка процесса при завершении работы
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
