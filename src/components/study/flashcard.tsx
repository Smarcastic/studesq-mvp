"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  front: string;
  back: string;
  hints?: string | null;
  flipped?: boolean;
  onFlip?: () => void;
  className?: string;
}

export function Flashcard({ front, back, hints, flipped: controlledFlipped, onFlip, className }: FlashcardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;
  const [showHint, setShowHint] = useState(false);

  const handleFlip = () => {
    if (onFlip) {
      onFlip();
    } else {
      setInternalFlipped(!internalFlipped);
    }
    setShowHint(false);
  };

  return (
    <div
      className={cn("perspective-1000 cursor-pointer select-none", className)}
      onClick={handleFlip}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl p-8 flex flex-col items-center justify-center bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Question</p>
          <p className="text-xl font-medium text-center leading-relaxed">{front}</p>
          {hints && !showHint && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowHint(true); }}
              className="mt-6 text-xs text-primary-500 hover:text-primary-600 transition-colors"
            >
              Show hint
            </button>
          )}
          {hints && showHint && (
            <p className="mt-4 text-sm text-gray-400 italic text-center">{hints}</p>
          )}
          <p className="absolute bottom-4 text-xs text-gray-400">Click to flip</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl p-8 flex flex-col items-center justify-center bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/30 shadow-lg"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-xs font-medium text-primary-400 uppercase tracking-wider mb-4">Answer</p>
          <p className="text-xl font-medium text-center leading-relaxed">{back}</p>
          <p className="absolute bottom-4 text-xs text-gray-400">Click to flip back</p>
        </div>
      </motion.div>
    </div>
  );
}
