require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const Queue = require('queue');


const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);


const MAX_CONCURRENT_REQUESTS = 5;


const requestQueue = new Queue({ concurrency: MAX_CONCURRENT_REQUESTS, autostart: true });
const activeRequests = new Set();


bot.start((ctx) => {
  ctx.reply('Привет! Нажми кнопку, чтобы отправить запрос.', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Отправить запрос', callback_data: 'send_request' }]
      ]
    }
  });
});


bot.action('send_request', async (ctx) => {
  const userId = ctx.from.id;
  

  if (activeRequests.size < MAX_CONCURRENT_REQUESTS) {
    await processRequest(ctx, userId);
  } else {
    ctx.reply('Ваш запрос добавлен в очередь.');
    addToQueue(ctx, userId);
  }
});


async function processRequest(ctx, userId) {
  activeRequests.add(userId);
  const message = await ctx.reply('Запрос обрабатывается, пожалуйста подождите...');
  
  try {
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


function simulateApiRequest() {
  return new Promise((resolve) => setTimeout(resolve, 180000)); // 3 минуты
}


function addToQueue(ctx, userId) {
  requestQueue.push(async () => {
    await processRequest(ctx, userId);
  });

  notifyUserQueuePosition(ctx, userId);
}


function processQueue() {
  if (requestQueue.length > 0 && activeRequests.size < MAX_CONCURRENT_REQUESTS) {
    requestQueue.start();
  }
}


function notifyUserQueuePosition(ctx, userId) {
  const position = requestQueue.length;
  ctx.reply(`Вы в очереди. Ваша позиция: ${position}`);
}


bot.launch().then(() => {
  console.log('Бот запущен');
});


process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
