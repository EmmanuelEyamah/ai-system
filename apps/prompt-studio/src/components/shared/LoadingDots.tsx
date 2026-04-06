"use client";

import { motion } from "framer-motion";

export function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-emerald-400/60"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}
