import { createCircuitBreaker, CircuitState, CircuitOpenError } from '../src/utils/circuitBreaker';

describe('Circuit Breaker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should trip to OPEN after the failure threshold is reached', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('API Down'));
    const breaker = createCircuitBreaker(mockFn, 3, 30000);

    await expect(breaker()).rejects.toThrow('API Down');
    await expect(breaker()).rejects.toThrow('API Down');
    await expect(breaker()).rejects.toThrow('API Down');

    // 4th call should fail fast without ever calling mockFn again.
    await expect(breaker()).rejects.toThrow(CircuitOpenError);
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });

  it('should stay CLOSED if failures do not reach the threshold', async () => {
    const mockFn = jest.fn().mockRejectedValueOnce(new Error('blip')).mockResolvedValueOnce('ok');
    const breaker = createCircuitBreaker(mockFn, 3, 30000);

    await expect(breaker()).rejects.toThrow('blip');
    await expect(breaker()).resolves.toBe('ok');

    expect(breaker.getState()).toBe(CircuitState.CLOSED);
    expect(breaker.getFailureCount()).toBe(0);
  });

  it('should transition to HALF_OPEN after the reset timeout and CLOSE on success', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockRejectedValueOnce(new Error('fail 3'))
      .mockResolvedValueOnce('recovered');

    const breaker = createCircuitBreaker(mockFn, 3, 30000);

    await expect(breaker()).rejects.toThrow('fail 1');
    await expect(breaker()).rejects.toThrow('fail 2');
    await expect(breaker()).rejects.toThrow('fail 3');
    expect(breaker.getState()).toBe(CircuitState.OPEN);

    // Still within the timeout window: fails fast.
    jest.advanceTimersByTime(29000);
    await expect(breaker()).rejects.toThrow(CircuitOpenError);
    expect(mockFn).toHaveBeenCalledTimes(3);

    // Past the timeout: the next call is allowed through as a HALF_OPEN probe.
    jest.advanceTimersByTime(1001);
    await expect(breaker()).resolves.toBe('recovered');
    expect(mockFn).toHaveBeenCalledTimes(4);
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should re-OPEN if the HALF_OPEN probe fails', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockRejectedValueOnce(new Error('fail 3'))
      .mockRejectedValueOnce(new Error('probe failed'));

    const breaker = createCircuitBreaker(mockFn, 3, 30000);

    await expect(breaker()).rejects.toThrow('fail 1');
    await expect(breaker()).rejects.toThrow('fail 2');
    await expect(breaker()).rejects.toThrow('fail 3');

    jest.advanceTimersByTime(30001);
    await expect(breaker()).rejects.toThrow('probe failed');

    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });

  it('notifies onStateChange as the circuit transitions', async () => {
    const onStateChange = jest.fn();
    const mockFn = jest.fn().mockRejectedValue(new Error('down'));
    const breaker = createCircuitBreaker(mockFn, { failureThreshold: 2, resetTimeoutMs: 1000, onStateChange });

    await expect(breaker()).rejects.toThrow();
    expect(onStateChange).not.toHaveBeenCalled();

    await expect(breaker()).rejects.toThrow();
    expect(onStateChange).toHaveBeenCalledWith(CircuitState.OPEN);
  });
});
