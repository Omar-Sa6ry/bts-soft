import { Test, TestingModule } from '@nestjs/testing';
import { TelegramService } from './telegram.service';
import { I18nService } from 'nestjs-i18n';
import { TELEGRAM_USER_REPOSITORY } from './interfaces/telegram-user-repository.interface';

describe('TelegramService', () => {
  let service: TelegramService;
  let userRepo: any;
  let i18n: any;

  beforeEach(async () => {
    userRepo = {
      update: jest.fn().mockResolvedValue(undefined),
      findByLinkToken: jest.fn().mockResolvedValue({ id: 'u123', firstName: 'Omar' }),
    };
    i18n = {
      t: jest.fn().mockResolvedValue('Success Message'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        { provide: I18nService, useValue: i18n },
        { provide: TELEGRAM_USER_REPOSITORY, useValue: userRepo },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    service.setUserResponseClass(class { constructor(public data: any) {} } as any);
  });

  it('should generate and save a link token', async () => {
    const token = await service.generateTelegramLinkToken({ id: 'u123' });
    expect(token).toHaveLength(8); // crypto.randomBytes(4) -> 8 hex chars
    expect(userRepo.update).toHaveBeenCalledWith('u123', expect.objectContaining({
      telegramLinkToken: token,
    }));
  });

  it('should find user by token', async () => {
    const user = await service.findUserByTelegramLinkToken('ABC');
    expect(userRepo.findByLinkToken).toHaveBeenCalledWith('ABC');
    expect(user).toEqual({ id: 'u123', firstName: 'Omar' });
  });

  it('should update chat id and clear token', async () => {
    await service.updateTelegramChatId('u123', 'chat456');
    expect(userRepo.update).toHaveBeenCalledWith('u123', {
      telegram_chat_id: 'chat456',
      telegramLinkToken: null,
    });
  });

  it('should allow setting user repository manually', async () => {
    const customRepo = {
      update: jest.fn().mockResolvedValue(undefined),
      findByLinkToken: jest.fn().mockResolvedValue({ id: 'custom-user' }),
    };
    const bareService = new TelegramService(i18n, null as any);
    bareService.setUserRepository(customRepo as any);
    const user = await bareService.findUserByTelegramLinkToken('custom');
    expect(user).toEqual({ id: 'custom-user' });
  });

  it('should throw error if repo is not provided for operations', async () => {
    const noRepoService = new TelegramService(i18n, null as any);
    await expect(noRepoService.saveTelegramLinkToken('u', 't')).rejects.toThrow('User repository not set');
    await expect(noRepoService.findUserByTelegramLinkToken('t')).rejects.toThrow('User repository not set');
    await expect(noRepoService.updateTelegramChatId('u', 'c')).rejects.toThrow('User repository not set');
  });
});
