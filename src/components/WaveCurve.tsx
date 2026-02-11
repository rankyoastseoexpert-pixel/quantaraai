const WaveCurve = () => (
  <svg
    className="absolute bottom-0 left-0 right-0 w-full opacity-10 pointer-events-none"
    viewBox="0 0 1440 200"
    preserveAspectRatio="none"
    style={{ height: "200px" }}
  >
    <defs>
      <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="hsl(210 100% 55%)" stopOpacity="0" />
        <stop offset="50%" stopColor="hsl(210 100% 55%)" stopOpacity="1" />
        <stop offset="100%" stopColor="hsl(200 100% 60%)" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path
      d="M0,120 C240,180 480,60 720,120 C960,180 1200,60 1440,120 L1440,200 L0,200 Z"
      fill="url(#waveGrad)"
      opacity="0.3"
    >
      <animate
        attributeName="d"
        dur="8s"
        repeatCount="indefinite"
        values="
          M0,120 C240,180 480,60 720,120 C960,180 1200,60 1440,120 L1440,200 L0,200 Z;
          M0,100 C240,60 480,180 720,100 C960,60 1200,180 1440,100 L1440,200 L0,200 Z;
          M0,120 C240,180 480,60 720,120 C960,180 1200,60 1440,120 L1440,200 L0,200 Z
        "
      />
    </path>
    <path
      d="M0,140 C360,100 720,180 1080,140 C1260,120 1380,160 1440,140 L1440,200 L0,200 Z"
      fill="url(#waveGrad)"
      opacity="0.15"
    >
      <animate
        attributeName="d"
        dur="10s"
        repeatCount="indefinite"
        values="
          M0,140 C360,100 720,180 1080,140 C1260,120 1380,160 1440,140 L1440,200 L0,200 Z;
          M0,160 C360,180 720,100 1080,160 C1260,180 1380,120 1440,160 L1440,200 L0,200 Z;
          M0,140 C360,100 720,180 1080,140 C1260,120 1380,160 1440,140 L1440,200 L0,200 Z
        "
      />
    </path>
  </svg>
);

export default WaveCurve;
