"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DURATION_MS, EASING, SPRING, STAGGER_S } from "@/design/motion";

export function MotionPlayground() {
  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();
  // Dots travel the width of their track: the wrapper moves by 100% of its own width.
  const travel = reduce ? "0%" : "100%";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setRun((r) => r + 1)}>Replay</Button>
        <p className="text-body-sm text-text-2">
          {reduce
            ? "Reduced motion is on: movement is replaced by short fades. Alerts still escalate visibly and audibly."
            : "Only transform and opacity animate. Each row uses a real token."}
        </p>
      </div>

      <div className="grid gap-3">
        {Object.entries(DURATION_MS).map(([name, ms]) => (
          <div key={name} className="flex items-center gap-4">
            <span className="tabular w-36 font-mono text-mono-sm text-text-2">
              dur-{name} {ms}ms
            </span>
            <div className="relative h-8 flex-1 overflow-hidden rounded-sm bg-surface-sunken">
              <motion.div
                key={`${name}-${run}`}
                className="absolute inset-y-1 right-8 left-1"
                initial={{ x: "0%", opacity: reduce ? 0 : 1 }}
                animate={{ x: travel, opacity: 1 }}
                transition={{ duration: ms / 1000, ease: EASING.out }}
              >
                <div className="size-6 rounded-xs bg-accent" />
              </motion.div>
            </div>
          </div>
        ))}
        {Object.entries(SPRING).map(([name, spring]) => (
          <div key={name} className="flex items-center gap-4">
            <span className="w-36 font-mono text-mono-sm text-text-2">spring.{name}</span>
            <div className="relative h-8 flex-1 overflow-hidden rounded-sm bg-surface-sunken">
              <motion.div
                key={`${name}-${run}`}
                className="absolute inset-y-1 right-8 left-1"
                initial={{ x: "0%" }}
                animate={{ x: travel }}
                transition={reduce ? { duration: 0 } : spring}
              >
                <div className="size-6 rounded-full bg-info" />
              </motion.div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 font-mono text-mono-sm text-text-2">stagger.list {STAGGER_S.list * 1000}ms (max 8 items)</p>
        <ul className="flex gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <motion.li
              key={`${i}-${run}`}
              className="h-10 flex-1 rounded-sm bg-surface-raised ring-1 ring-border"
              initial={{ opacity: 0, y: reduce ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduce ? 0 : i * STAGGER_S.list,
                duration: DURATION_MS.base / 1000,
                ease: EASING.out,
              }}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
