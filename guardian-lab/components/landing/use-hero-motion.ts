"use client";

import { useInView, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { useLandingReducedMotion } from "./landing-motion";

export function useHeroMotion() {
  const scene = useRef<HTMLDivElement>(null);
  const visible = useInView(scene, { margin: "100px" });
  const reducedMotion = useLandingReducedMotion();
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const spring = { stiffness: 90, damping: 24, mass: 0.7 };
  const x = useSpring(cursorX, spring);
  const y = useSpring(cursorY, spring);
  const rotate = useTransform(x, [-8, 8], [-0.6, 0.6]);
  const { scrollYProgress } = useScroll({ target: scene, offset: ["start start", "end start"] });
  const scrollTarget = useTransform(scrollYProgress, [0, 1], [0, reducedMotion ? 0 : 24]);
  const scrollY = useSpring(scrollTarget, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    const surface = element.closest<HTMLElement>("[data-hero-stage]") ?? element;
    const media = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 768px)");
    const reset = () => {
      cursorX.set(0);
      cursorY.set(0);
    };
    const move = (event: PointerEvent) => {
      if (!media.matches || reducedMotion || !visible || event.pointerType === "touch") return;
      const bounds = surface.getBoundingClientRect();
      cursorX.set(
        Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1)) * 8,
      );
      cursorY.set(
        Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1)) * 6,
      );
    };
    if (!reducedMotion && visible) surface.addEventListener("pointermove", move, { passive: true });
    surface.addEventListener("pointerleave", reset);
    media.addEventListener("change", reset);
    reset();
    return () => {
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", reset);
      media.removeEventListener("change", reset);
      reset();
    };
  }, [cursorX, cursorY, reducedMotion, visible]);

  return { scene, x, y, rotate, scrollY, reducedMotion };
}
