/**
 * Creates a debounced version of `func` that delays invoking it until
 * `delay` milliseconds have elapsed since the last time the debounced
 * function was called.
 *
 * @param func  The function to debounce.
 * @param delay Milliseconds to wait after the last call before invoking `func`.
 * @returns A debounced wrapper around `func`, plus a `cancel` method to
 *          clear any pending invocation (useful on component unmount).
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      func(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debounced;
}
