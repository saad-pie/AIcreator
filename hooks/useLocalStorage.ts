
import { useState, useEffect } from 'react';

function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      const parsedItem = JSON.parse(item);
      // This check is crucial. If the stored value is `null` (which is valid JSON),
      // we fall back to the initial value to prevent consumers of this hook
      // from crashing when they expect an array or object.
      return parsedItem !== null ? parsedItem : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      // Don't store `undefined` values, which are not valid in JSON.
      if (storedValue === undefined) {
        window.localStorage.removeItem(key);
      } else {
        const valueToStore = JSON.stringify(storedValue);
        window.localStorage.setItem(key, valueToStore);
      }
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;