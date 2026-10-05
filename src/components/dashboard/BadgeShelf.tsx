"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/ui/motion";
import { BADGES, RARITY_COLORS, checkBadgeEligibility, type BadgeStats, type BadgeDef } from "@/lib/badges";
import { Lock, ChevronRight } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface BadgeShelfProps {
  stats: BadgeStats;
}

const STORAGE_KEY = "studesq-seen-badges";

function getSeenBadges(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setSeenBadges(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function BadgeShelf({ stats }: BadgeShelfProps) {
  const earnedIds = useMemo(() => checkBadgeEligibility(stats), [stats]);
  const [newBadge, setNewBadge] = useState<BadgeDef | null>(null);

  // Detect newly earned badges
  useEffect(() => {
    const seen = getSeenBadges();
    const fresh = earnedIds.filter((id) => !seen.includes(id));
    if (fresh.length > 0) {
      // Show the first new badge
      const badge = BADGES.find((b) => b.id === fresh[0]);
      if (badge) {
        setNewBadge(badge);
        // Fire confetti
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#06b6d4", "#6366f1", "#f59e0b", "#10b981"],
        });
      }
      // Mark all as seen
      setSeenBadges([...seen, ...fresh]);
    }
  }, [earnedIds]);

  const displayBadges = BADGES.slice(0, 10); // Show up to 10 badges

  return (
    <>
      <FadeUp delay={0.15}>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">🏅</span>
              Badges
              <span className="text-xs font-normal text-slate-400">
                {earnedIds.length}/{BADGES.length}
              </span>
            </CardTitle>
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {displayBadges.map((badge) => {
              const earned = earnedIds.includes(badge.id);
              const colors = RARITY_COLORS[badge.rarity];
              return (
                <motion.div
                  key={badge.id}
                  initial={false}
                  animate={earned ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                  className={`
                    relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium
                    transition-colors cursor-default
                    ${earned
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : "text-slate-400 dark:text-slate-500"
                    }
                  `}
                  style={!earned ? { background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' } : undefined}
                  title={earned ? `${badge.title}: ${badge.description}` : `🔒 ${badge.title} — ${badge.description}`}
                >
                  {earned ? (
                    <span className="text-sm">{badge.icon}</span>
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">{badge.title}</span>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </FadeUp>

      {/* Badge Unlock Toast */}
      <AnimatePresence>
        {newBadge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setNewBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
              className="rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center"
              style={{ background: 'var(--bg-card)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.2 }}
                className="text-5xl block mb-4"
              >
                {newBadge.icon}
              </motion.span>
              <p className="text-xs font-medium text-cyan-500 uppercase tracking-wider mb-1">
                Badge Unlocked!
              </p>
              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{newBadge.title}</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{newBadge.description}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${RARITY_COLORS[newBadge.rarity].bg} ${RARITY_COLORS[newBadge.rarity].text}`}>
                {newBadge.rarity.charAt(0).toUpperCase() + newBadge.rarity.slice(1)}
              </span>
              <div className="mt-5">
                <Button size="sm" onClick={() => setNewBadge(null)}>
                  Awesome!
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
