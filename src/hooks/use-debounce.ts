
import { useState, useEffect, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const previousValueRef = useRef<T>(value);

  useEffect(() => {
    // Skip debounce if the value hasn't actually changed
    if (JSON.stringify(previousValueRef.current) === JSON.stringify(value)) {
      return;
    }
    
    // Update the ref with the new value
    previousValueRef.current = value;
    
    // Set up the debounce timer
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
