"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Global "G + key" chord shortcuts for navigation.
 * Press G, then within 500ms press the target key.
 */
const CHORD_MAP: Record<string, string> = {
  d: "/dashboard",
  t: "/study/timer",
  n: "/study/notes",
  a: "/achievements",
  g: "/goals",
  e: "/exams",
  h: "/habits",
  r: "/reading",
  s: "/settings",
  p: "/profile",
  f: "/study/flashcards",
};

export function useGlobalShortcuts() {
  const router = useRouter();
  const gPressedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;

      // Skip if modifier keys held (except for Ctrl+K handled by CommandPalette)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // First press: "g"
      if (key === "g" && !gPressedRef.current) {
        gPressedRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          gPressedRef.current = false;
        }, 500);
        return;
      }

      // Second press: target key
      if (gPressedRef.current && CHORD_MAP[key]) {
        e.preventDefault();
        gPressedRef.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        router.push(CHORD_MAP[key]);
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [router]);
}
