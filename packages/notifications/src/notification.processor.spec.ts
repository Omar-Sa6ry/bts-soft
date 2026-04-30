import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProcessor } from './notification.processor';
import { NotificationChannelFactory } from './core/factories/NotificationChannel.factory';
import { TemplateService } from './core/templates/template.service';
import { NOTIFICATION_LOG_REPOSITORY } from './core/models/NotificationLog.interface';
import { NotificationClientError, NotificationProviderError } from './core/errors/NotificationError';

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  let factory: any;
  let templateService: any;
  let logRepo: any;
  let i18nService: any;

  beforeEach(async () => {
    factory = {
      getChannel: jest.fn(),
    };
    templateService = {
      render: jest.fn(({ template }) => template),
    };
    logRepo = {
      updateByJobId: jest.fn(),
    };
    i18nService = {
      t: jest.fn((key) => `translated_${key}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProcessor,
        { provide: NotificationChannelFactory, useValue: factory },
        { provide: TemplateService, useValue: templateService },
        { provide: NOTIFICATION_LOG_REPOSITORY, useValue: logRepo },
        // Mock I18nService if it exists or use null
        { provide: 'I18nService', useValue: i18nService }, 
      ],
    }).compile();

    processor = module.get<NotificationProcessor>(NotificationProcessor);
  });

  it('should process a job successfully', async () => {
    const mockChannel = { send: jest.fn().mockResolvedValue(undefined) };
    factory.getChannel.mockReturnValue(mockChannel);

    const mockJob: any = {
      id: 'job_1',
      attemptsMade: 0,
      data: {
        channel: 'email',
        message: { recipientId: 'u1', body: 'Hello {{name}}', context: { name: 'Omar' } },
      },
    };


    await processor.process(mockJob);

    expect(templateService.render).toHaveBeenCalled();
    expect(mockChannel.send).toHaveBeenCalled();
    expect(logRepo.updateByJobId).toHaveBeenCalledWith('job_1', {
      status: 'sent',
      attemptsMade: 1,
    });
  });

  it('should handle NotificationClientError by throwing UnrecoverableError', async () => {
    const mockChannel = { send: jest.fn().mockRejectedValue(new NotificationClientError('Bad User')) };
    factory.getChannel.mockReturnValue(mockChannel);

    const mockJob: any = {
      id: 'job_2',
      attemptsMade: 0,
      data: { channel: 'sms', message: { recipientId: 'u1', body: 'test' } },
    };

    await expect(processor.process(mockJob)).rejects.toThrow();
    // The processor should throw UnrecoverableError from BullMQ which stops retries
    expect(logRepo.updateByJobId).toHaveBeenCalledWith('job_2', {
      status: 'failed',
      errorMessage: 'Bad User',
      attemptsMade: 1,
    });
  });

  it('should handle NotificationProviderError by throwing regular error (retryable)', async () => {
    const mockChannel = { send: jest.fn().mockRejectedValue(new NotificationProviderError('API Down')) };
    factory.getChannel.mockReturnValue(mockChannel);

    const mockJob: any = {
      id: 'job_3',
      attemptsMade: 0,
      data: { channel: 'sms', message: { recipientId: 'u1', body: 'test' } },
    };

    await expect(processor.process(mockJob)).rejects.toThrow('API Down');
    expect(logRepo.updateByJobId).toHaveBeenCalledWith('job_3', {
      status: 'failed',
      errorMessage: 'API Down',
      attemptsMade: 1,
    });
  });


  it('should translate body, title, and subject if lang is provided', async () => {
    const mockChannel = { send: jest.fn() };
    factory.getChannel.mockReturnValue(mockChannel);

    const mockJob: any = {
      id: 'job_4',
      attemptsMade: 0,
      data: {
        channel: 'email',
        message: { 
          recipientId: 'u1', 
          body: 'welcome_body', 
          title: 'welcome_title',
          subject: 'welcome_subject',
          lang: 'ar' 
        },
      },
    };

    await processor.process(mockJob);

    expect(i18nService.t).toHaveBeenCalledWith('welcome_body', expect.any(Object));
    expect(i18nService.t).toHaveBeenCalledWith('welcome_title', expect.any(Object));
    expect(i18nService.t).toHaveBeenCalledWith('welcome_subject', expect.any(Object));
  });

  it('should render templates for body, title, and subject', async () => {
    const mockChannel = { send: jest.fn() };
    factory.getChannel.mockReturnValue(mockChannel);
    templateService.render.mockImplementation(({ template }) => `rendered_${template}`);

    const mockJob: any = {
      id: 'job_5',
      attemptsMade: 0,
      data: {
        channel: 'email',
        message: { 
          recipientId: 'u1', 
          body: '{{body}}', 
          title: '{{title}}',
          subject: '{{subject}}',
          context: { body: 'b', title: 't', subject: 's' }
        },
      },
    };

    await processor.process(mockJob);

    expect(mockChannel.send).toHaveBeenCalledWith(expect.objectContaining({
      body: 'rendered_{{body}}',
      title: 'rendered_{{title}}',
      subject: 'rendered_{{subject}}',
    }));
  });

  it('should mark as RETRYING on subsequent attempts', async () => {
    const mockChannel = { send: jest.fn().mockResolvedValue(undefined) };
    factory.getChannel.mockReturnValue(mockChannel);

    const mockJob: any = {
      id: 'job_6',
      attemptsMade: 1, // Second attempt
      data: { channel: 'email', message: { recipientId: 'u1', body: 'hi' } },
    };

    await processor.process(mockJob);

    expect(logRepo.updateByJobId).toHaveBeenCalledWith('job_6', {
      status: 'retrying',
      attemptsMade: 1,
    });
  });

  it('should gracefully skip translation if I18nService is not available', async () => {
    // Re-create processor without I18nService
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

    const mockJob: any = {
      id: 'job_7',
      attemptsMade: 0,
      data: { channel: 'email', message: { recipientId: 'u1', body: 'hi', lang: 'en' } },
    };

    await noI18nProcessor.process(mockJob);
    expect(mockChannel.send).toHaveBeenCalledWith(expect.objectContaining({ body: 'hi' }));
  });
});

