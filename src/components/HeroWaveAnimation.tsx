import { motion } from "framer-motion";

const HeroWaveAnimation = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Animated sine waves */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="heroWave1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(195 100% 50%)" stopOpacity="0" />
            <stop offset="30%" stopColor="hsl(195 100% 50%)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="hsl(210 100% 56%)" stopOpacity="0.2" />
            <stop offset="70%" stopColor="hsl(195 100% 50%)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(195 100% 50%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="heroWave2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(210 100% 56%)" stopOpacity="0" />
            <stop offset="40%" stopColor="hsl(210 100% 56%)" stopOpacity="0.08" />
            <stop offset="60%" stopColor="hsl(195 100% 50%)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="hsl(210 100% 56%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Wave 1 */}
        <path stroke="url(#heroWave1)" strokeWidth="2" fill="none">
          <animate
            attributeName="d"
            dur="6s"
            repeatCount="indefinite"
            values="
              M0,300 C200,250 400,350 600,300 C800,250 1000,350 1200,300 C1400,250 1600,350 1920,300;
              M0,320 C200,370 400,270 600,320 C800,370 1000,270 1200,320 C1400,370 1600,270 1920,320;
              M0,300 C200,250 400,350 600,300 C800,250 1000,350 1200,300 C1400,250 1600,350 1920,300
            "
          />
        </path>

        {/* Wave 2 */}
        <path stroke="url(#heroWave2)" strokeWidth="1.5" fill="none">
          <animate
            attributeName="d"
            dur="8s"
            repeatCount="indefinite"
            values="
              M0,340 C300,380 500,300 800,340 C1100,380 1300,300 1920,340;
              M0,360 C300,320 500,400 800,360 C1100,320 1300,400 1920,360;
              M0,340 C300,380 500,300 800,340 C1100,380 1300,300 1920,340
            "
          />
        </path>

        {/* Wave 3 - probability density style */}
        <path stroke="url(#heroWave1)" strokeWidth="1" fill="none" opacity="0.5">
          <animate
            attributeName="d"
            dur="10s"
            repeatCount="indefinite"
            values="
              M0,280 C150,250 300,310 450,280 C600,250 750,310 900,280 C1050,250 1200,310 1350,280 C1500,250 1650,310 1920,280;
              M0,290 C150,320 300,260 450,290 C600,320 750,260 900,290 C1050,320 1200,260 1350,290 C1500,320 1650,260 1920,290;
              M0,280 C150,250 300,310 450,280 C600,250 750,310 900,280 C1050,250 1200,310 1350,280 C1500,250 1650,310 1920,280
            "
          />
        </path>
      </svg>

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/20"
          style={{
            left: `${5 + (i * 4.7) % 90}%`,
            top: `${10 + (i * 7.3) % 80}%`,
          }}
          animate={{
            y: [0, -30 - (i % 4) * 10, 0],
            x: [0, (i % 2 === 0 ? 15 : -15), 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 5 + (i % 5) * 2,
            delay: i * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Orbit rings */}
      <motion.div
        className="absolute border border-primary/[0.06] rounded-full"
        style={{ width: 400, height: 400, left: "60%", top: "20%", marginLeft: -200, marginTop: -200 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute w-2.5 h-2.5 rounded-full bg-primary/20 -top-1 left-1/2 -ml-1" />
      </motion.div>
      <motion.div
        className="absolute border border-accent/[0.04] rounded-full"
        style={{ width: 250, height: 250, left: "25%", top: "60%", marginLeft: -125, marginTop: -125 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute w-2 h-2 rounded-full bg-accent/15 -top-1 left-1/2 -ml-1" />
      </motion.div>
    </div>
  );
};

export default HeroWaveAnimation;
