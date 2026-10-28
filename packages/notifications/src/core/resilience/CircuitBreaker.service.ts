import {
  Injectable,
  Logger,
} from "@nestjs/common";
import { NotificationProviderError } from "../errors/NotificationError";

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export interface CircuitBreakerOptions {
  /** Number of failures required to open the circuit. Defaults to 5. */
  failureThreshold?: number;
  /** Cooldown time in ms before attempting HALF_OPEN state. Defaults to 30000 (30s). */
  recoveryTimeoutMs?: number;
  /** Number of consecutive successes required to close an open circuit. Defaults to 2. */
  halfOpenSuccessThreshold?: number;
}

export interface CircuitBreakerStatus {
  state: CircuitState;
  failures: number;
  consecutiveSuccesses: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

interface CircuitInternalRecord {
  state: CircuitState;
  failures: number;
  consecutiveSuccesses: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitInternalRecord>();

  private readonly defaultOptions: Required<CircuitBreakerOptions> = {
    failureThreshold: 5,
    recoveryTimeoutMs: 30000,
    halfOpenSuccessThreshold: 2,
  };

  /**
   * Executes a protected call through the circuit breaker.
   * If the circuit is OPEN, throws NotificationProviderError immediately.
   */
  public async execute<T>(
    serviceKey: string,
    action: () => Promise<T>,
    customOptions?: CircuitBreakerOptions,
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...customOptions };
    const circuit = this.getOrCreateCircuit(serviceKey);

    const now = Date.now();

    // Check if recovery timeout elapsed while OPEN -> switch to HALF_OPEN
    if (circuit.state === CircuitState.OPEN) {
      if (circuit.nextAttemptTime && now >= circuit.nextAttemptTime) {
        circuit.state = CircuitState.HALF_OPEN;
        circuit.consecutiveSuccesses = 0;
        this.logger.warn(
          `Circuit for '${serviceKey}' entered HALF_OPEN state. Probing upstream service...`,
        );
      } else {
        const remainingSeconds = Math.ceil(
          ((circuit.nextAttemptTime ?? now) - now) / 1000,
        );
        throw new NotificationProviderError(
          `Circuit breaker for '${serviceKey}' is OPEN. Requests blocked for ${remainingSeconds}s.`,
        );
      }
    }

    try {
      const result = await action();
      this.recordSuccess(serviceKey, circuit, opts);
      return result;
    } catch (error: unknown) {
      this.recordFailure(serviceKey, circuit, opts, error);
      throw error;
    }
  }

  public recordSuccess(
    serviceKey: string,
    circuit?: CircuitInternalRecord,
    opts?: Required<CircuitBreakerOptions>,
  ): void {
    const target = circuit ?? this.getOrCreateCircuit(serviceKey);
    const options = opts ?? this.defaultOptions;

    if (target.state === CircuitState.HALF_OPEN) {
      target.consecutiveSuccesses++;
      if (target.consecutiveSuccesses >= options.halfOpenSuccessThreshold) {
        target.state = CircuitState.CLOSED;
        target.failures = 0;
        target.consecutiveSuccesses = 0;
        target.lastFailureTime = undefined;
        target.nextAttemptTime = undefined;
        this.logger.log(
          `Circuit breaker for '${serviceKey}' recovered and returned to CLOSED.`,
        );
      }
    } else if (target.state === CircuitState.CLOSED) {
      // Periodic reset or decrement on success
      target.failures = 0;
    }
  }

  public recordFailure(
    serviceKey: string,
    circuit?: CircuitInternalRecord,
    opts?: Required<CircuitBreakerOptions>,
    error?: unknown,
  ): void {
    const target = circuit ?? this.getOrCreateCircuit(serviceKey);
    const options = opts ?? this.defaultOptions;
    const now = Date.now();

    target.lastFailureTime = now;

    if (target.state === CircuitState.HALF_OPEN) {
      // Immediate fallback to OPEN if probe fails
      target.state = CircuitState.OPEN;
      target.consecutiveSuccesses = 0;
      target.nextAttemptTime = now + options.recoveryTimeoutMs;
      this.logger.warn(
        `Probe failed for '${serviceKey}' during HALF_OPEN. Tripping back to OPEN for ${options.recoveryTimeoutMs}ms.`,
      );
    } else if (target.state === CircuitState.CLOSED) {
      target.failures++;
      if (target.failures >= options.failureThreshold) {
        target.state = CircuitState.OPEN;
        target.nextAttemptTime = now + options.recoveryTimeoutMs;
        const errMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Circuit breaker for '${serviceKey}' TRIPPED to OPEN after ${target.failures} failures. Last error: ${errMessage}`,
        );
      }
    }
  }

  public getStatus(serviceKey: string): CircuitBreakerStatus {
    const circuit = this.getOrCreateCircuit(serviceKey);
    return {
      state: circuit.state,
      failures: circuit.failures,
      consecutiveSuccesses: circuit.consecutiveSuccesses,
      lastFailureTime: circuit.lastFailureTime
        ? new Date(circuit.lastFailureTime)
        : undefined,
      nextAttemptTime: circuit.nextAttemptTime
        ? new Date(circuit.nextAttemptTime)
        : undefined,
    };
  }

  public isOpen(serviceKey: string): boolean {
    const circuit = this.getOrCreateCircuit(serviceKey);
    if (circuit.state === CircuitState.OPEN) {
      const now = Date.now();
      if (circuit.nextAttemptTime && now >= circuit.nextAttemptTime) {
        return false; // Eligible for half-open probe
      }
      return true;
    }
    return false;
  }

  public reset(serviceKey?: string): void {
    if (serviceKey) {
      this.circuits.delete(serviceKey);
    } else {
      this.circuits.clear();
    }
  }

  private getOrCreateCircuit(serviceKey: string): CircuitInternalRecord {
    let circuit = this.circuits.get(serviceKey);
    if (!circuit) {
      circuit = {
        state: CircuitState.CLOSED,
        failures: 0,
        consecutiveSuccesses: 0,
      };
      this.circuits.set(serviceKey, circuit);
    }
    return circuit;
  }
}
