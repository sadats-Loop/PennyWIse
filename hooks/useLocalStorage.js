import { useEffect, useState } from "react";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored));
    } catch {
      // Keep initial value when localStorage is unavailable.
    }
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors.
    }
  }, [key, value]);

  return [value, setValue];
}