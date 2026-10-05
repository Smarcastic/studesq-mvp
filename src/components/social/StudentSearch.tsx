"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface StudentSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function StudentSearch({
  onSearch,
  placeholder = "Search by name or username...",
}: StudentSearchProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
        style={{ color: "var(--text-muted)" }}
      />
      <Input
        id="student-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );
}
