import { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';

interface UseAutoSaveOptions {
  delay?: number; // Delay in milliseconds (default: 2000)
  onSave: (data: any) => Promise<void> | void;
  dependencies?: any[]; // Values to watch for changes
}

export function useAutoSave<T>({
  delay = 2000,
  onSave,
  dependencies = []
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedRef = useRef<string | null>(null);

  const triggerSave = useCallback(async (data: T) => {
    if (isSavingRef.current) return;
    
    try {
      isSavingRef.current = true;
      await onSave(data);
      lastSavedRef.current = new Date().toISOString();
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave]);

  const debouncedSave = useCallback((data: T) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      triggerSave(data);
    }, delay);
  }, [delay, triggerSave]);

  // Manual save function
  const saveNow = useCallback(async (data: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await triggerSave(data);
  }, [triggerSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-save when dependencies change
  useEffect(() => {
    if (dependencies.length > 0) {
      const data = dependencies[0]; // Assume first dependency is the data to save
      if (data) {
        debouncedSave(data);
      }
    }
  }, dependencies);

  return {
    debouncedSave,
    saveNow,
    isSaving: isSavingRef.current,
    lastSaved: lastSavedRef.current,
  };
}

// Utility hook for debouncing any value
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}