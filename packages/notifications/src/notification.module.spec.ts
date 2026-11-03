import { describe, it, expect } from 'vitest';
import { NotificationModule } from './notification.module';
import { NOTIFICATION_OBSERVERS } from './core/constants/injection-tokens.const';

describe('NotificationModule', () => {
  it('should be defined as a class', () => {
    expect(NotificationModule).toBeDefined();
    const instance = new NotificationModule();
    expect(instance).toBeInstanceOf(NotificationModule);
  });

  it('should register dynamic module with options', () => {
    const dynamicModule = NotificationModule.register({
      providers: [{ provide: 'TEST_PROVIDER', useValue: true }],
    });

    expect(dynamicModule.module).toBe(NotificationModule);
    expect(dynamicModule.global).toBe(true);
    expect(dynamicModule.providers).toHaveLength(1);
  });

  it('should register dynamic module with default empty options', () => {
    const dynamicModule = NotificationModule.register();
    expect(dynamicModule.module).toBe(NotificationModule);
    expect(dynamicModule.global).toBe(true);
  });

  it('should execute NOTIFICATION_OBSERVERS factory function', () => {
    const metadata = Reflect.getMetadata('providers', NotificationModule);
    const observerProvider = metadata.find(
      (p: any) => p && p.provide === NOTIFICATION_OBSERVERS,
    );
    expect(observerProvider).toBeDefined();

    const mockLogging = { onQueued: () => {} } as any;
    const mockMetrics = { onDelivered: () => {} } as any;
    const result = observerProvider.useFactory(mockLogging, mockMetrics);
    expect(result).toEqual([mockLogging, mockMetrics]);
  });
});
