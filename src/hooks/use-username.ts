import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function useCheckUsername(username: string) {
  const [debounced, setDebounced] = useState(username);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(username), 400);
    return () => clearTimeout(timer);
  }, [username]);

  const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(debounced) && !/_{2,}/.test(debounced);

  return useQuery<{ available: boolean; username: string }>({
    queryKey: ["username-check", debounced],
    queryFn: async () => {
      const res = await fetch(
        `/api/username/check?username=${encodeURIComponent(debounced)}`
      );
      if (!res.ok) throw new Error("Check failed");
      return res.json();
    },
    enabled: isValid && debounced.length >= 3,
  });
}
