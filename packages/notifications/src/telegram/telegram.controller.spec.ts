import { Test, TestingModule } from '@nestjs/testing';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { NotificationService } from '../notification.service';
import { ChannelType } from '../core/models/ChannelType.const';

describe('TelegramController', () => {
  let controller: TelegramController;
  let telegramService: any;
  let notificationService: any;

  beforeEach(async () => {
    telegramService = {
      findUserByTelegramLinkToken: jest.fn(),
      updateTelegramChatId: jest.fn(),
    };
    notificationService = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelegramController],
      providers: [
        { provide: TelegramService, useValue: telegramService },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    controller = module.get<TelegramController>(TelegramController);
  });

  it('should link user on valid token', async () => {
    const mockUser = { id: 'u1', firstName: 'Omar' };
    telegramService.findUserByTelegramLinkToken.mockResolvedValue(mockUser);

    const update: any = {
      message: {
        chat: { id: 456 },
        text: 'VALID_TOKEN',
      },
    };

    const result = await controller.handleWebhook(update);

    expect(telegramService.updateTelegramChatId).toHaveBeenCalledWith('u1', '456');
    expect(notificationService.send).toHaveBeenCalledWith(
      ChannelType.TELEGRAM,
      expect.objectContaining({ recipientId: '456', body: expect.stringContaining('Omar') })
    );
    expect(result).toEqual({ ok: true });
  });

  it('should send invalid code message on unknown token', async () => {
    telegramService.findUserByTelegramLinkToken.mockResolvedValue(null);

    const update: any = {
      message: {
        chat: { id: 456 },
        text: 'WRONG',
      },
    };

    await controller.handleWebhook(update);

    expect(notificationService.send).toHaveBeenCalledWith(
      ChannelType.TELEGRAM,
      expect.objectContaining({ recipientId: '456', body: 'invalid Code' })
    );
  });

  it('should return ok for non-message updates', async () => {
    const result = await controller.handleWebhook({} as any);
    expect(result).toEqual({ ok: true });
  });
});
