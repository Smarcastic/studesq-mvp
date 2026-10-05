"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { type Theme } from "./themes";

type AmbientSound =
  | "off"
  | "rain"
  | "forest"
  | "brown-noise"
  | "white-noise"
  | "cafe"
  | "lofi";

const SOUND_OPTIONS: { id: AmbientSound; label: string; emoji: string }[] = [
  { id: "off", label: "Off", emoji: "\uD83D\uDD07" },
  { id: "rain", label: "Rain", emoji: "\uD83C\uDF27\uFE0F" },
  { id: "forest", label: "Forest", emoji: "\uD83C\uDF3F" },
  { id: "brown-noise", label: "Brown", emoji: "\u3030\uFE0F" },
  { id: "white-noise", label: "White", emoji: "\uD83C\uDF2B\uFE0F" },
  { id: "cafe", label: "Cafe", emoji: "\u2615" },
  { id: "lofi", label: "Lo-fi", emoji: "\uD83C\uDFB5" },
];

interface AmbientPlayerProps {
  isRunning: boolean;
  theme: Theme;
}

export function AmbientPlayer({ isRunning, theme }: AmbientPlayerProps) {
  const [sound, setSound] = useState<AmbientSound>(() => {
    if (typeof window === "undefined") return "off";
    return (localStorage.getItem("ambient-sound") as AmbientSound) || "off";
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 0.5;
    return parseFloat(localStorage.getItem("ambient-volume") || "0.5");
  });
  const [showPopover, setShowPopover] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isMinimal = theme.id === "minimal";

  const fadeAudio = useCallback(
    (targetVolume: number, durationMs: number) => {
      if (!audioRef.current) return;
      if (fadeRef.current) clearInterval(fadeRef.current);

      const audio = audioRef.current;
      const startVolume = audio.volume;
      const steps = Math.ceil(durationMs / 50);
      const delta = (targetVolume - startVolume) / steps;
      let step = 0;

      fadeRef.current = setInterval(() => {
        step++;
        const newVol = Math.max(0, Math.min(1, startVolume + delta * step));
        audio.volume = newVol;

        if (step >= steps) {
          if (fadeRef.current) clearInterval(fadeRef.current);
          audio.volume = targetVolume;
          if (targetVolume === 0) audio.pause();
        }
      }, 50);
    },
    []
  );

  // Load/switch audio
  useEffect(() => {
    if (sound === "off") {
      if (audioRef.current) {
        fadeAudio(0, 400);
      }
      return;
    }

    const src = `/audio/${sound}.mp3`;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;

    if (isRunning) {
      audio
        .play()
        .then(() => fadeAudio(volume, 800))
        .catch(() => {});
    }

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [sound]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start/stop with timer
  useEffect(() => {
    if (!audioRef.current || sound === "off") return;

    if (isRunning) {
      audioRef.current
        .play()
        .then(() => fadeAudio(volume, 800))
        .catch(() => {});
    } else {
      fadeAudio(0, 400);
    }
  }, [isRunning, sound, volume, fadeAudio]);

  // Volume change
  useEffect(() => {
    if (audioRef.current && isRunning && sound !== "off") {
      audioRef.current.volume = volume;
    }
    localStorage.setItem("ambient-volume", String(volume));
  }, [volume, isRunning, sound]);

  // Persist sound choice
  useEffect(() => {
    localStorage.setItem("ambient-sound", sound);
  }, [sound]);

  const currentOption = SOUND_OPTIONS.find((o) => o.id === sound)!;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowPopover(!showPopover)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-shadow duration-300"
        style={{
          background: isMinimal
            ? "rgba(0,0,0,0.05)"
            : "rgba(255,255,255,0.1)",
          color: theme.textColor,
          opacity: 0.8,
        }}
      >
        {sound === "off" ? (
          <VolumeX className="h-3.5 w-3.5" />
        ) : (
          <Volume2 className="h-3.5 w-3.5" />
        )}
        <span>
          {currentOption.emoji} {currentOption.label}
        </span>
      </motion.button>

      <AnimatePresence>
        {showPopover && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPopover(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 p-3 rounded-2xl shadow-2xl min-w-[220px]"
              style={{
                background: isMinimal
                  ? "rgba(255,255,255,0.97)"
                  : "rgba(10,10,20,0.9)",
                backdropFilter: "blur(24px)",
                border: `1px solid ${theme.surfaceBorder}`,
                boxShadow: `0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px ${theme.surfaceBorder}`,
              }}
            >
              {/* Grid of sound options */}
              <div className="grid grid-cols-2 gap-1">
                {SOUND_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSound(opt.id);
                      if (opt.id === "off") setShowPopover(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer"
                    style={{
                      background:
                        sound === opt.id ? theme.surface : "transparent",
                      color: theme.textColor,
                      opacity: sound === opt.id ? 1 : 0.65,
                      boxShadow:
                        sound === opt.id
                          ? `inset 0 0 0 1px ${theme.surfaceBorder}`
                          : "none",
                    }}
                  >
                    <span className="text-base">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Volume slider */}
              {sound !== "off" && (
                <div
                  className="mt-3 pt-3"
                  style={{
                    borderTop: `1px solid ${theme.surfaceBorder}`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <VolumeX
                      className="h-3 w-3 shrink-0"
                      style={{ color: theme.textColor, opacity: 0.4 }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${theme.ringColor} 0%, ${theme.ringColor} ${volume * 100}%, ${isMinimal ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)"} ${volume * 100}%, ${isMinimal ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)"} 100%)`,
                      }}
                    />
                    <Volume2
                      className="h-3 w-3 shrink-0"
                      style={{ color: theme.textColor, opacity: 0.4 }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
