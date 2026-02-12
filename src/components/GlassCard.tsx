import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

const GlassCard = ({ children, className, hover = false, glow = false, onClick }: GlassCardProps) => {
  return (
    <div
      onClick={onClick}
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
