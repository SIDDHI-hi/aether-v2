import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Thermometer, Zap, AlertOctagon, Wrench,
  CheckCircle2, Activity, FlameKindling, ShieldAlert, MousePointer2
} from 'lucide-react';
import { useStore } from '../../store/useStore';

/* ─────────────────────────────────────────────────────────
   Per-component-type thermal profiles
   Each type has: baseTemp (idle °C), voltageCoeff (°C per volt above 12V),
   heatSource, maxRatedTemp, mttr (hours), action
───────────────────────────────────────────────────────── */
interface ThermalProfile {
  baseTemp: number;
  voltageCoeff: number;
  heatSource: string;
  maxRatedTemp: number;
  mttr: number;
  action: string;
  resistance: number; // Ohms (Ω)
  loadFactor: number; // Current multiplier
  wireGaugeFn: (v: number) => string;
}

const COMPONENT_PROFILES: Record<string, ThermalProfile> = {
  ecu: {
    baseTemp: 55, voltageCoeff: 2.8, heatSource: 'On-board DSP & Mosfets',
    maxRatedTemp: 105, mttr: 4.5, action: 'Motherboard replacement — ESD-safe bench required',
    resistance: 0.85, loadFactor: 4.8,
    wireGaugeFn: (v) => v <= 24 ? 'AWG 20' : v <= 42 ? 'AWG 16' : 'AWG 12',
  },
  battery: {
    baseTemp: 30, voltageCoeff: 1.5, heatSource: 'Internal cell resistance',
    maxRatedTemp: 60, mttr: 1.5, action: 'Battery swap — gloves + ventilation required',
    resistance: 0.05, loadFactor: 12.0,
    wireGaugeFn: (v) => v <= 24 ? 'AWG 4' : 'AWG 2/0',
  },
  motor: {
    baseTemp: 60, voltageCoeff: 3.2, heatSource: 'Armature windings',
    maxRatedTemp: 130, mttr: 5.0, action: 'Motor rewind or full replacement',
    resistance: 0.45, loadFactor: 8.5,
    wireGaugeFn: (v) => v <= 24 ? 'AWG 14' : v <= 42 ? 'AWG 10' : 'AWG 6',
  },
  sensor: {
    baseTemp: 45, voltageCoeff: 1.8, heatSource: 'Adjacent exhaust manifold',
    maxRatedTemp: 150, mttr: 1.0, action: 'Direct sensor swap — 22mm socket',
    resistance: 220, loadFactor: 0.05,
    wireGaugeFn: () => 'AWG 22',
  },
  relay: {
    baseTemp: 50, voltageCoeff: 2.2, heatSource: 'Coil resistance heating',
    maxRatedTemp: 85, mttr: 0.5, action: 'Pull-and-replace relay in fuse box',
    resistance: 85, loadFactor: 1.2,
    wireGaugeFn: (v) => v <= 30 ? 'AWG 18' : 'AWG 14',
  },
  fuse: {
    baseTemp: 35, voltageCoeff: 2.0, heatSource: 'Overcurrent element',
    maxRatedTemp: 80, mttr: 0.2, action: 'Replace with correct ampere-rated blade fuse',
    resistance: 0.02, loadFactor: 1.0,
    wireGaugeFn: () => 'AWG 18',
  },
  power: {
    baseTemp: 52, voltageCoeff: 2.6, heatSource: 'Bus bar resistive loss',
    maxRatedTemp: 100, mttr: 3.5, action: 'PDU replacement — full wiring loom disconnect needed',
    resistance: 0.12, loadFactor: 15.0,
    wireGaugeFn: (v) => v <= 24 ? 'AWG 8' : 'AWG 4',
  },
  connector: {
    baseTemp: 40, voltageCoeff: 2.5, heatSource: 'Exhaust Manifold',
    maxRatedTemp: 125, mttr: 6.5, action: 'Engine Drop — partial powertrain removal required',
    resistance: 0.35, loadFactor: 2.2,
    wireGaugeFn: (v) => v <= 24 ? 'AWG 18' : v <= 42 ? 'AWG 14' : 'AWG 10',
  },
  switch: {
    baseTemp: 38, voltageCoeff: 1.6, heatSource: 'Contact arc heating',
    maxRatedTemp: 85, mttr: 0.8, action: 'Switch panel removal — dashboard partial teardown',
    resistance: 1.2, loadFactor: 0.8,
    wireGaugeFn: () => 'AWG 18',
  },
  ground: {
    baseTemp: 28, voltageCoeff: 0.8, heatSource: 'Chassis return current',
    maxRatedTemp: 120, mttr: 0.5, action: 'Clean and re-torque ground stud (Nm: 12)',
    resistance: 0.003, loadFactor: 1.0,
    wireGaugeFn: () => 'AWG 10',
  },
  generic: {
    baseTemp: 40, voltageCoeff: 2.5, heatSource: 'Exhaust Manifold',
    maxRatedTemp: 125, mttr: 6.5, action: 'Engine Drop — partial powertrain removal required',
    resistance: 0.50, loadFactor: 1.0,
    wireGaugeFn: (v) => v <= 24 ? 'AWG 18' : v <= 42 ? 'AWG 14' : 'AWG 10',
  },
};

/* ─────────────────────────────────────────────────────────
   Detect component type from label (mirrors Viewer3D logic)
───────────────────────────────────────────────────────── */
function detectType(label: string): string {
  const l = (label || '').toLowerCase();
  if (l.includes('ecu') || l.includes('pcm') || l.includes('bcm') || l.includes('module') || l.includes('controller')) return 'ecu';
  if (l.includes('battery') || l.includes('batt')) return 'battery';
  if (l.includes('motor') || l.includes('actuator') || l.includes('pump') || l.includes('starter')) return 'motor';
  if (l.includes('sensor') || l.includes('temp') || l.includes('o2') || l.includes('speed')) return 'sensor';
  if (l.includes('relay')) return 'relay';
  if (l.includes('fuse')) return 'fuse';
  if (l.includes('power') || l.includes('pwr') || l.includes('distribution')) return 'power';
  if (l.includes('connector') || l.includes('conn') || l.includes('harness') || l.includes('plug')) return 'connector';
  if (l.includes('switch')) return 'switch';
  if (l.includes('ground') || l.includes('gnd')) return 'ground';
  return 'generic';
}

/* ─────────────────────────────────────────────────────────
   Thermal model & status
───────────────────────────────────────────────────────── */
type ThermalStatus = 'SAFE' | 'WARNING' | 'CRITICAL';

function calcTemp(voltage: number, profile: ThermalProfile): number {
  return Math.round(profile.baseTemp + (voltage - 12) * profile.voltageCoeff);
}

function getStatus(temp: number, maxRated: number): ThermalStatus {
  if (temp < maxRated * 0.68) return 'SAFE';
  if (temp < maxRated) return 'WARNING';
  return 'CRITICAL';
}

const STATUS_CONFIG = {
  SAFE: {
    label: 'Safe', color: '#00E5A0',
    bg: 'rgba(0,229,160,0.08)', border: 'rgba(0,229,160,0.22)',
    icon: <CheckCircle2 size={14} />,
    desc: 'Component within thermal tolerance.',
  },
  WARNING: {
    label: 'Warning', color: '#FBBF24',
    bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)',
    icon: <ShieldAlert size={14} />,
    desc: 'Approaching rated limit. Monitor closely.',
  },
  CRITICAL: {
    label: 'Critical Failure', color: '#FF4757',
    bg: 'rgba(255,71,87,0.10)', border: 'rgba(255,71,87,0.30)',
    icon: <AlertOctagon size={14} />,
    desc: 'Insulation melt imminent. Immediate action required.',
  },
};

/* ─────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────── */
export const ThermalSimulatorPanel: React.FC = () => {
  const { selectedItem } = useStore();
  const [voltage, setVoltage] = useState(12);

  // Determine which component is selected (from 3D click)
  const selectedNode = selectedItem?.type === 'node' ? selectedItem : null;
  const componentLabel: string = selectedNode?.label || selectedNode?.id || '';
  const componentType = componentLabel ? detectType(componentLabel) : 'generic';
  const profile = COMPONENT_PROFILES[componentType] ?? COMPONENT_PROFILES.generic;

  const temp = useMemo(() => calcTemp(voltage, profile), [voltage, profile]);
  const status = useMemo(() => getStatus(temp, profile.maxRatedTemp), [temp, profile]);
  const cfg = STATUS_CONFIG[status];
  const isCritical = status === 'CRITICAL';

  const tempPct = Math.min(100, Math.max(0, ((temp - profile.baseTemp) / (profile.maxRatedTemp * 1.35 - profile.baseTemp)) * 100));
  const trackPct = ((voltage - 12) / (60 - 12)) * 100;

  // Real-time sensor noise simulation (+/- 0.5% jitter)
  const [noise, setNoise] = useState(1);
  React.useEffect(() => {
    const interval = setInterval(() => setNoise(0.995 + Math.random() * 0.01), 200);
    return () => clearInterval(interval);
  }, []);

  const currentLoad = `${(voltage * profile.loadFactor * noise).toFixed(1)} A`;
  const powerDiss = `${((voltage * voltage) / (profile.resistance || 0.1) * 0.001 * noise).toFixed(2)} kW`;
  const insulationPct = Math.max(0, Math.round(100 - ((temp / profile.maxRatedTemp) * 100)));
  const wireGauge = profile.wireGaugeFn(voltage);

  // MTTR cost estimate
  const laborCost = Math.round(profile.mttr * 185);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: 'var(--surface)' }}>

      {/* ── HEADER ─────────────────────────────── */}
      <div className="panel-header shrink-0">
        <div className="flex items-center gap-2.5 mb-2">
          <motion.div
            animate={{ background: isCritical ? 'rgba(255,71,87,0.15)' : 'rgba(59,158,255,0.12)', borderColor: isCritical ? 'rgba(255,71,87,0.25)' : 'rgba(59,158,255,0.22)' }}
            transition={{ duration: 0.4 }}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ border: '1px solid', color: isCritical ? '#FF4757' : '#3B9EFF' }}>
            <FlameKindling size={14} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-bold text-slate-200 font-display">Thermal Simulator</h2>
            <AnimatePresence mode="wait">
              <motion.p key={componentLabel || 'default'}
                initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-[10px] text-slate-500 truncate">
                {componentLabel
                  ? `↳ ${componentLabel} (${componentType})`
                  : 'Click a 3D component to inspect it'}
              </motion.p>
            </AnimatePresence>
          </div>
          <motion.div key={status} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
            {cfg.label}
          </motion.div>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

        {/* ── NO SELECTION PROMPT ── */}
        <AnimatePresence>
          {!selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(59,158,255,0.06)', border: '1px solid rgba(59,158,255,0.18)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(59,158,255,0.12)', color: '#3B9EFF' }}>
                <MousePointer2 size={15} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">Click any 3D component</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Switch to 3D Digital Twin view, then click a component to load its specific thermal profile here.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── COMPONENT INFO BANNER (when selected) ── */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-200 truncate">{componentLabel}</p>
                <p className="text-[9px] text-slate-600 mt-0.5 uppercase tracking-wider">{componentType} · Max rated: {profile.maxRatedTemp}°C · MTTR: {profile.mttr}h</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── VOLTAGE SLIDER ─────────────────── */}
        <div className="rounded-2xl p-4 space-y-3"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap size={12} style={{ color: '#3B9EFF' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">System Voltage Load</span>
            </div>
            <motion.span key={voltage} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
              className="text-lg font-black font-display" style={{ color: '#3B9EFF' }}>
              {voltage}V
            </motion.span>
          </div>

          <div className="relative h-6 flex items-center">
            <div className="absolute w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{
                width: `${trackPct}%`,
                background: isCritical
                  ? 'linear-gradient(90deg,#3B9EFF,#FBBF24,#FF4757)'
                  : status === 'WARNING'
                  ? 'linear-gradient(90deg,#3B9EFF,#FBBF24)'
                  : 'linear-gradient(90deg,#3B9EFF,#60EFFF)',
                transition: 'width 0.1s, background 0.4s',
              }} />
            </div>
            <input type="range" min={12} max={60} step={1} value={voltage}
              onChange={e => setVoltage(Number(e.target.value))}
              className="relative w-full appearance-none bg-transparent cursor-pointer" style={{ zIndex: 2 }} />
          </div>

          <div className="flex justify-between text-[9px] text-slate-700 font-mono font-bold">
            <span>12V</span><span>24V</span><span>36V</span><span>48V</span><span>60V</span>
          </div>
        </div>

        {/* ── METRIC CARDS ──────────────── */}
        <div>
          <p className="text-section-header mb-2.5">Live Metrics</p>
          <div className="grid grid-cols-2 gap-2">

            {/* Component Temp hero */}
            <motion.div key={`${temp}-${componentType}`}
              className="col-span-2 rounded-2xl p-4 flex items-center gap-4"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, transition: 'background 0.4s,border 0.4s' }}
              initial={{ scale: 0.98 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Thermometer size={11} style={{ color: cfg.color }} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Component Temp</span>
                </div>
                <motion.p key={temp} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="text-4xl font-black font-display leading-none" style={{ color: cfg.color }}>
                  {temp}<span className="text-xl ml-0.5" style={{ opacity: 0.6 }}>°C</span>
                </motion.p>
                <p className="text-[9px] text-slate-600 mt-1.5">
                  Max rated: {profile.maxRatedTemp}°C · Source: {profile.heatSource}
                </p>
              </div>
              {/* Temp gauge */}
              <div className="w-20 flex flex-col gap-1.5">
                <div className="h-16 rounded-lg overflow-hidden relative flex flex-col-reverse"
                  style={{ background: 'rgba(0,0,0,0.25)' }}>
                  <motion.div className="rounded-b-lg"
                    animate={{ height: `${tempPct}%` }}
                    transition={{ duration: 0.3 }}
                    style={{ background: `linear-gradient(180deg, ${cfg.color}, ${cfg.color}44)`, boxShadow: `0 0 12px ${cfg.color}66` }} />
                </div>
                <div className="flex justify-between text-[8px] text-slate-700 font-mono">
                  <span>{profile.baseTemp}°</span><span>{Math.round(profile.maxRatedTemp * 1.3)}°</span>
                </div>
              </div>
            </motion.div>

            {/* Status */}
            <motion.div key={status} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-3 flex flex-col gap-2"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="flex items-center gap-1.5" style={{ color: cfg.color }}>
                {cfg.icon}
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Status</span>
              </div>
              <p className="text-sm font-black font-display" style={{ color: cfg.color }}>{cfg.label}</p>
              <p className="text-[10px] text-slate-600 leading-snug">{cfg.desc}</p>
            </motion.div>

            {/* Current Load */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="rounded-xl p-3 flex flex-col gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-1.5">
                <Activity size={11} style={{ color: '#A78BFA' }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Current Load</span>
              </div>
              <motion.p key={currentLoad} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="text-lg font-black font-display text-slate-100">{currentLoad}</motion.p>
            </motion.div>

            {/* Power Dissipation */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="rounded-xl p-3 flex flex-col gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-1.5">
                <Zap size={11} style={{ color: '#FBBF24' }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Power Diss.</span>
              </div>
              <motion.p key={powerDiss} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="text-lg font-black font-display text-slate-100">{powerDiss}</motion.p>
            </motion.div>

            {/* Insulation */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-xl p-3 flex flex-col gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-1.5">
                <ShieldAlert size={11} style={{ color: '#3B9EFF' }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Insulation</span>
              </div>
              <motion.p key={insulationPct} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="text-lg font-black font-display"
                style={{ color: insulationPct < 30 ? '#FF4757' : insulationPct < 60 ? '#FBBF24' : '#00E5A0' }}>
                {insulationPct}%
              </motion.p>
            </motion.div>

            {/* Wire Gauge */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="rounded-xl p-3 flex flex-col gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-1.5">
                <FlameKindling size={11} style={{ color: '#FF6B35' }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Wire Gauge</span>
              </div>
              <motion.p key={wireGauge} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="text-lg font-black font-display text-slate-100">{wireGauge}</motion.p>
            </motion.div>
          </div>
        </div>

        {/* ── CONDITIONAL FAILURE CARD (temp > maxRated) ── */}
        <AnimatePresence>
          {isCritical && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl p-4 space-y-3"
                style={{
                  background: 'linear-gradient(135deg,rgba(255,71,87,0.12) 0%,rgba(255,107,53,0.08) 100%)',
                  border: '1px solid rgba(255,71,87,0.35)',
                  boxShadow: '0 0 32px rgba(255,71,87,0.12), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 animate-pulse"
                    style={{ background: 'rgba(255,71,87,0.2)', border: '1px solid rgba(255,71,87,0.4)' }}>
                    <AlertOctagon size={16} style={{ color: '#FF4757' }} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#FF4757' }}>
                      ⚠ Maintenance &amp; MTTR Alert
                    </p>
                    <p className="text-white text-sm font-bold leading-snug">
                      {componentLabel ? `${componentLabel} — ` : ''}Insulation Melt Detected
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,71,87,0.2)' }}>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Est. Replacement Time</p>
                    <p className="text-2xl font-black font-display" style={{ color: '#FF4757' }}>{profile.mttr}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Hours</p>
                  </div>
                  <div className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,71,87,0.2)' }}>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Warranty Exposure</p>
                    <p className="text-xl font-black font-display" style={{ color: '#FBBF24' }}>${laborCost.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">@$185/hr</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl px-3 py-3"
                  style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,71,87,0.18)' }}>
                  <Wrench size={12} className="shrink-0 mt-0.5" style={{ color: '#FF4757' }} />
                  <div>
                    <p className="text-[10px] font-bold mb-0.5" style={{ color: '#FF4757' }}>Required Action</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      <span className="font-bold text-white">{profile.action}</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-2" />
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width:18px; height:18px; border-radius:50%;
          background:linear-gradient(135deg,#3B9EFF,#A78BFA);
          box-shadow:0 0 10px rgba(59,158,255,0.6); cursor:pointer;
          border:2px solid rgba(255,255,255,0.2);
        }
        input[type=range]::-moz-range-thumb {
          width:18px; height:18px; border-radius:50%;
          background:linear-gradient(135deg,#3B9EFF,#A78BFA);
          box-shadow:0 0 10px rgba(59,158,255,0.6); cursor:pointer;
          border:2px solid rgba(255,255,255,0.2);
        }
        input[type=range]:focus { outline:none; }
      `}</style>
    </div>
  );
};
