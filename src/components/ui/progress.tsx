import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  showLabel?: boolean;
}

const colors = {
  primary: "bg-primary-500",
  secondary: "bg-secondary-500",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
};

const heights = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function Progress({
  value,
  className,
  size = "md",
  color = "primary",
  showLabel = false,
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
          <span className="text-sm font-medium">{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-gray-200 dark:bg-dark-border overflow-hidden",
          heights[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colors[color]
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
