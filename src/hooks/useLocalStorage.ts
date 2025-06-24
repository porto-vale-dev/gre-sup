
import { useState, useEffect } from 'react';

// Custom hook for using localStorage that is safe for SSR (avoids hydration errors)
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Initialize state with the initial value. This is what's used on the server.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // This effect runs only once on the client after the component has mounted.
  useEffect(() => {
    // Only run this on the client
    if (typeof window === 'undefined') {
        return;
    }

    try {
      // On the client, read the value from localStorage.
      const item = window.localStorage.getItem(key);
      // If a value is found, update the state.
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      // If there's an error reading from localStorage, log it.
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only on mount (client-side)

  // This effect runs whenever the stored value changes, updating localStorage.
  useEffect(() => {
    // Only run this on the client
    if (typeof window !== 'undefined') {
      try {
        // Save the updated value to localStorage.
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        // Handle potential errors, e.g., storage is full.
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
