import { useCallback, useRef } from 'react';

const DEFAULT_DEBOUNCE_DELAY = 500;

export const useDebounce = (fn, delay = DEFAULT_DEBOUNCE_DELAY) => {
  const timerRef = useRef(null);
  return useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
};
