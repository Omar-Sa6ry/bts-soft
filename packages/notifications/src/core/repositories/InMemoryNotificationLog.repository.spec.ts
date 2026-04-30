import { InMemoryNotificationLogRepository } from './InMemoryNotificationLog.repository';
import { NotificationStatus } from '../models/NotificationLog.interface';

describe('InMemoryNotificationLogRepository', () => {
  let repository: InMemoryNotificationLogRepository;

  beforeEach(() => {
    repository = new InMemoryNotificationLogRepository();
  });

  it('should create and retrieve a log', async () => {
    const log = await repository.create({
      jobId: 'j1',
      channel: 'email',
      recipientId: 'u1',
      status: NotificationStatus.PENDING,
      attemptsMade: 0,
      createdAt: new Date(),
    });

    expect(log.jobId).toBe('j1');
    
    const found = await repository.findByJobId('j1');
    expect(found).toEqual(log);
  });

  it('should update a log by jobId', async () => {
    await repository.create({
      jobId: 'j2',
      channel: 'sms',
      recipientId: 'u2',
      status: NotificationStatus.PENDING,
      attemptsMade: 0,
      createdAt: new Date(),
    });

    await repository.updateByJobId('j2', { status: NotificationStatus.SENT, attemptsMade: 1 });

    const updated = await repository.findByJobId('j2');
    expect(updated?.status).toBe(NotificationStatus.SENT);
    expect(updated?.attemptsMade).toBe(1);
  });

  it('should find logs by filtering getAll', async () => {
    await repository.create({ jobId: 'j3', channel: 'email', recipientId: 'userX', status: NotificationStatus.SENT, attemptsMade: 1, createdAt: new Date() });
    await repository.create({ jobId: 'j4', channel: 'sms', recipientId: 'userX', status: NotificationStatus.SENT, attemptsMade: 1, createdAt: new Date() });

    const logs = repository.getAll().filter(l => l.recipientId === 'userX');
    expect(logs.length).toBe(2);
  });
});

