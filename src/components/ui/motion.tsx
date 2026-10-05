"use client";

import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { ReactNode, useEffect, useRef } from "react";

const EASE_EXPO = [0.22, 1, 0.36, 1] as const;
const EASE_SPRING = { type: "spring" as const, stiffness: 300, damping: 24 };

// Fade + slide up — use for page content, lists, cards
export function FadeUp({
  children,
  delay = 0,
  duration = 0.4,
  className,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [...EASE_EXPO] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale + fade — use for modals, popovers
export function ScaleIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, scale: reduced ? 1 : 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: reduced ? 1 : 0.95 }}
      transition={EASE_SPRING}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger list wrapper
export function StaggerList({
  children,
  className,
  stagger = 0.06,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Use as direct child of StaggerList
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: reduced ? 0 : 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.35, ease: [...EASE_EXPO] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Page transition — wrap every page
export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [...EASE_EXPO] }}
    >
      {children}
    </motion.div>
  );
}

// Animated count-up number
export function CountUp({
  value,
  duration = 1.2,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    decimals > 0 ? latest.toFixed(decimals) : Math.round(latest).toString()
  );

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.33, 1, 0.68, 1], // easeOutCubic
    });
    return controls.stop;
  }, [value, duration, motionValue]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (nodeRef.current) {
        nodeRef.current.textContent = `${prefix}${v}${suffix}`;
      }
    });
    return unsubscribe;
  }, [rounded, prefix, suffix]);

  return (
    <motion.span
      ref={nodeRef}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {prefix}0{suffix}
    </motion.span>
  );
}

// Slide in from right — for panels, drawers
export function SlideInRight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, x: reduced ? 0 : 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: reduced ? 0 : 32 }}
      transition={{ duration: 0.35, ease: [...EASE_EXPO] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { AnimatePresence, motion };
