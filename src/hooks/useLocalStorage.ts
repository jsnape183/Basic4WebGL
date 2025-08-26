import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Read from localStorage or use initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch (err) {
      console.error('Failed to read localStorage', err);
      return initialValue;
    }
  });

  // Whenever value changes, persist it
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (err) {
      console.error('Failed to write localStorage', err);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
