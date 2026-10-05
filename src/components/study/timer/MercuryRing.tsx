"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Theme } from "./themes";

interface MercuryRingProps {
  progress: number; // 0 to 1
  theme: Theme;
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  size?: number;
  secondsLeft?: number;
  focusScore?: number; // 0–100 — drives reactive glow
  elapsed?: number; // seconds since start — drives minute-mark shockwaves
  pauseStreak?: number; // consecutive seconds without pause — drives flow state
  breathValue?: number; // 0–1 breathing cycle value
  milestone?: number | null; // active milestone (minutes), triggers glow boost
  transitionType?: "start" | "pause" | "resume" | null; // state transition animation
}

// Orbiting particle type
interface OrbitParticle {
  angle: number; // current angle in radians
  speed: number; // radians per second
  trailAngles: number[]; // previous positions for trail
}

export function MercuryRing({
  progress,
  theme,
  isRunning,
  isPaused,
  isComplete,
  size = 300,
  secondsLeft = 999,
  focusScore = 100,
  elapsed = 0,
  pauseStreak = 0,
  breathValue = 0,
  milestone = null,
  transitionType = null,
}: MercuryRingProps) {
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const rafRef = useRef<number>(0);
  const seedRef = useRef(0);
  const [showShockwave, setShowShockwave] = useState(false);
  const [minuteRipple, setMinuteRipple] = useState(0);
  const prevMinuteRef = useRef(0);

  // Orbiting particles state
  const particleRafRef = useRef<number>(0);
  const particleTimeRef = useRef(0);
  const [particles, setParticles] = useState<OrbitParticle[]>([]);

  // Milestone glow boost
  const [milestoneGlow, setMilestoneGlow] = useState(false);

  // Trigger shockwave on completion
  useEffect(() => {
    if (isComplete) {
      setShowShockwave(true);
      const t = setTimeout(() => setShowShockwave(false), 1400);
      return () => clearTimeout(t);
    }
  }, [isComplete]);

  // Milestone glow boost
  useEffect(() => {
    if (milestone !== null) {
      setMilestoneGlow(true);
      const t = setTimeout(() => setMilestoneGlow(false), 1000);
      return () => clearTimeout(t);
    }
  }, [milestone]);

  // Minute-mark shockwave ripples
  useEffect(() => {
    if (!isRunning || elapsed < 10) return;
    const currentMinute = Math.floor(elapsed / 60);
    if (currentMinute > prevMinuteRef.current && currentMinute > 0) {
      setMinuteRipple((r) => r + 1);
      prevMinuteRef.current = currentMinute;
    }
  }, [elapsed, isRunning]);

  // Reset minute counter on timer reset
  useEffect(() => {
    if (elapsed === 0) prevMinuteRef.current = 0;
  }, [elapsed]);

  // Animate turbulence seed for liquid motion — GPU friendly via rAF
  useEffect(() => {
    let lastTime = 0;
    const interval = isRunning ? 60 : 120;

    const animate = (time: number) => {
      if (time - lastTime >= interval) {
        // Slower seed when paused specifically
        const increment = isRunning ? 0.3 : isPaused ? 0.01 : 0.05;
        seedRef.current += increment;
        if (turbulenceRef.current) {
          turbulenceRef.current.setAttribute(
            "seed",
            String(Math.floor(seedRef.current))
          );
        }
        lastTime = time;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, isPaused]);

  // Orbiting particles rAF loop
  const particleCount = useMemo(() => {
    if (!isRunning && !isPaused) return 0;
    if (focusScore >= 90) return 6;
    if (focusScore >= 70) return 5;
    if (focusScore >= 50) return 4;
    if (focusScore >= 30) return 3;
    return 2;
  }, [isRunning, isPaused, focusScore]);

  const particleSpeed = useMemo(() => {
    // Base speed in radians per second
    const base = 0.4;
    const focusBoost = (focusScore / 100) * 0.8;
    return base + focusBoost;
  }, [focusScore]);

  // Initialize particles when count changes
  useEffect(() => {
    if (particleCount === 0) {
      setParticles([]);
      return;
    }
    setParticles((prev) => {
      if (prev.length === particleCount) return prev;
      return Array.from({ length: particleCount }, (_, i) => ({
        angle: prev[i]?.angle ?? ((i / particleCount) * Math.PI * 2) + (-Math.PI / 2),
        speed: particleSpeed * (0.8 + Math.random() * 0.4),
        trailAngles: prev[i]?.trailAngles ?? [],
      }));
    });
  }, [particleCount, particleSpeed]);

  // Animate orbiting particles
  useEffect(() => {
    if (particleCount === 0) return;
    let lastFrame = performance.now();

    const animate = (now: number) => {
      const delta = (now - lastFrame) / 1000;
      lastFrame = now;

      // When paused, slow particles to near stop
      const speedMultiplier = isPaused ? 0.05 : 1;

      setParticles((prev) =>
        prev.map((p) => {
          const newAngle = p.angle + p.speed * delta * speedMultiplier;
          // Keep trail of last 4 positions
          const trailAngles = [p.angle, ...p.trailAngles].slice(0, 4);
          return { ...p, angle: newAngle, trailAngles };
        })
      );

      particleRafRef.current = requestAnimationFrame(animate);
    };

    particleRafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(particleRafRef.current);
  }, [particleCount, isPaused]);

  const center = size / 2;
  const strokeWidth = 10;
  const radius = center - strokeWidth - 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Endpoint dot position
  const angle = -90 + progress * 360;
  const angleRad = (angle * Math.PI) / 180;
  const dotX = center + radius * Math.cos(angleRad);
  const dotY = center + radius * Math.sin(angleRad);

  // Focus-reactive glow intensity (0.0 – 1.0)
  const glowIntensity = useMemo(() => {
    if (!isRunning && !isPaused) return 0.3;
    const scoreBase = Math.max(0.2, focusScore / 100);
    const streakBoost = Math.min(0.2, (pauseStreak / 60) * 0.05);
    const completionBoost = progress > 0.8 ? (progress - 0.8) * 2.5 : 0;
    const urgentSurge = secondsLeft <= 10 && secondsLeft > 0 ? 0.3 : 0;
    const milestoneBoost = milestoneGlow ? 0.3 : 0;
    // Breathing modulation (±0.08)
    const breathMod = breathValue * 0.08;
    return Math.min(1, scoreBase + streakBoost + completionBoost + urgentSurge + milestoneBoost + breathMod);
  }, [isRunning, isPaused, focusScore, pauseStreak, progress, secondsLeft, milestoneGlow, breathValue]);

  // Displacement varies with state + focus score
  const displacementScale = useMemo(() => {
    if (isComplete) return 4;
    if (isRunning) return 2 + (glowIntensity * 2);
    if (isPaused) return 1.5;
    return 1;
  }, [isRunning, isPaused, isComplete, glowIntensity]);

  // Last 10 seconds pulsing
  const isUrgent = secondsLeft <= 10 && secondsLeft > 0 && isRunning;

  // Flow state: 3+ minutes unpaused while running
  const isFlowState = isRunning && pauseStreak >= 180 && elapsed > 60;

  const isMercury = theme.id === "mercury";
  const isMinimal = theme.id === "minimal";
  const gradId = `ring-grad-${theme.id}`;
  const filterId = `mercury-distort-${theme.id}`;
  const glowId = `ring-glow-${theme.id}`;
  const auraId = `ring-aura-${theme.id}`;
  const flowGradId = `flow-grad-${theme.id}`;

  // Gradient animation speed — near-freeze when paused
  const gradientDur = isPaused ? "30s" : isRunning ? `${Math.max(2, 5 - glowIntensity * 3)}s` : "6s";

  // Breathing-modulated aura scale
  const auraScale = isRunning
    ? 1.2 + glowIntensity * 0.15 + (breathValue * 0.03)
    : isPaused ? 1.1 : 1.15;

  // Progress arc bounds for particles (in radians)
  const arcStart = -Math.PI / 2; // -90 degrees = top
  const arcEnd = arcStart + progress * Math.PI * 2;

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 18 }}
      className="relative"
      style={{ width: size, height: size }}
    >
      {/* Outer aura glow — breathing modulated */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          opacity: isRunning ? 0.4 + glowIntensity * 0.5 : isPaused ? 0.15 : 0.2,
          scale: auraScale,
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          background: `radial-gradient(circle, ${theme.auraColor} 40%, transparent 70%)`,
        }}
      />

      {/* Flow state outer ring — golden shimmer when in flow */}
      <AnimatePresence>
        {isFlowState && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: 1,
            }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 0.5 },
            }}
            className="absolute inset-[-6px] rounded-full"
            style={{
              border: `1.5px solid rgba(250, 204, 21, 0.4)`,
              boxShadow: `0 0 20px rgba(250, 204, 21, 0.15), inset 0 0 20px rgba(250, 204, 21, 0.05)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Shockwave on completion */}
      <AnimatePresence>
        {showShockwave && (
          <>
            {/* Triple shockwave rings (staggered) */}
            {[0, 0.15, 0.3].map((delay, i) => (
              <motion.div
                key={`shockwave-${i}`}
                initial={{ scale: 0.8, opacity: 0.9 - i * 0.2 }}
                animate={{ scale: 2.4 - i * 0.3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, delay, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 rounded-full"
                style={{
                  border: `${2 - i * 0.5}px solid ${theme.ringColor}`,
                  boxShadow: i === 0 ? `0 0 60px ${theme.glowColor}` : "none",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* State transition: START wave */}
      <AnimatePresence>
        {transitionType === "start" && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0.7 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${theme.glowColor} 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* State transition: RESUME pulse */}
      <AnimatePresence>
        {transitionType === "resume" && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1.3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 rounded-full"
            style={{
              border: `2px solid ${theme.ringColor}`,
              boxShadow: `0 0 40px ${theme.glowColor}`,
            }}
          />
        )}
      </AnimatePresence>

      {/* State transition: PAUSE frost overlay */}
      <AnimatePresence>
        {transitionType === "pause" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0.15, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-[-2px] rounded-full"
            style={{
              background: isMinimal
                ? "radial-gradient(circle, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.02) 100%)"
                : "radial-gradient(circle, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(1px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Minute-mark ripple */}
      <AnimatePresence>
        {minuteRipple > 0 && (
          <motion.div
            key={minuteRipple}
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 rounded-full"
            style={{
              border: `1px solid ${theme.ringColor}`,
              boxShadow: `0 0 20px ${theme.glowColor}`,
            }}
          />
        )}
      </AnimatePresence>

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          {/* Chrome/liquid gradient for ring stroke — speed reacts to focus */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.ringGradient[0]}>
              <animate
                attributeName="stop-color"
                values={`${theme.ringGradient[0]};${theme.ringGradient[1]};${theme.ringGradient[2]};${theme.ringGradient[0]}`}
                dur={gradientDur}
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor={theme.ringGradient[1]}>
              <animate
                attributeName="stop-color"
                values={`${theme.ringGradient[1]};${theme.ringGradient[2]};${theme.ringGradient[3]};${theme.ringGradient[1]}`}
                dur={gradientDur}
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={theme.ringGradient[2]}>
              <animate
                attributeName="stop-color"
                values={`${theme.ringGradient[2]};${theme.ringGradient[3]};${theme.ringGradient[0]};${theme.ringGradient[2]}`}
                dur={gradientDur}
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>

          {/* Flow state golden gradient overlay */}
          <linearGradient id={flowGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#facc15" stopOpacity="0.6">
              <animate
                attributeName="stop-color"
                values="#facc15;#fbbf24;#f59e0b;#facc15"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.4">
              <animate
                attributeName="stop-color"
                values="#fbbf24;#f59e0b;#facc15;#fbbf24"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>

          {/* Turbulence displacement — liquid morphing */}
          <filter
            id={filterId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              ref={turbulenceRef}
              type="fractalNoise"
              baseFrequency={isMercury ? "0.006" : "0.008"}
              numOctaves={2}
              seed={0}
              result="turbulence"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale={displacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Soft bloom glow — breathing-modulated radius */}
          <filter id={glowId}>
            <feGaussianBlur stdDeviation={6 + glowIntensity * 6 + breathValue * 1} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Outer aura SVG filter */}
          <filter id={auraId}>
            <feGaussianBlur stdDeviation="16" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
            </feMerge>
          </filter>

          {/* Orbiting particle glow */}
          <filter id={`particle-glow-${theme.id}`}>
            <feGaussianBlur stdDeviation={3 + glowIntensity * 2} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* L1: Subtle outer aura ring */}
        <circle
          cx={center}
          cy={center}
          r={radius + 6}
          fill="none"
          stroke={theme.ringColor}
          strokeWidth={2}
          strokeDasharray={circumference * 1.04}
          strokeDashoffset={circumference * 1.04 * (1 - progress)}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          filter={`url(#${auraId})`}
          opacity={isRunning ? 0.15 + glowIntensity * 0.25 : isPaused ? 0.08 : 0.12}
          style={{ transition: "stroke-dashoffset 1s ease, opacity 1.5s ease" }}
        />

        {/* L2: Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={isMinimal ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)"}
          strokeWidth={strokeWidth}
        />

        {/* L3: Inner subtle track */}
        <circle
          cx={center}
          cy={center}
          r={radius - 14}
          fill="none"
          stroke={isMinimal ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)"}
          strokeWidth={1}
        />

        {/* L4: Glow duplicate behind progress — intensity driven by focus */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={theme.ringColor}
          strokeWidth={strokeWidth + 4 + (glowIntensity * 4)}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          filter={`url(#${glowId})`}
          opacity={isComplete ? 0.7 : isRunning ? 0.2 + glowIntensity * 0.35 : isPaused ? 0.1 : 0.15}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease",
          }}
        />

        {/* L5: Primary progress ring — liquid distortion */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          filter={`url(#${filterId})`}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />

        {/* L5b: Flow state golden overlay ring */}
        {isFlowState && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${flowGradId})`}
            strokeWidth={strokeWidth - 2}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            opacity={0.3}
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
              mixBlendMode: "overlay",
            }}
          />
        )}

        {/* L5c: Orbiting particles on progress arc */}
        {particles.map((p, i) => {
          // Clamp particle angle to the progress arc
          const arcLen = progress * Math.PI * 2;
          if (arcLen < 0.05) return null; // no arc to show

          const normalizedAngle = ((p.angle - arcStart) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          const clampedOffset = normalizedAngle % (arcLen || 0.01);
          const displayAngle = arcStart + clampedOffset;

          const px = center + radius * Math.cos(displayAngle);
          const py = center + radius * Math.sin(displayAngle);

          const isFlow = isFlowState;
          const particleColor = isFlow ? "#facc15" : theme.ringGradient[i % 4];
          const particleSize = 2.5 + glowIntensity * 2;

          return (
            <g key={`orbit-${i}`}>
              {/* Trail afterimages */}
              {p.trailAngles.map((ta, ti) => {
                const trailOffset = ((ta - arcStart) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                const trailAngle = arcStart + (trailOffset % (arcLen || 0.01));
                const tx = center + radius * Math.cos(trailAngle);
                const ty = center + radius * Math.sin(trailAngle);
                const trailOpacity = (0.4 - ti * 0.1) * glowIntensity;
                return (
                  <circle
                    key={`trail-${i}-${ti}`}
                    cx={tx}
                    cy={ty}
                    r={particleSize * (1 - ti * 0.15)}
                    fill={particleColor}
                    opacity={Math.max(0, trailOpacity)}
                    style={{ willChange: "transform" }}
                  />
                );
              })}
              {/* Main particle with glow */}
              <circle
                cx={px}
                cy={py}
                r={particleSize}
                fill={particleColor}
                filter={`url(#particle-glow-${theme.id})`}
                opacity={0.7 + glowIntensity * 0.3}
                style={{ willChange: "transform" }}
              />
              <circle
                cx={px}
                cy={py}
                r={particleSize * 0.5}
                fill="#ffffff"
                opacity={0.9}
                style={{ willChange: "transform" }}
              />
            </g>
          );
        })}

        {/* L6: Endpoint dot with glow — size reacts to focus */}
        {progress > 0.01 && progress < 0.995 && (
          <g>
            <circle
              cx={dotX}
              cy={dotY}
              r={5 + glowIntensity * 4}
              fill={theme.ringColor}
              filter={`url(#${glowId})`}
              opacity={0.5 + glowIntensity * 0.2}
              style={{ transition: "cx 1s ease, cy 1s ease" }}
            />
            <circle
              cx={dotX}
              cy={dotY}
              r={4 + glowIntensity * 2}
              fill="#ffffff"
              opacity={0.9}
              style={{ transition: "cx 1s ease, cy 1s ease" }}
            />
          </g>
        )}
      </svg>

      {/* Urgent pulse overlay — last 10 seconds */}
      {isUrgent && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              `0 0 25px ${theme.glowColor}, inset 0 0 25px ${theme.auraColor}`,
              `0 0 50px ${theme.glowColor}, inset 0 0 50px ${theme.auraColor}`,
              `0 0 25px ${theme.glowColor}, inset 0 0 25px ${theme.auraColor}`,
            ],
          }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Flow State badge */}
      <AnimatePresence>
        {isFlowState && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              bottom: -4,
              background: "rgba(250, 204, 21, 0.12)",
              border: "1px solid rgba(250, 204, 21, 0.25)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-yellow-400"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-yellow-300">
              Flow State
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
