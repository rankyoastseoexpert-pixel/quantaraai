import { useState, useRef, useCallback, useEffect, useMemo, lazy, Suspense } from "react";
import PageLayout from "@/components/PageLayout";
import ScienceBackground from "@/components/ScienceBackground";
import SimulationControls from "@/components/quantum-lab/SimulationControls";
import WavefunctionPlot from "@/components/quantum-lab/WavefunctionPlot";
import ExpectationPanel from "@/components/quantum-lab/ExpectationPanel";
import TimeEvolutionGraph from "@/components/quantum-lab/TimeEvolutionGraph";
import { motion } from "framer-motion";
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
  type ExpectationValues,
  type MeasurementRecord,
  type PlotPoint,
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

  // Initialize simulation
  const resetSim = useCallback(() => {
    setPlaying(false);
    cancelAnimationFrame(animRef.current);
    const sim = initSimulation(
      gridSize, -10, 10, dt,
      { type: potential, V0, width, omega, separation },
      bc, { x0, k0, sigma }
    );
    simRef.current = sim;
    const pd = getPlotData(sim);
    setPlotData(pd);
    setEv(computeExpectations(sim));
    setSimTime(0);
    setTrajectory([]);
    setHistoryBuffer([pd]);
    setMeasurements([]);
    setLastMeasurement(null);
  }, [potential, bc, V0, omega, width, separation, x0, k0, sigma, dt, gridSize]);

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

      for (let i = 0; i < stepsPerFrame; i++) {
        crankNicolsonStep(sim);
      }

      const pd = getPlotData(sim);
      const expectations = computeExpectations(sim);

      setPlotData(pd);
      setEv(expectations);
      setSimTime(sim.time);

      frameCount++;
      if (frameCount % 3 === 0) {
        setTrajectory(prev => {
          const next = [...prev, {
            t: sim.time,
            x_mean: expectations.x_mean,
            p_mean: expectations.p_mean,
            delta_x: expectations.delta_x,
            energy: expectations.energy,
            norm: expectations.norm,
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
      <div className="container px-4 py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            Quantum <span className="text-gradient">Laboratory</span>
          </h1>
          <p className="text-muted-foreground text-xs mb-6">
            Research-grade real-time Schrödinger simulation with measurement mechanics, uncertainty visualization, and 3D rendering.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Controls */}
          <div className="lg:col-span-2 order-2 lg:order-1">
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
              dt={dt} setDt={setDt}
              gridSize={gridSize} setGridSize={setGridSize}
              playing={playing}
              onTogglePlay={() => setPlaying(p => !p)}
              onReset={resetSim}
              onMeasurePos={handleMeasurePos}
              onMeasureMom={handleMeasureMom}
              show3D={show3D} setShow3D={setShow3D}
              showPhase={showPhase} setShowPhase={setShowPhase}
            />
          </div>

          {/* Center: Visualization */}
          <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
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
                  Loading 3D renderer…
                </div>
              }>
                <Wavefunction3D data={plotData} historyBuffer={historyBuffer} />
              </Suspense>
            )}

            {/* Bottom: Time evolution */}
            <TimeEvolutionGraph trajectory={trajectory} />
          </div>

          {/* Right: Expectation & Measurement */}
          <div className="lg:col-span-3 order-3">
            <ExpectationPanel
              ev={ev}
              measurements={measurements}
              education={education}
              normHistory={trajectory.map(t => t.norm)}
              energyHistory={trajectory.map(t => t.energy)}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default QuantumLab;
