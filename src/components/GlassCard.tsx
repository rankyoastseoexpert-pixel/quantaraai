import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

const GlassCard = ({ children, className, hover = false, glow = false }: GlassCardProps) => {
  return (
    <div
      className={cn(
        hover ? "glass-card-hover" : "glass-card",
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
