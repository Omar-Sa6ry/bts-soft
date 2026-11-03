import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryNotificationLogRepository } from './InMemoryNotificationLog.repository';
import { ChannelType } from '../enums/ChannelType.enum';
import { NotificationStatus } from '../enums/NotificationStatus.enum';

describe('InMemoryNotificationLogRepository', () => {
  let repository: InMemoryNotificationLogRepository;

  beforeEach(() => {
    repository = new InMemoryNotificationLogRepository();
  });

  it('should create and store a notification log', async () => {
    const log = await repository.create({
      jobId: 'job-1',
      recipientId: 'user-1',
      channel: ChannelType.EMAIL,
      status: NotificationStatus.PENDING,
      attempts: 0,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });

    expect(log.id).toBeDefined();
    expect(log.jobId).toBe('job-1');
    expect(log.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
  });

  it('should generate default createdAt when not provided in create', async () => {
    const log = await repository.create({
      jobId: 'job-default-date',
      recipientId: 'user-default',
      channel: ChannelType.SMS,
      status: NotificationStatus.PENDING,
      attempts: 0,
    } as any);

    expect(log.createdAt).toBeInstanceOf(Date);
  });

  it('should update log by jobId and ignore when not found', async () => {
    await repository.create({
      jobId: 'job-2',
      recipientId: 'user-2',
      channel: ChannelType.SMS,
      status: NotificationStatus.PENDING,
      attempts: 0,
    } as any);

    await repository.updateByJobId('job-2', { status: NotificationStatus.SENT });
    const found = await repository.findByJobId('job-2');
    expect(found?.status).toBe(NotificationStatus.SENT);
    expect(found?.updatedAt).toBeInstanceOf(Date);

    // Non-existent jobId
    await repository.updateByJobId('non-existent', { status: NotificationStatus.FAILED });
  });

  it('should return null when finding non-existent jobId', async () => {
    const found = await repository.findByJobId('unknown-job');
    expect(found).toBeNull();
  });

  it('should find logs by recipientId sorted by createdAt descending', async () => {
    await repository.create({
      jobId: 'job-older',
      recipientId: 'user-sort',
      channel: ChannelType.SMS,
      status: NotificationStatus.SENT,
      attempts: 1,
      createdAt: new Date('2026-01-01T10:00:00Z'),
    });
    await repository.create({
      jobId: 'job-newer',
      recipientId: 'user-sort',
      channel: ChannelType.SMS,
      status: NotificationStatus.SENT,
      attempts: 1,
      createdAt: new Date('2026-01-02T10:00:00Z'),
    });
    await repository.create({
      jobId: 'job-other',
      recipientId: 'user-other',
      channel: ChannelType.SMS,
      status: NotificationStatus.SENT,
      attempts: 1,
      createdAt: new Date('2026-01-03T10:00:00Z'),
    });

    const logs = await repository.findByRecipientId('user-sort');
    expect(logs).toHaveLength(2);
    expect(logs[0].jobId).toBe('job-newer');
    expect(logs[1].jobId).toBe('job-older');
  });

  it('should return all logs without filter or with matching filter', async () => {
    await repository.create({
      jobId: 'j1',
      recipientId: 'u1',
      channel: ChannelType.EMAIL,
      status: NotificationStatus.SENT,
      attempts: 1,
    } as any);
    await repository.create({
      jobId: 'j2',
      recipientId: 'u1',
      channel: ChannelType.SMS,
      status: NotificationStatus.FAILED,
      attempts: 1,
    } as any);

    const all = await repository.findAll();
    expect(all).toHaveLength(2);

    const filtered = await repository.findAll({ channel: ChannelType.EMAIL });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].jobId).toBe('j1');

    const noMatch = await repository.findAll({ channel: ChannelType.DISCORD });
    expect(noMatch).toHaveLength(0);
  });

  it('should delete logs created before cutoff date', async () => {
    await repository.create({
      jobId: 'old',
      recipientId: 'u1',
      channel: ChannelType.EMAIL,
      status: NotificationStatus.SENT,
      attempts: 1,
      createdAt: new Date('2025-01-01T00:00:00Z'),
    });
    await repository.create({
      jobId: 'recent',
      recipientId: 'u1',
      channel: ChannelType.EMAIL,
      status: NotificationStatus.SENT,
      attempts: 1,
      createdAt: new Date('2026-06-01T00:00:00Z'),
    });

    const deleted = await repository.deleteBefore(new Date('2026-01-01T00:00:00Z'));
    expect(deleted).toBe(1);

    const remaining = await repository.findAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].jobId).toBe('recent');
  });
});

