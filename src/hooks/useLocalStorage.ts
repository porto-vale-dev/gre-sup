
import { useState, useEffect } from 'react';

// Custom hook for using localStorage that is safe for SSR (avoids hydration errors)
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Initialize state with the initial value. This is what's used on the server
  // and for the first client-side render to prevent hydration mismatches.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // This effect runs on the client after mount to read the value from localStorage.
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      // If a value is found in storage, update the state.
      // This will cause a re-render on the client with the hydrated value.
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
    }
  }, [key]);

  // This effect persists the state to localStorage whenever it changes.
  // It only runs on the client.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
