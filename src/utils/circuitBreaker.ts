export const CircuitState = {
  CLOSED: 'CLOSED', // Normal operation, requests pass through
  OPEN: 'OPEN', // Failing, requests are blocked (fail fast)
  HALF_OPEN: 'HALF_OPEN', // Testing recovery, single request allowed
} as const;

export type CircuitState = (typeof CircuitState)[keyof typeof CircuitState];

export class CircuitOpenError extends Error {
  constructor(message = 'Circuit Breaker is OPEN') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  onStateChange?: (state: CircuitState) => void;
}

/**
 * Wraps an async function with circuit breaker logic to prevent cascading
 * failures against an unreliable upstream API.
 *
 * State machine:
 *  - CLOSED: requests pass through normally. Failures increment a counter.
 *    Once the counter reaches `failureThreshold`, the circuit trips OPEN.
 *  - OPEN: requests fail immediately without hitting the network. Once
 *    `resetTimeoutMs` has elapsed since the trip, the next call is allowed
 *    through as a HALF_OPEN probe.
 *  - HALF_OPEN: exactly one request is allowed through. Success resets the
 *    circuit to CLOSED; failure re-opens it and restarts the timeout.
 */
export function createCircuitBreaker<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  failureThresholdOrOptions: number | CircuitBreakerOptions = 3,
  resetTimeoutMs = 30000,
  onStateChangeArg?: (state: CircuitState) => void
) {
  const options: CircuitBreakerOptions =
    typeof failureThresholdOrOptions === 'number'
      ? {
          failureThreshold: failureThresholdOrOptions,
          resetTimeoutMs,
          onStateChange: onStateChangeArg,
        }
      : failureThresholdOrOptions;

  const failureThreshold = options.failureThreshold ?? 3;
  const resetTimeout = options.resetTimeoutMs ?? 30000;
  const onStateChange = options.onStateChange;

  let state: CircuitState = CircuitState.CLOSED;
  let failureCount = 0;
  let lastFailureTime = 0;
  let halfOpenInFlight = false;

  const setState = (next: CircuitState) => {
    if (next !== state) {
      state = next;
      onStateChange?.(state);
    }
  };

  const wrapped = async (...args: TArgs): Promise<TResult> => {
    // 1. If OPEN, decide whether the reset timeout has elapsed.
    if (state === CircuitState.OPEN) {
      const elapsed = Date.now() - lastFailureTime;
      if (elapsed > resetTimeout) {
        setState(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitOpenError();
      }
    }

    // 2. In HALF_OPEN, only allow a single in-flight probe request.
    if (state === CircuitState.HALF_OPEN && halfOpenInFlight) {
      throw new CircuitOpenError('Circuit Breaker is HALF_OPEN (probe in progress)');
    }

    const wasHalfOpen = state === CircuitState.HALF_OPEN;
    if (wasHalfOpen) halfOpenInFlight = true;

    try {
      const result = await fn(...args);
      // Success: reset failure count, close the circuit if it was probing.
      failureCount = 0;
      if (wasHalfOpen) {
        halfOpenInFlight = false;
        setState(CircuitState.CLOSED);
      }
      return result;
    } catch (err) {
      failureCount += 1;
      if (wasHalfOpen) {
        halfOpenInFlight = false;
      }
      if (wasHalfOpen || failureCount >= failureThreshold) {
        lastFailureTime = Date.now();
        setState(CircuitState.OPEN);
      }
      throw err;
    }
  };

  return Object.assign(wrapped, {
    getState: () => state,
    getFailureCount: () => failureCount,
    reset: () => {
      state = CircuitState.CLOSED;
      failureCount = 0;
      lastFailureTime = 0;
      halfOpenInFlight = false;
    },
  });
}
