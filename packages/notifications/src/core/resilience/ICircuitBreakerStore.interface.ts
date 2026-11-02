import { CircuitState } from "./CircuitBreaker.service";

export interface CircuitBreakerStateRecord {
  state: CircuitState;
  failures: number;
  consecutiveSuccesses: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

export interface ICircuitBreakerStore {
  getState(serviceKey: string): Promise<CircuitBreakerStateRecord | null>;
  setState(serviceKey: string, record: CircuitBreakerStateRecord, ttlMs?: number): Promise<void>;
  reset(serviceKey?: string): Promise<void>;
}
