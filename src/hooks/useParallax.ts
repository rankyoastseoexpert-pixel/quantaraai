import { useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef, RefObject } from "react";

export function useParallax(offset = 50): [RefObject<HTMLDivElement>, MotionValue<number>] {
  const ref = useRef<HTMLDivElement>(null!);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  return [ref, y];
}

export function useSectionReveal() {
  return {
    initial: { opacity: 0, y: 60 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.7, ease: "easeOut" as const },
  };
}
