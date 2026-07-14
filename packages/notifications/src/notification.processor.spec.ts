import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProcessor } from './notification.processor';
import { NotificationChannelFactory } from './core/factories/NotificationChannel.factory';
import { TemplateService } from './core/templates/template.service';
import { NOTIFICATION_LOG_REPOSITORY } from './core/models/NotificationLog.interface';
import { NotificationClientError, NotificationProviderError } from './core/errors/NotificationError';

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  let factory: { getChannel: jest.Mock };
  let templateService: { render: jest.Mock };
  let logRepo: { updateByJobId: jest.Mock };
  let i18nService: { t: jest.Mock };

  beforeEach(async () => {
    factory = { getChannel: jest.fn() };
    templateService = { render: jest.fn(({ template }: { template: string }) => template) };
    logRepo = { updateByJobId: jest.fn().mockResolvedValue(undefined) };
    i18nService = { t: jest.fn((key: string) => Promise.resolve(`translated_${key}`)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProcessor,
        { provide: NotificationChannelFactory, useValue: factory },
        { provide: TemplateService, useValue: templateService },
        { provide: NOTIFICATION_LOG_REPOSITORY, useValue: logRepo },
        { provide: 'I18nService', useValue: i18nService },
      ],
    }).compile();

    processor = module.get<NotificationProcessor>(NotificationProcessor);
  });

  it('should process a job successfully and log SENT', async () => {
    const mockChannel = { send: jest.fn().mockResolvedValue(undefined) };
    factory.getChannel.mockReturnValue(mockChannel);

    const mockJob = {
      id: 'job_1',
      attemptsMade: 0,
      data: { channel: 'email', message: { recipientId: 'u1', body: 'Hello {{name}}', context: { name: 'Omar' } } },
    };

    await processor.process(mockJob as unknown as Parameters<typeof processor.process>[0]);

    expect(templateService.render).toHaveBeenCalled();
    expect(mockChannel.send).toHaveBeenCalled();
    expect(logRepo.updateByJobId).toHaveBeenCalledWith('job_1', { status: 'sent', attemptsMade: 1 });
  });

  it('should throw UnrecoverableError for NotificationClientError (no retry)', async () => {
    const mockChannel = { send: jest.fn().mockRejectedValue(new NotificationClientError('Bad recipient')) };
    factory.getChannel.mockReturnValue(mockChannel);

    const mockJob = {
      id: 'job_2',
      attemptsMade: 0,
      data: { channel: 'sms', message: { recipientId: 'u1', body: 'test' } },
    };

    await expect(processor.process(mockJob as unknown as Parameters<typeof processor.process>[0])).rejects.toThrow();
    expect(logRepo.updateByJobId).toHaveBeenCalledWith('job_2', {
      status: 'failed',
      errorMessage: 'Bad recipient',
      attemptsMade: 1,
    });
  });

  it('should re-throw error for NotificationProviderError (retried by BullMQ)', async () => {
    const mockChannel = { send: jest.fn().mockRejectedValue(new NotificationProviderError('API Down')) };
    factory.getChannel.mockReturnValue(mockChannel);

    const mockJob = {
      id: 'job_3',
      attemptsMade: 0,
      data: { channel: 'sms', message: { recipientId: 'u1', body: 'test' } },
    };

    await expect(processor.process(mockJob as unknown as Parameters<typeof processor.process>[0])).rejects.toThrow('API Down');
    expect(logRepo.updateByJobId).toHaveBeenCalledWith('job_3', {
      status: 'failed',
      errorMessage: 'API Down',
      attemptsMade: 1,
    });
  });

  it('should mark as RETRYING on subsequent attempts', async () => {
    const mockChannel = { send: jest.fn().mockResolvedValue(undefined) };
    factory.getChannel.mockReturnValue(mockChannel);

    const mockJob = {
      id: 'job_4',
      attemptsMade: 1,
      data: { channel: 'email', message: { recipientId: 'u1', body: 'hi' } },
    };

    await processor.process(mockJob as unknown as Parameters<typeof processor.process>[0]);

    expect(logRepo.updateByJobId).toHaveBeenCalledWith('job_4', { status: 'retrying', attemptsMade: 1 });
  });

  it('should translate body, title, and subject when lang is provided', async () => {
    const mockChannel = { send: jest.fn().mockResolvedValue(undefined) };
    factory.getChannel.mockReturnValue(mockChannel);

    const mockJob = {
      id: 'job_5',
      attemptsMade: 0,
      data: {
        channel: 'email',
        message: { recipientId: 'u1', body: 'welcome_body', title: 'welcome_title', subject: 'welcome_subject', lang: 'ar' },
      },
    };

    await processor.process(mockJob as unknown as Parameters<typeof processor.process>[0]);

    expect(i18nService.t).toHaveBeenCalledWith('welcome_body', expect.any(Object));
    expect(i18nService.t).toHaveBeenCalledWith('welcome_title', expect.any(Object));
    expect(i18nService.t).toHaveBeenCalledWith('welcome_subject', expect.any(Object));
  });

  it('should render Handlebars templates when context is provided', async () => {
    const mockChannel = { send: jest.fn().mockResolvedValue(undefined) };
    factory.getChannel.mockReturnValue(mockChannel);
    templateService.render.mockImplementation(({ template }: { template: string }) => `rendered_${template}`);

    const mockJob = {
      id: 'job_6',
      attemptsMade: 0,
      data: {
        channel: 'email',
        message: { recipientId: 'u1', body: '{{body}}', title: '{{title}}', subject: '{{subject}}', context: { body: 'b', title: 't', subject: 's' } },
      },
    };

    await processor.process(mockJob as unknown as Parameters<typeof processor.process>[0]);

    expect(mockChannel.send).toHaveBeenCalledWith(
      expect.objectContaining({ body: 'rendered_{{body}}', title: 'rendered_{{title}}', subject: 'rendered_{{subject}}' }),
    );
  });

  it('should mark as EXPIRED and throw UnrecoverableError for expired messages', async () => {
    const mockChannel = { send: jest.fn() };
    factory.getChannel.mockReturnValue(mockChannel);

    const mockJob = {
      id: 'job_7',
      attemptsMade: 0,
      data: {
        channel: 'email',
        message: { recipientId: 'u1', body: 'Expired', expiresAt: new Date(Date.now() - 5000) },
      },
    };

    await expect(processor.process(mockJob as unknown as Parameters<typeof processor.process>[0])).rejects.toThrow();
    expect(logRepo.updateByJobId).toHaveBeenCalledWith('job_7', expect.objectContaining({ status: 'expired' }));
    expect(mockChannel.send).not.toHaveBeenCalled();
  });

  it('should gracefully skip translation when I18nService is not available', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProcessor,
        { provide: NotificationChannelFactory, useValue: factory },
        { provide: TemplateService, useValue: templateService },
        { provide: NOTIFICATION_LOG_REPOSITORY, useValue: logRepo },
      ],
    }).compile();

    const noI18nProcessor = module.get<NotificationProcessor>(NotificationProcessor);
    const mockChannel = { send: jest.fn().mockResolvedValue(undefined) };
    factory.getChannel.mockReturnValue(mockChannel);

    const mockJob = {
      id: 'job_8',
      attemptsMade: 0,
      data: { channel: 'email', message: { recipientId: 'u1', body: 'hi', lang: 'en' } },
    };

    await noI18nProcessor.process(mockJob as Parameters<typeof noI18nProcessor.process>[0]);
    expect(mockChannel.send).toHaveBeenCalledWith(expect.objectContaining({ body: 'hi' }));
  });
});
