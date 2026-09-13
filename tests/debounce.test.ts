import { debounce } from '../src/utils/debounce';

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not invoke the function before the delay elapses', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 500);

    debounced('a');
    jest.advanceTimersByTime(499);

    expect(fn).not.toHaveBeenCalled();
  });

  it('invokes the function once the delay elapses', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 500);

    debounced('a');
    jest.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('resets the timer on every call within the delay window', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 500);

    debounced('a');
    jest.advanceTimersByTime(300);
    debounced('b');
    jest.advanceTimersByTime(300);
    debounced('c');
    jest.advanceTimersByTime(499);

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('cancel() prevents a pending invocation from firing', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 500);

    debounced('a');
    debounced.cancel();
    jest.advanceTimersByTime(1000);

    expect(fn).not.toHaveBeenCalled();
  });
});
