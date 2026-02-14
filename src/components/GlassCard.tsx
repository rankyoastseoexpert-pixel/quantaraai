import { cn } from "@/lib/utils";
import { ReactNode, useRef, useState } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  tilt?: boolean;
  onClick?: () => void;
}

const GlassCard = ({ children, className, hover = false, glow = false, tilt = false, onClick }: GlassCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({ rotateX: 0, rotateY: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hover && !tilt) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTiltStyle({
      rotateX: (0.5 - y) * 12,
      rotateY: (x - 0.5) * 12,
    });
    setGlowPos({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setTiltStyle({ rotateX: 0, rotateY: 0 });
    setGlowPos({ x: 50, y: 50 });
  };

  if (hover || tilt) {
    return (
      <motion.div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={tiltStyle}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ perspective: 800, transformStyle: "preserve-3d" }}
        className={cn(
          "glass-card-hover relative overflow-hidden p-6",
          glow && "glow-border",
          className
        )}
      >
        {/* Dynamic glow that follows cursor */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, hsl(var(--primary) / 0.12) 0%, transparent 60%)`,
          }}
        />
        {children}
      </motion.div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card",
        glow && "glow-border",
        "p-6",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
