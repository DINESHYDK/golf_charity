// ─── ANIMATED COUNTER ─────────────────────────
// Counts up from 0 to a target number when it enters the viewport
// Used in the Hero section and dashboard stat cards

"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface AnimatedCounterProps {
  target: number;
  duration?: number;       // Duration in ms — default 2000
  prefix?: string;         // E.g., "£"
  suffix?: string;         // E.g., "+" or "%"
  className?: string;
}

export default function AnimatedCounter({
  target,
  duration = 2000,
  prefix = "",
  suffix = "",
  className,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    // ─── EASING COUNT-UP ──────────────────────
    // Uses easeOutQuart for snappy feel at start, smooth deceleration
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutQuart easing function
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
