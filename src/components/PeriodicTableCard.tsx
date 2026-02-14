import { motion } from "framer-motion";

interface PeriodicTableCardProps {
  className?: string;
  opacity?: number;
  delay?: number;
  size?: "sm" | "md";
}

const elements = [
  { symbol: "H", z: 1 },
  { symbol: "He", z: 2 },
  { symbol: "Li", z: 3 },
  { symbol: "Be", z: 4 },
  { symbol: "B", z: 5 },
  { symbol: "C", z: 6 },
  { symbol: "N", z: 7 },
  { symbol: "O", z: 8 },
  { symbol: "F", z: 9 },
  { symbol: "Ne", z: 10 },
];

const PeriodicTableCard = ({
  className = "absolute left-[3%] top-[18%]",
  opacity = 0.05,
  delay = 0,
  size = "md",
}: PeriodicTableCardProps) => {
  const cellSize = size === "sm" ? 16 : 22;
  const cols = 5;
  const gap = size === "sm" ? 2 : 3;
  const padding = 8;
  const w = cols * cellSize + (cols - 1) * gap + padding * 2;
  const rows = Math.ceil(elements.length / cols);
  const h = rows * cellSize + (rows - 1) * gap + padding * 2 + 14;

  return (
    <motion.div
      className={`pointer-events-none z-0 hidden md:block ${className}`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay + 0.8, duration: 1.2, type: "spring" }}
      style={{ opacity }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Title */}
        <text
          x={w / 2}
          y={10}
          textAnchor="middle"
          fill="hsl(var(--primary))"
          fontSize={6}
          fontFamily="'JetBrains Mono', monospace"
          opacity={0.7}
        >
          PERIODIC TABLE
        </text>

        {elements.map((el, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = padding + col * (cellSize + gap);
          const y = 14 + padding + row * (cellSize + gap);
          return (
            <g key={el.symbol}>
              <motion.rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={0.5}
                opacity={0.5}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, delay: i * 0.2, repeat: Infinity }}
              />
              <text
                x={x + cellSize / 2}
                y={y + 5}
                textAnchor="middle"
                fill="hsl(var(--primary))"
                fontSize={4}
                fontFamily="'JetBrains Mono', monospace"
                opacity={0.5}
              >
                {el.z}
              </text>
              <text
                x={x + cellSize / 2}
                y={y + cellSize - 4}
                textAnchor="middle"
                fill="hsl(var(--primary))"
                fontSize={size === "sm" ? 6 : 8}
                fontWeight="bold"
                fontFamily="'JetBrains Mono', monospace"
                opacity={0.7}
              >
                {el.symbol}
              </text>
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
};

export default PeriodicTableCard;
