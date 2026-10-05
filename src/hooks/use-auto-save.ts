"use client";

import { useRef, useCallback, useEffect } from "react";

export function useAutoSave(
  saveFn: () => void,
  delay: number = 2000
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFnRef = useRef(saveFn);

  // Keep save function ref up to date
  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  const triggerSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      saveFnRef.current();
    }, delay);
  }, [delay]);

  const cancelSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const saveNow = useCallback(() => {
    cancelSave();
    saveFnRef.current();
  }, [cancelSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelSave();
  }, [cancelSave]);

  return { triggerSave, cancelSave, saveNow };
}
