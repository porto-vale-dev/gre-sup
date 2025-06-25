"use client";

import { useState, useEffect } from 'react';

// Custom hook for using localStorage that is safe for SSR (avoids hydration errors)
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Initialize state with the initial value. This is what's used on the server
  // and for the first client-side render to prevent hydration mismatches.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // This effect runs ONCE on the client after mount to read the value from localStorage.
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
  // This hook should run only once on mount to hydrate the state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This effect persists the state to localStorage whenever it changes.
  useEffect(() => {
    try {
      // Check if we are on the client side before accessing localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
