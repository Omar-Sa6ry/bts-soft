import { describe, it, expect, vi } from 'vitest';

describe('telegram.bot', () => {
  it('should initialize telegram bot and trigger message listener', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token-12345';
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const botModule = await import('./telegram.bot');
    const bot = botModule.default;
    expect(bot).toBeDefined();

    const sendMsgSpy = vi.spyOn(bot, 'sendMessage').mockImplementation(async () => ({} as any));
    bot.emit('message', { chat: { id: 12345 }, text: 'hello world' });
    expect(sendMsgSpy).toHaveBeenCalledWith(12345, 'You said: hello world');

    consoleSpy.mockRestore();
    sendMsgSpy.mockRestore();
  });
});
