import { useState, useRef, useCallback, useEffect, useMemo, lazy, Suspense } from "react";
import PageLayout from "@/components/PageLayout";
import ScienceBackground from "@/components/ScienceBackground";
import SimulationControls from "@/components/quantum-lab/SimulationControls";
import WavefunctionPlot from "@/components/quantum-lab/WavefunctionPlot";
import ExpectationPanel from "@/components/quantum-lab/ExpectationPanel";
import TimeEvolutionGraph from "@/components/quantum-lab/TimeEvolutionGraph";
import EnsemblePanel from "@/components/quantum-lab/EnsemblePanel";
import { motion } from "framer-motion";
import { Atom, FlaskConical, Sigma } from "lucide-react";
import {
  initSimulation,
  crankNicolsonStep,
  computeExpectations,
  measurePosition,
  measureMomentum,
  getPlotData,
  getEducationalContent,
  type SimState,
  type PotentialType,
  type BoundaryCondition,
  type InitialStateType,
  type ExpectationValues,
  type MeasurementRecord,
  type PlotPoint,
  type SecondPacketParams,
} from "@/lib/quantumSimulator";

const Wavefunction3D = lazy(() => import("@/components/quantum-lab/Wavefunction3D"));

interface TrajectoryPoint {
  t: number;
  x_mean: number;
  p_mean: number;
  delta_x: number;
  energy: number;
  norm: number;
}

const QuantumLab = () => {
  // Potential params
  const [potential, setPotential] = useState<PotentialType>("harmonic");
  const [bc, setBc] = useState<BoundaryCondition>("absorbing");
  const [V0, setV0] = useState(5);
  const [omega, setOmega] = useState(1);
  const [width, setWidth] = useState(2);
  const [separation, setSeparation] = useState(2);

  // Wave packet params
  const [x0, setX0] = useState(-2);
  const [k0, setK0] = useState(5);
  const [sigma, setSigma] = useState(0.5);
  const [initialState, setInitialState] = useState<InitialStateType>("gaussian");

  // Interference mode
  const [interferenceEnabled, setInterferenceEnabled] = useState(false);
  const [x02, setX02] = useState(2);
  const [k02, setK02] = useState(-5);
  const [sigma2, setSigma2] = useState(0.5);

  // Solver
  const [dt, setDt] = useState(0.005);
  const [gridSize, setGridSize] = useState(256);

  // View
  const [show3D, setShow3D] = useState(false);
  const [showPhase, setShowPhase] = useState(true);
  const [playing, setPlaying] = useState(false);

  // State refs
  const simRef = useRef<SimState | null>(null);
  const animRef = useRef<number>(0);
  const [plotData, setPlotData] = useState<PlotPoint[]>([]);
  const [ev, setEv] = useState<ExpectationValues | null>(null);
  const [simTime, setSimTime] = useState(0);
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [historyBuffer, setHistoryBuffer] = useState<PlotPoint[][]>([]);
  const [lastMeasurement, setLastMeasurement] = useState<{ x: number; type: string } | null>(null);

  // Create a fresh sim (used by ensemble panel too)
  const createSim = useCallback(() => {
    const secondPkt: SecondPacketParams | undefined = interferenceEnabled
      ? { enabled: true, x0: x02, k0: k02, sigma: sigma2 }
      : undefined;
    return initSimulation(
      gridSize, -10, 10, dt,
      { type: potential, V0, width, omega, separation },
      bc, { type: initialState, x0, k0, sigma },
      secondPkt
    );
  }, [potential, bc, V0, omega, width, separation, x0, k0, sigma, dt, gridSize, initialState, interferenceEnabled, x02, k02, sigma2]);

  // Initialize simulation
  const resetSim = useCallback(() => {
    setPlaying(false);
    cancelAnimationFrame(animRef.current);
    const sim = createSim();
    simRef.current = sim;
    const pd = getPlotData(sim);
    setPlotData(pd);
    setEv(computeExpectations(sim));
    setSimTime(0);
    setTrajectory([]);
    setHistoryBuffer([pd]);
    setMeasurements([]);
    setLastMeasurement(null);
  }, [createSim]);

  // Init on mount and param change
  useEffect(() => { resetSim(); }, [resetSim]);

  // Animation loop
  useEffect(() => {
    if (!playing) return;
    const stepsPerFrame = 3;
    let frameCount = 0;
    const animate = () => {
      const sim = simRef.current;
      if (!sim) return;
      for (let i = 0; i < stepsPerFrame; i++) crankNicolsonStep(sim);
      const pd = getPlotData(sim);
      const expectations = computeExpectations(sim);
      setPlotData(pd);
      setEv(expectations);
      setSimTime(sim.time);
      frameCount++;
      if (frameCount % 3 === 0) {
        setTrajectory(prev => {
          const next = [...prev, {
            t: sim.time, x_mean: expectations.x_mean, p_mean: expectations.p_mean,
            delta_x: expectations.delta_x, energy: expectations.energy, norm: expectations.norm,
          }];
          return next.length > 500 ? next.slice(-500) : next;
        });
      }
      if (frameCount % 5 === 0) {
        setHistoryBuffer(prev => {
          const next = [...prev, pd];
          return next.length > 80 ? next.slice(-80) : next;
        });
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing]);

  // Measurement handlers
  const handleMeasurePos = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;
    const x = measurePosition(sim);
    setMeasurements(prev => [...prev, { time: sim.time, position: x, type: "position" }]);
    setLastMeasurement({ x, type: "position" });
    setPlotData(getPlotData(sim));
    setEv(computeExpectations(sim));
  }, []);

  const handleMeasureMom = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;
    const p = measureMomentum(sim);
    setMeasurements(prev => [...prev, { time: sim.time, position: p, type: "momentum" }]);
    setLastMeasurement({ x: 0, type: "momentum" });
    setPlotData(getPlotData(sim));
    setEv(computeExpectations(sim));
  }, []);

  const education = useMemo(() => getEducationalContent(potential, bc), [potential, bc]);

  return (
    <PageLayout>
      <ScienceBackground />
      <div className="container px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.15)]">
              <Atom size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Quantum <span className="text-gradient">Laboratory</span>
              </h1>
              <p className="text-muted-foreground text-xs">
                Real-time Schrödinger simulation · Crank-Nicolson solver · Measurement mechanics
              </p>
            </div>
          </div>
          {/* Status pills */}
          <div className="flex gap-2 mt-3">
            <div className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium">
              <FlaskConical size={10} />
              {potential.replace("_", " ")}
            </div>
            <div className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-secondary border border-border text-muted-foreground">
              <Sigma size={10} />
              N = {gridSize}
            </div>
            {playing && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Evolving
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 order-2 lg:order-1 space-y-4"
          >
            <SimulationControls
              potential={potential} setPotential={setPotential}
              bc={bc} setBc={setBc}
              V0={V0} setV0={setV0}
              omega={omega} setOmega={setOmega}
              width={width} setWidth={setWidth}
              separation={separation} setSeparation={setSeparation}
              x0={x0} setX0={setX0}
              k0={k0} setK0={setK0}
              sigma={sigma} setSigma={setSigma}
              initialState={initialState} setInitialState={setInitialState}
              dt={dt} setDt={setDt}
              gridSize={gridSize} setGridSize={setGridSize}
              playing={playing}
              onTogglePlay={() => setPlaying(p => !p)}
              onReset={resetSim}
              onMeasurePos={handleMeasurePos}
              onMeasureMom={handleMeasureMom}
              show3D={show3D} setShow3D={setShow3D}
              showPhase={showPhase} setShowPhase={setShowPhase}
              interferenceEnabled={interferenceEnabled} setInterferenceEnabled={setInterferenceEnabled}
              x02={x02} setX02={setX02}
              k02={k02} setK02={setK02}
              sigma2={sigma2} setSigma2={setSigma2}
            />
          </motion.div>

          {/* Center: Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-7 space-y-4 order-1 lg:order-2"
          >
            <WavefunctionPlot
              data={plotData}
              ev={ev}
              showPhase={showPhase}
              time={simTime}
              lastMeasurement={lastMeasurement}
            />

            {show3D && (
              <Suspense fallback={
                <div className="glass-card p-4 h-[300px] flex items-center justify-center text-xs text-muted-foreground">
                  <Atom size={16} className="animate-spin mr-2 text-primary" />
                  Loading 3D renderer…
                </div>
              }>
                <Wavefunction3D data={plotData} historyBuffer={historyBuffer} />
              </Suspense>
            )}

            <TimeEvolutionGraph trajectory={trajectory} />
          </motion.div>

          {/* Right: Expectation, Ensemble & Measurement */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3 order-3 space-y-4"
          >
            <ExpectationPanel
              ev={ev}
              measurements={measurements}
              education={education}
              normHistory={trajectory.map(t => t.norm)}
              energyHistory={trajectory.map(t => t.energy)}
            />

            <EnsemblePanel
              simState={simRef}
              initSim={createSim}
            />
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
};

export default QuantumLab;
