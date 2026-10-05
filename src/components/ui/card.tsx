"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  padding?: "sm" | "md" | "lg" | "none";
}

export function Card({
  children,
  className,
  hover = false,
  glass = true,
  padding = "md",
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-8",
  };

  const Comp = hover ? motion.div : "div";
  const hoverProps = hover
    ? {
        whileHover: { y: -4, transition: { duration: 0.2 } },
      }
    : {};

  return (
    <Comp
      {...hoverProps}
      className={cn(
        "rounded-[14px] border",
        hover && "cursor-pointer transition-shadow duration-200 hover:shadow-lg",
        paddings[padding],
        className
      )}
      style={{
        background: "var(--bg-card, #ffffff)",
        borderColor: "var(--border-subtle, #f1f5f9)",
        boxShadow: glass ? "var(--glass-shadow)" : undefined,
      }}
    >
      {children}
    </Comp>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn("text-lg font-semibold", className)}
      style={{ color: "var(--text-primary)" }}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p
      className={cn("text-sm", className)}
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
    </p>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn(className)}>{children}</div>;
}
