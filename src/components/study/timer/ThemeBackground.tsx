"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type ThemeId, THEMES } from "./themes";
import { useMemo, useEffect, useRef, useState, useCallback } from "react";

interface ThemeBackgroundProps {
  themeId: ThemeId;
  isFullscreen?: boolean;
  isRunning?: boolean;
  isPaused?: boolean;
  focusScore?: number; // 0–100 — drives background intensity
  breathValue?: number; // 0–1 breathing cycle
  elapsed?: number; // seconds since start
}

export function ThemeBackground({
  themeId,
  isFullscreen = false,
  isRunning = false,
  isPaused = false,
  focusScore = 100,
  breathValue = 0,
  elapsed = 0,
}: ThemeBackgroundProps) {
  const theme = THEMES[themeId];

  // Parallax — mouse position tracking
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Smooth parallax via rAF (lerp)
  useEffect(() => {
    const animate = () => {
      setMousePos((prev) => ({
        x: prev.x + (mouseRef.current.x - prev.x) * 0.04,
        y: prev.y + (mouseRef.current.y - prev.y) * 0.04,
      }));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Parallax offset from center (range: -1 to 1)
  const px = (mousePos.x - 0.5) * 2;
  const py = (mousePos.y - 0.5) * 2;

  // Focus-driven background intensity — dims on pause
  const bgIntensity = isPaused ? 0.3 : isRunning ? Math.max(0.4, focusScore / 100) : 0.6;

  // Breathing modulation for ambient orbs
  const breathScale = 1 + breathValue * 0.05;
  const breathOpacity = 1 + breathValue * 0.08;

  // Particle animation speed multiplier — 20% speed when paused
  const particleSpeedClass = isPaused ? "paused-particles" : "";

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Layer 0: Base gradient — slow drifting */}
      <AnimatePresence mode="wait">
        <motion.div
          key={themeId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
          style={{
            background: `linear-gradient(-45deg, ${theme.gradient.join(", ")})`,
            backgroundSize: "400% 400%",
            animation: "timer-gradient-shift 20s ease infinite",
          }}
        />
      </AnimatePresence>

      {/* Layer 1: Depth blur — parallax-reactive ambient orbs, breathing modulated */}
      {themeId !== "minimal" && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`ambients-${themeId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: bgIntensity * breathOpacity }}
            exit={{ opacity: 0 }}
            transition={{ duration: isPaused ? 0.6 : 1.2 }}
          >
            {/* Far orb — slow parallax, heavy blur */}
            <div
              className="absolute w-[700px] h-[700px] rounded-full"
              style={{
                top: "5%",
                right: "-12%",
                background: `radial-gradient(circle, ${theme.auraColor} 0%, transparent 65%)`,
                animation: "ambient-drift-1 25s ease-in-out infinite alternate",
                filter: "blur(60px)",
                transform: `translate3d(${px * -15}px, ${py * -10}px, 0) scale(${breathScale})`,
                willChange: "transform",
                opacity: isPaused ? 0.3 : 1,
                transition: "opacity 0.6s ease",
              }}
            />
            {/* Mid orb — medium parallax */}
            <div
              className="absolute w-[500px] h-[500px] rounded-full"
              style={{
                bottom: "0%",
                left: "-8%",
                background: `radial-gradient(circle, ${theme.auraColor} 0%, transparent 65%)`,
                animation: "ambient-drift-2 30s ease-in-out infinite alternate",
                filter: "blur(40px)",
                transform: `translate3d(${px * -25}px, ${py * -18}px, 0) scale(${breathScale})`,
                willChange: "transform",
                opacity: isPaused ? 0.3 : 1,
                transition: "opacity 0.6s ease",
              }}
            />
            {/* Near orb — fast parallax, less blur */}
            <div
              className="absolute w-[300px] h-[300px] rounded-full"
              style={{
                top: "40%",
                left: "50%",
                background: `radial-gradient(circle, ${theme.glowColor} 0%, transparent 70%)`,
                filter: "blur(30px)",
                transform: `translate3d(${px * -40}px, ${py * -30}px, 0) scale(${breathScale})`,
                opacity: (isPaused ? 0.1 : 0.3) * bgIntensity,
                willChange: "transform",
                transition: "opacity 0.6s ease",
              }}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Layer 2: Theme-specific particles — dynamic density based on focus */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`particles-${themeId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isPaused ? 0.3 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={particleSpeedClass}
          style={{
            transform: `translate3d(${px * -8}px, ${py * -6}px, 0)`,
            willChange: "transform",
          }}
        >
          {theme.particles === "bubbles" && (
            <OceanBubbles intensity={bgIntensity} focusScore={focusScore} />
          )}
          {theme.particles === "bands" && (
            <AuroraBands intensity={bgIntensity} focusScore={focusScore} />
          )}
          {theme.particles === "stars" && (
            <StarField intensity={bgIntensity} focusScore={focusScore} elapsed={elapsed} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Mercury: chrome reflective metallic sweep */}
      {themeId === "mercury" && <MercurySweep px={px} py={py} focusScore={focusScore} />}

      {/* Minimal: subtle floating geometric shapes */}
      {themeId === "minimal" && (
        <MinimalGeometry px={px} py={py} focusScore={focusScore} isRunning={isRunning} />
      )}

      {/* Layer 3: Vignette — stronger in fullscreen, deeper when paused */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: isPaused ? 1 : 1,
        }}
        transition={{ duration: 0.6 }}
        style={{
          background: isPaused
            ? `radial-gradient(ellipse at center, transparent 30%, ${themeId === "minimal" ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.5)"} 100%)`
            : isFullscreen
              ? `radial-gradient(ellipse at center, transparent 40%, ${themeId === "minimal" ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.45)"} 100%)`
              : `radial-gradient(ellipse at center, transparent 55%, ${themeId === "minimal" ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.2)"} 100%)`,
          transition: "background 0.6s ease",
        }}
      />

      {/* Layer 3b: Pause radial blur overlay — clear center, blurred edges */}
      <AnimatePresence>
        {isPaused && themeId !== "minimal" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              backdropFilter: "blur(2px)",
              WebkitMaskImage: "radial-gradient(ellipse at center, transparent 25%, black 70%)",
              maskImage: "radial-gradient(ellipse at center, transparent 25%, black 70%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Layer 4: Focus-reactive subtle edge glow */}
      {isRunning && focusScore >= 80 && themeId !== "minimal" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 + (focusScore - 80) * 0.005 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${theme.glowColor} 0%, transparent 60%)`,
          }}
        />
      )}

      <style jsx global>{`
        @keyframes timer-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ambient-drift-1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-60px, 40px) scale(1.15); }
          100% { transform: translate(30px, -20px) scale(0.9); }
        }
        @keyframes ambient-drift-2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -30px) scale(1.1); }
          100% { transform: translate(-30px, 20px) scale(0.95); }
        }
        .paused-particles * {
          animation-duration: 999s !important;
        }
      `}</style>
    </div>
  );
}

function MercurySweep({ px, py, focusScore }: { px: number; py: number; focusScore: number }) {
  // Chrome sweep frequency increases with focus
  const sweepDur1 = `${Math.max(5, 10 - (focusScore / 100) * 5)}s`;
  const sweepDur2 = `${Math.max(8, 15 - (focusScore / 100) * 7)}s`;
  const sweepDur3 = `${Math.max(6, 12 - (focusScore / 100) * 6)}s`;

  // Mercury liquid droplets — count scales with focus
  const dropletCount = useMemo(
    () => Math.floor(12 + (focusScore / 100) * 18),
    [focusScore]
  );
  const droplets = useMemo(
    () =>
      Array.from({ length: dropletCount }, (_, i) => ({
        id: i,
        left: `${3 + Math.random() * 94}%`,
        size: 3 + Math.random() * 6,
        duration: 10 + Math.random() * 15,
        delay: Math.random() * 12,
        opacity: 0.08 + Math.random() * 0.2,
        driftX: (Math.random() - 0.5) * 40,
        isLarge: i < dropletCount * 0.15, // top 15% are large glowing droplets
      })),
    [dropletCount]
  );

  return (
    <div className="absolute inset-0 overflow-hidden motion-safe:block motion-reduce:hidden">
      {/* Large metallic radial reflection — parallax reactive */}
      <div
        className="absolute w-[140%] h-[140%] -left-[20%] -top-[20%]"
        style={{
          background: `radial-gradient(ellipse at ${50 + px * 20}% ${50 + py * 20}%, rgba(228,228,231,0.08) 0%, rgba(161,161,170,0.03) 35%, transparent 60%)`,
          transition: "background 0.3s ease",
        }}
      />

      {/* Secondary metallic reflection — opposite corner */}
      <div
        className="absolute w-[100%] h-[100%]"
        style={{
          background: `radial-gradient(ellipse at ${30 - px * 10}% ${70 - py * 10}%, rgba(212,212,216,0.05) 0%, transparent 45%)`,
          transition: "background 0.3s ease",
        }}
      />

      {/* Diagonal chrome light sweep 1 — bright, wide */}
      <div
        className="absolute w-[200%] h-[3px]"
        style={{
          top: "35%",
          left: "-50%",
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 20%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.15) 52%, rgba(255,255,255,0.04) 80%, transparent 100%)",
          transform: "rotate(-15deg)",
          animation: `mercury-sweep ${sweepDur1} ease-in-out infinite`,
          boxShadow: "0 0 20px 4px rgba(255,255,255,0.06)",
        }}
      />

      {/* Diagonal chrome light sweep 2 — thinner, offset */}
      <div
        className="absolute w-[200%] h-[2px]"
        style={{
          top: "58%",
          left: "-50%",
          background: "linear-gradient(90deg, transparent 0%, rgba(212,212,216,0.03) 25%, rgba(228,228,231,0.12) 50%, rgba(212,212,216,0.03) 75%, transparent 100%)",
          transform: "rotate(-15deg)",
          animation: `mercury-sweep ${sweepDur2} ease-in-out 3s infinite`,
          boxShadow: "0 0 12px 2px rgba(228,228,231,0.04)",
        }}
      />

      {/* Third sweep — vertical, subtle */}
      <div
        className="absolute w-[2px] h-[200%]"
        style={{
          left: "45%",
          top: "-50%",
          background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.03) 30%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 70%, transparent 100%)",
          animation: `mercury-sweep-v ${sweepDur3} ease-in-out 1.5s infinite`,
        }}
      />

      {/* Horizontal scanner — brighter */}
      <div
        className="absolute w-full h-[1px] left-0"
        style={{
          background: "linear-gradient(90deg, transparent 10%, rgba(228,228,231,0.12) 40%, rgba(255,255,255,0.18) 50%, rgba(228,228,231,0.12) 60%, transparent 90%)",
          animation: "mercury-scan 7s ease-in-out infinite",
          boxShadow: "0 0 8px 1px rgba(228,228,231,0.06)",
        }}
      />

      {/* Liquid mercury droplets — rising particles */}
      {droplets.map((d) => (
        <div
          key={d.id}
          className="absolute rounded-full"
          style={{
            left: d.left,
            bottom: "-10px",
            width: d.size,
            height: d.size,
            background: d.isLarge
              ? `radial-gradient(circle at 35% 35%, rgba(250,250,250,${d.opacity * 1.8}), rgba(161,161,170,${d.opacity}))`
              : `radial-gradient(circle at 35% 35%, rgba(228,228,231,${d.opacity * 1.2}), rgba(113,113,122,${d.opacity * 0.6}))`,
            boxShadow: d.isLarge
              ? `0 0 ${d.size * 3}px rgba(228,228,231,${d.opacity * 0.5}), 0 0 ${d.size * 6}px rgba(161,161,170,${d.opacity * 0.2})`
              : `0 0 ${d.size * 2}px rgba(161,161,170,${d.opacity * 0.3})`,
            animation: `mercury-drop-${d.id % 4} ${d.duration}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}

      {/* Ambient metallic shimmer band — large, slow */}
      <div
        className="absolute w-full"
        style={{
          height: "200px",
          background: "linear-gradient(180deg, transparent, rgba(161,161,170,0.03), rgba(228,228,231,0.05), rgba(161,161,170,0.03), transparent)",
          animation: "mercury-shimmer 12s ease-in-out infinite",
          filter: "blur(30px)",
        }}
      />

      {/* Heat-haze distortion band — wider trigger */}
      {focusScore >= 40 && (
        <div
          className="absolute w-full left-0"
          style={{
            height: "100px",
            animation: "heat-haze 8s ease-in-out infinite",
            backdropFilter: `blur(${0.3 + (focusScore - 40) * 0.01}px)`,
            opacity: Math.min(0.7, (focusScore - 40) / 60),
          }}
        />
      )}

      <style jsx>{`
        @keyframes mercury-sweep {
          0% { transform: rotate(-15deg) translateX(-100%); }
          100% { transform: rotate(-15deg) translateX(100%); }
        }
        @keyframes mercury-sweep-v {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes mercury-scan {
          0% { top: 15%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 85%; opacity: 0; }
        }
        @keyframes mercury-shimmer {
          0% { top: -10%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        @keyframes heat-haze {
          0% { top: 25%; }
          50% { top: 65%; }
          100% { top: 25%; }
        }
        @keyframes mercury-drop-0 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          8% { opacity: 1; }
          50% { transform: translateY(-50vh) translateX(12px); }
          92% { opacity: 0.6; }
          100% { transform: translateY(-110vh) translateX(-5px); opacity: 0; }
        }
        @keyframes mercury-drop-1 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          8% { opacity: 1; }
          50% { transform: translateY(-55vh) translateX(-15px); }
          92% { opacity: 0.7; }
          100% { transform: translateY(-110vh) translateX(8px); opacity: 0; }
        }
        @keyframes mercury-drop-2 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(-48vh) translateX(8px); }
          90% { opacity: 0.5; }
          100% { transform: translateY(-110vh) translateX(-10px); opacity: 0; }
        }
        @keyframes mercury-drop-3 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          8% { opacity: 1; }
          50% { transform: translateY(-52vh) translateX(-20px); }
          88% { opacity: 0.8; }
          100% { transform: translateY(-110vh) translateX(12px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function MinimalGeometry({
  px, py, focusScore, isRunning,
}: {
  px: number; py: number; focusScore: number; isRunning: boolean;
}) {
  const shapes = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: `${10 + Math.random() * 80}%`,
        top: `${10 + Math.random() * 80}%`,
        size: 20 + Math.random() * 40,
        duration: 15 + Math.random() * 20,
        delay: Math.random() * 10,
        isCircle: Math.random() > 0.5,
        rotation: Math.random() * 360,
      })),
    []
  );

  return (
    <div className="absolute inset-0 motion-safe:block motion-reduce:hidden">
      {shapes.map((s) => (
        <div
          key={s.id}
          className={s.isCircle ? "rounded-full" : "rounded-lg"}
          style={{
            position: "absolute",
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            border: "1px solid rgba(6, 182, 212, 0.06)",
            background: "rgba(6, 182, 212, 0.02)",
            transform: `translate3d(${px * -10}px, ${py * -8}px, 0) rotate(${s.rotation}deg)`,
            animation: `minimal-float ${s.duration}s ease-in-out ${s.delay}s infinite alternate`,
            opacity: isRunning ? Math.min(0.6, focusScore / 200) : 0.15,
            transition: "opacity 1s ease",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes minimal-float {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-20px) rotate(15deg); }
        }
      `}</style>
    </div>
  );
}

function OceanBubbles({ intensity, focusScore }: { intensity: number; focusScore: number }) {
  // Dynamic bubble count: 8–30 based on focus
  const bubbleCount = useMemo(() =>
    Math.floor(8 + (focusScore / 100) * 22), [focusScore]
  );

  const bubbles = useMemo(
    () =>
      Array.from({ length: bubbleCount }, (_, i) => ({
        id: i,
        left: `${2 + Math.random() * 96}%`,
        size: 2 + Math.random() * 8,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 10,
        opacity: (0.08 + Math.random() * 0.2) * intensity,
        drift: (Math.random() - 0.5) * 30,
        isBioluminescent: i >= bubbleCount * 0.8, // top 20% glow
      })),
    [intensity, bubbleCount]
  );

  return (
    <div className="absolute inset-0 motion-safe:block motion-reduce:hidden">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-full"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            bottom: "-20px",
            background: b.isBioluminescent
              ? `rgba(34, 211, 238, ${b.opacity * 1.5})`
              : `rgba(34, 211, 238, ${b.opacity})`,
            boxShadow: b.isBioluminescent
              ? `0 0 ${b.size * 4}px rgba(34, 211, 238, ${b.opacity * 0.8}), 0 0 ${b.size * 8}px rgba(34, 211, 238, ${b.opacity * 0.3})`
              : `0 0 ${b.size * 2}px rgba(34, 211, 238, ${b.opacity * 0.5})`,
            animation: `bubble-rise-${b.id % 4} ${b.duration}s ease-in-out ${b.delay}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes bubble-rise-0 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(-50vh) translateX(15px); }
          90% { opacity: 0.8; }
          100% { transform: translateY(-110vh) translateX(0); opacity: 0; }
        }
        @keyframes bubble-rise-1 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(-50vh) translateX(-12px); }
          90% { opacity: 0.8; }
          100% { transform: translateY(-110vh) translateX(5px); opacity: 0; }
        }
        @keyframes bubble-rise-2 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(-55vh) translateX(8px); }
          90% { opacity: 0.7; }
          100% { transform: translateY(-110vh) translateX(-5px); opacity: 0; }
        }
        @keyframes bubble-rise-3 {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(-45vh) translateX(-18px); }
          90% { opacity: 0.9; }
          100% { transform: translateY(-110vh) translateX(10px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function AuroraBands({ intensity, focusScore }: { intensity: number; focusScore: number }) {
  // Dynamic band count: 5–9 based on focus
  const bandCount = Math.floor(5 + (focusScore / 100) * 4);
  const showSecondary = focusScore > 70;

  return (
    <div className="absolute inset-0 motion-safe:block motion-reduce:hidden">
      {/* Primary aurora bands */}
      {Array.from({ length: bandCount }, (_, i) => (
        <div
          key={`primary-${i}`}
          className="absolute w-full"
          style={{
            top: `${12 + i * (80 / bandCount)}%`,
            height: "120px",
            background: `linear-gradient(90deg, transparent, rgba(167, 139, 250, ${(0.04 + i * 0.015) * intensity}), rgba(99, 102, 241, ${(0.03 + i * 0.015) * intensity}), rgba(139, 92, 246, ${(0.03 + i * 0.01) * intensity}), transparent)`,
            animation: `aurora-drift ${12 + i * 3}s ease-in-out ${i * 1.5}s infinite alternate`,
            filter: "blur(45px)",
          }}
        />
      ))}
      {/* Secondary complementary aurora — pink/teal, fades in at high focus */}
      {showSecondary && (
        <>
          {[0, 1, 2].map((i) => (
            <div
              key={`secondary-${i}`}
              className="absolute w-full"
              style={{
                top: `${20 + i * 25}%`,
                height: "100px",
                background: `linear-gradient(90deg, transparent, rgba(236, 72, 153, ${0.02 * intensity}), rgba(20, 184, 166, ${0.025 * intensity}), rgba(236, 72, 153, ${0.015 * intensity}), transparent)`,
                animation: `aurora-drift ${18 + i * 4}s ease-in-out ${i * 2 + 3}s infinite alternate`,
                filter: "blur(50px)",
                opacity: Math.min(1, (focusScore - 70) / 30),
                transition: "opacity 2s ease",
              }}
            />
          ))}
        </>
      )}
      <style jsx>{`
        @keyframes aurora-drift {
          0% { transform: translateX(-15%) scaleX(1) scaleY(0.8); }
          33% { transform: translateX(8%) scaleX(1.15) scaleY(1.2); }
          66% { transform: translateX(-5%) scaleX(0.95) scaleY(0.9); }
          100% { transform: translateX(12%) scaleX(1.05) scaleY(1.1); }
        }
      `}</style>
    </div>
  );
}

function StarField({ intensity, focusScore, elapsed }: { intensity: number; focusScore: number; elapsed: number }) {
  // Dynamic star count: 30–80 based on focus
  const starCount = useMemo(() =>
    Math.floor(30 + (focusScore / 100) * 50), [focusScore]
  );

  const stars = useMemo(
    () =>
      Array.from({ length: starCount }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 1 + Math.random() * 2.5,
        duration: 2 + Math.random() * 4,
        delay: Math.random() * 5,
        brightness: (0.2 + Math.random() * 0.8) * intensity,
      })),
    [intensity, starCount]
  );

  const nebulae = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        id: i,
        left: `${10 + i * 25}%`,
        top: `${15 + i * 18}%`,
        size: 200 + Math.random() * 250,
        color: [
          `rgba(192,132,252,${0.07 * intensity})`,
          `rgba(99,102,241,${0.06 * intensity})`,
          `rgba(168,85,247,${0.05 * intensity})`,
          `rgba(139,92,246,${0.04 * intensity})`,
        ][i],
        duration: 18 + i * 7,
      })),
    [intensity]
  );

  // Shooting star logic
  const showShootingStar = focusScore > 80 && elapsed > 120;
  const [shootingStarKey, setShootingStarKey] = useState(0);

  useEffect(() => {
    if (!showShootingStar) return;
    const interval = setInterval(() => {
      setShootingStarKey((k) => k + 1);
    }, 15000 + Math.random() * 15000); // every 15-30s
    return () => clearInterval(interval);
  }, [showShootingStar]);

  return (
    <div className="absolute inset-0 motion-safe:block motion-reduce:hidden">
      {/* Deeper nebula clouds */}
      {nebulae.map((n) => (
        <div
          key={n.id}
          className="absolute rounded-full"
          style={{
            left: n.left,
            top: n.top,
            width: n.size,
            height: n.size,
            background: `radial-gradient(circle, ${n.color} 0%, transparent 65%)`,
            animation: `nebula-drift ${n.duration}s ease-in-out infinite alternate`,
            filter: "blur(50px)",
          }}
        />
      ))}
      {/* Stars with improved twinkle */}
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: s.brightness,
            animation: `star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            boxShadow: s.size > 2 ? `0 0 ${s.size * 3}px rgba(255,255,255,0.4)` : "none",
          }}
        />
      ))}
      {/* Shooting star */}
      {showShootingStar && shootingStarKey > 0 && (
        <ShootingStar key={shootingStarKey} />
      )}
      <style jsx>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.7); }
          50% { opacity: 0.95; transform: scale(1.3); }
        }
        @keyframes nebula-drift {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -15px) scale(1.08); }
          66% { transform: translate(-15px, 10px) scale(0.95); }
          100% { transform: translate(25px, -10px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

function ShootingStar() {
  // Random direction and position
  const startX = useMemo(() => 10 + Math.random() * 80, []);
  const startY = useMemo(() => 5 + Math.random() * 40, []);
  const angle = useMemo(() => 20 + Math.random() * 40, []); // 20-60 degrees

  return (
    <motion.div
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: 200,
        y: 120,
      }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="absolute"
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
        width: "80px",
        height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), rgba(255,255,255,0.1))",
        transform: `rotate(${angle}deg)`,
        boxShadow: "0 0 8px rgba(255,255,255,0.4), 0 0 20px rgba(192,132,252,0.3)",
        borderRadius: "1px",
      }}
    />
  );
}
