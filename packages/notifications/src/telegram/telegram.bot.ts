import * as TelegramBot from 'node-telegram-bot-api';

import * as dotenv from 'dotenv';
dotenv.config();

// CJS module.exports is the constructor itself; ESM interop exposes it as `default`.
const TelegramBotCtor = ((TelegramBot as any).default ??
  TelegramBot) as typeof TelegramBot;

const bot = new TelegramBotCtor(process.env.TELEGRAM_BOT_TOKEN as string, { polling: false });

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `You said: ${msg.text}`);
});

console.log('Telegram bot is running...');

export default bot;
