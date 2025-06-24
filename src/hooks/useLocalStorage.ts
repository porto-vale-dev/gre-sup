import { useState, useEffect } from 'react';

// A function to get value from localStorage, handling server-side rendering
function getValueFromLocalStorage<T>(key: string, initialValue: T | (() => T)): T {
  // If running on the server, return initialValue
  if (typeof window === 'undefined') {
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    // Parse stored json or if none return initialValue
    return item ? JSON.parse(item) : (typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue);
  } catch (error) {
    // If error, return initialValue and log the error
    console.warn(`Error reading localStorage key "${key}":`, error);
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  }
}

// Custom hook for using localStorage
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => getValueFromLocalStorage(key, initialValue));

  // useEffect to update localStorage when the state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Allow value to be a function so we have the same API as useState
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        // A more advanced implementation would handle the error case
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);
  
    // This effect ensures that the state is synchronized with localStorage on initial client-side render
    // This is important for hydration if the server-rendered value is different
    useEffect(() => {
        setStoredValue(getValueFromLocalStorage(key, initialValue));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


  return [storedValue, setStoredValue];
}
