import { NotificationLogRetentionService } from "./NotificationLogRetentionService";
import { INotificationLogRepository } from "../models/NotificationLog.interface";

describe("NotificationLogRetentionService", () => {
  it("delegates deletion to a repository that supports retention", async () => {
    const repository = { deleteBefore: jest.fn().mockResolvedValue(4) } as unknown as INotificationLogRepository;
    const service = new NotificationLogRetentionService(repository);
    await expect(service.pruneBefore(new Date("2025-01-01T00:00:00Z"))).resolves.toBe(4);
    expect(repository.deleteBefore).toHaveBeenCalledWith(new Date("2025-01-01T00:00:00Z"));
  });

  it("rejects invalid cutoffs and adapters without a retention hook", async () => {
    const service = new NotificationLogRetentionService({} as INotificationLogRepository);
    await expect(service.pruneBefore(new Date("invalid"))).rejects.toThrow("cutoff must be a valid Date");
    await expect(service.pruneBefore(new Date())).rejects.toThrow("does not support deleteBefore");
  });
});
