import { useState, useRef, useCallback, useEffect, useMemo, lazy, Suspense } from "react";
import SEOHead from "@/components/SEOHead";
import PageLayout from "@/components/PageLayout";
import ScienceBackground from "@/components/ScienceBackground";
import SimulationControls from "@/components/quantum-lab/SimulationControls";
import WavefunctionPlot from "@/components/quantum-lab/WavefunctionPlot";
import ExpectationPanel from "@/components/quantum-lab/ExpectationPanel";
import TimeEvolutionGraph from "@/components/quantum-lab/TimeEvolutionGraph";
import EnsemblePanel from "@/components/quantum-lab/EnsemblePanel";
import EnergySpectrumPanel from "@/components/quantum-lab/EnergySpectrumPanel";
import { motion } from "framer-motion";
import { Atom, FlaskConical, Sigma, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";
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

  const handleExportXLSX = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Wavefunction data
    const wfData = plotData.map(p => ({
      "x": p.x,
      "Re(ψ)": p.psi_re,
      "Im(ψ)": p.psi_im,
      "|ψ|²": p.prob,
      "Phase (rad)": p.phase,
      "V(x)": p.potential,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wfData), "Wavefunction");

    // Sheet 2: Expectation values
    if (ev) {
      const evData = [
        { Parameter: "⟨x⟩", Value: ev.x_mean, Unit: "" },
        { Parameter: "⟨p⟩", Value: ev.p_mean, Unit: "ℏ/a₀" },
        { Parameter: "⟨x²⟩", Value: ev.x2_mean, Unit: "" },
        { Parameter: "⟨p²⟩", Value: ev.p2_mean, Unit: "" },
        { Parameter: "Δx", Value: ev.delta_x, Unit: "" },
        { Parameter: "Δp", Value: ev.delta_p, Unit: "" },
        { Parameter: "ΔxΔp", Value: ev.heisenberg, Unit: "ℏ" },
        { Parameter: "⟨E⟩", Value: ev.energy, Unit: "ℏω" },
        { Parameter: "‖ψ‖²", Value: ev.norm, Unit: "" },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(evData), "Expectation Values");
    }

    // Sheet 3: Time evolution trajectory
    if (trajectory.length > 0) {
      const trajData = trajectory.map(t => ({
        "t": t.t,
        "⟨x⟩": t.x_mean,
        "⟨p⟩": t.p_mean,
        "Δx": t.delta_x,
        "⟨E⟩": t.energy,
        "‖ψ‖²": t.norm,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trajData), "Time Evolution");
    }

    // Sheet 4: Measurement history
    if (measurements.length > 0) {
      const measData = measurements.map(m => ({
        "Time": m.time,
        "Type": m.type,
        "Value": m.position,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(measData), "Measurements");
    }

    // Sheet 5: Simulation parameters
    const params = [
      { Parameter: "Potential", Value: potential },
      { Parameter: "Boundary Condition", Value: bc },
      { Parameter: "V₀", Value: V0 },
      { Parameter: "ω", Value: omega },
      { Parameter: "Width", Value: width },
      { Parameter: "Separation", Value: separation },
      { Parameter: "x₀", Value: x0 },
      { Parameter: "k₀", Value: k0 },
      { Parameter: "σ", Value: sigma },
      { Parameter: "Initial State", Value: initialState },
      { Parameter: "Δt", Value: dt },
      { Parameter: "Grid Points", Value: gridSize },
      { Parameter: "Simulation Time", Value: simTime },
      { Parameter: "Interference Mode", Value: interferenceEnabled ? "Enabled" : "Disabled" },
      ...(interferenceEnabled ? [
        { Parameter: "x₀' (2nd packet)", Value: x02 },
        { Parameter: "k₀' (2nd packet)", Value: k02 },
        { Parameter: "σ' (2nd packet)", Value: sigma2 },
      ] : []),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(params), "Parameters");

    XLSX.writeFile(wb, `quantum-lab-${potential}-t${simTime.toFixed(2)}.xlsx`);
    toast({ title: "Exported", description: "Quantum Lab data saved as XLSX" });
  }, [plotData, ev, trajectory, measurements, potential, bc, V0, omega, width, separation, x0, k0, sigma, initialState, dt, gridSize, simTime, interferenceEnabled, x02, k02, sigma2]);

  return (
    <PageLayout>
      <SEOHead
        title="Quantum Lab – Interactive Wavefunction Simulator | Quantara AI"
        description="Simulate quantum wavefunctions in real-time with interactive potentials, time evolution, probability density plots, and energy spectrum analysis. Free quantum mechanics lab."
        canonical="https://www.quantaraai.site/lab"
        keywords="quantum simulator online, wavefunction simulator, quantum mechanics lab, Schrödinger equation simulation, quantum physics tool"
      />
      <ScienceBackground />
      <div className="container px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
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
            <Button size="sm" variant="outline" onClick={handleExportXLSX}
              className="gap-1.5 border-border text-xs hidden sm:flex">
              <Download size={13} /> Export XLSX
            </Button>
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

            <EnergySpectrumPanel
              potential={potential}
              V0={V0}
              omega={omega}
              width={width}
              currentEnergy={ev?.energy ?? null}
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
