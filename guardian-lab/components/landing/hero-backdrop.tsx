"use client";

import { m } from "motion/react";
import styles from "./hero.module.css";
import { useHeroMotion } from "./use-hero-motion";

export function HeroBackdrop() {
  const motion = useHeroMotion();
  return (
    <div ref={motion.scene} className={styles.backdrop} aria-hidden="true">
      <m.div
        className={styles.scenery}
        style={
          motion.reducedMotion ? undefined : { x: motion.x, y: motion.y, rotate: motion.rotate }
        }
      >
        <m.div
          className={styles.scenery}
          style={motion.reducedMotion ? undefined : { y: motion.scrollY }}
        >
          <div className={styles.ribbon} />
        </m.div>
      </m.div>
    </div>
  );
}
