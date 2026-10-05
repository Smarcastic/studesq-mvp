import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    "bg-primary-500",
    "bg-secondary-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-violet-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={cn(
          "rounded-full object-cover",
          sizes[size],
          className
        )}
      />
    );
  }

  const displayName = name || "?";
  const initials = getInitials(displayName);
  const bgColor = getColorFromName(displayName);

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white",
        sizes[size],
        bgColor,
        className
      )}
    >
      {initials}
    </div>
  );
}
