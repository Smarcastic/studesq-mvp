"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useCheckUsername } from "@/hooks/use-username";
import { Check, X, Loader2 } from "lucide-react";

interface UsernameSetupProps {
  value: string;
  onChange: (value: string) => void;
  currentUsername?: string;
}

export function UsernameSetup({
  value,
  onChange,
  currentUsername,
}: UsernameSetupProps) {
  const [touched, setTouched] = useState(false);
  const { data, isLoading } = useCheckUsername(value);

  const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(value) && !/_{2,}/.test(value);
  const isSameAsCurrent =
    currentUsername && value.toLowerCase() === currentUsername.toLowerCase();
  const isAvailable = isSameAsCurrent || data?.available;

  return (
    <div>
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          @
        </span>
        <Input
          id="username"
          value={value}
          onChange={(e) => {
            onChange(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""));
            if (!touched) setTouched(true);
          }}
          placeholder="your_username"
          className="pl-8 pr-10"
          maxLength={20}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading && value.length >= 3 && (
            <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
          )}
          {!isLoading && touched && isValid && isAvailable && (
            <Check className="h-4 w-4 text-emerald-500" />
          )}
          {!isLoading && touched && isValid && !isAvailable && !isSameAsCurrent && (
            <X className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>
      {touched && value.length > 0 && value.length < 3 && (
        <p className="text-xs mt-1 text-red-500">
          Username must be at least 3 characters
        </p>
      )}
      {touched && isValid && !isLoading && !isAvailable && !isSameAsCurrent && (
        <p className="text-xs mt-1 text-red-500">
          Username is already taken
        </p>
      )}
      {touched && isValid && !isLoading && isAvailable && (
        <p className="text-xs mt-1 text-emerald-500">
          Username is available!
        </p>
      )}
    </div>
  );
}
