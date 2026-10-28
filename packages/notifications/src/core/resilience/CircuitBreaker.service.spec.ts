import { describe, it, expect, beforeEach, vi } from "vitest";
import { CircuitBreakerService, CircuitState } from "./CircuitBreaker.service";
import { NotificationProviderError } from "../errors/NotificationError";

describe("CircuitBreakerService", () => {
  let circuitBreaker: CircuitBreakerService;

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerService();
  });

  it("should execute action successfully when circuit is CLOSED", async () => {
    const action = vi.fn().mockResolvedValue("success");
    const result = await circuitBreaker.execute("test-service", action);

    expect(result).toBe("success");
    expect(action).toHaveBeenCalledTimes(1);
    expect(circuitBreaker.getStatus("test-service").state).toBe(CircuitState.CLOSED);
  });

  it("should open circuit after failureThreshold is reached", async () => {
    const action = vi.fn().mockRejectedValue(new Error("Downstream failed"));

    for (let i = 0; i < 3; i++) {
      await expect(
        circuitBreaker.execute("twilio-sms", action, { failureThreshold: 3, recoveryTimeoutMs: 5000 }),
      ).rejects.toThrow("Downstream failed");
    }

    const status = circuitBreaker.getStatus("twilio-sms");
    expect(status.state).toBe(CircuitState.OPEN);
    expect(circuitBreaker.isOpen("twilio-sms")).toBe(true);

    // Immediate next call should fail with NotificationProviderError without calling action
    await expect(
      circuitBreaker.execute("twilio-sms", action, { failureThreshold: 3, recoveryTimeoutMs: 5000 }),
    ).rejects.toThrow(NotificationProviderError);

    expect(action).toHaveBeenCalledTimes(3); // was NOT called a 4th time
  });

  it("should enter HALF_OPEN and recover to CLOSED after halfOpenSuccessThreshold", async () => {
    vi.useFakeTimers();

    const failingAction = vi.fn().mockRejectedValue(new Error("Network err"));
    for (let i = 0; i < 2; i++) {
      await expect(
        circuitBreaker.execute("ses-mail", failingAction, {
          failureThreshold: 2,
          recoveryTimeoutMs: 1000,
          halfOpenSuccessThreshold: 2,
        }),
      ).rejects.toThrow();
    }

    expect(circuitBreaker.getStatus("ses-mail").state).toBe(CircuitState.OPEN);

    // Fast forward past recovery timeout
    vi.advanceTimersByTime(1100);

    const successfulAction = vi.fn().mockResolvedValue("recovered");

    // First probe call
    const res1 = await circuitBreaker.execute("ses-mail", successfulAction, {
      failureThreshold: 2,
      recoveryTimeoutMs: 1000,
      halfOpenSuccessThreshold: 2,
    });
    expect(res1).toBe("recovered");
    expect(circuitBreaker.getStatus("ses-mail").state).toBe(CircuitState.HALF_OPEN);

    // Second probe call -> closes circuit
    const res2 = await circuitBreaker.execute("ses-mail", successfulAction, {
      failureThreshold: 2,
      recoveryTimeoutMs: 1000,
      halfOpenSuccessThreshold: 2,
    });
    expect(res2).toBe("recovered");
    expect(circuitBreaker.getStatus("ses-mail").state).toBe(CircuitState.CLOSED);

    vi.useRealTimers();
  });
});
