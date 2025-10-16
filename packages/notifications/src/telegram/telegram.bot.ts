import * as TelegramBot from 'node-telegram-bot-api';

import * as dotenv from 'dotenv';
dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN as string, { polling: false });

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `You said: ${msg.text}`);
});

console.log('Telegram bot is running...');

export default bot;
