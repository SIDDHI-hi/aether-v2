import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { runRoutingOptimization, type OptimizationResult } from '../../lib/routingOptimizer';
import {
  Zap, TrendingDown, DollarSign, ArrowRight, ChevronDown,
  Loader2, AlertCircle, CheckCircle2, RefreshCw, Globe, Cpu
} from 'lucide-react';

const PRODUCTION_PRESETS = [
  { label: '100K units', value: 100_000 },
  { label: '500K units', value: 500_000 },
  { label: '1M units', value: 1_000_000 },
  { label: '5M units', value: 5_000_000 },
];

export const RoutingOptimizer: React.FC = () => {
  const { data } = useStore();
  const rawNodes = useMemo(() => data?.nodes || data?.connectors || [], [data]);
  const rawEdges = useMemo(() => data?.wires || data?.connections || [], [data]);

  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [productionUnits, setProductionUnits] = useState(1_000_000);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = useCallback(async () => {
    if (!sourceId || !targetId || sourceId === targetId) {
      setError('Select two distinct connectors to optimize.');
      return;
    }
    setError(null);
    setResult(null);
    setIsRunning(true);

    // Simulate async processing (actual computation is synchronous but instant)
    await new Promise(r => setTimeout(r, 1200));

    const res = runRoutingOptimization(rawNodes, rawEdges, sourceId, targetId, productionUnits);
    setIsRunning(false);

    if (!res) {
      setError('No valid path found between the selected connectors, or all node coordinates are identical (degenerate graph). Try a different pair.');
      return;
    }
    setResult(res);
  }, [sourceId, targetId, productionUnits, rawNodes, rawEdges]);

  const formatUSD = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const formatNum = (n: number, decimals = 1) => n.toFixed(decimals);

  const savingsPct = result
    ? ((result.savedLength / result.originalLength) * 100).toFixed(1)
    : '0';

  // Dynamic ROI calculation based on current production selection
  const liveStats = useMemo(() => {
    if (!result) return null;
    const totalMeters = (result.savedLength / 1000) * productionUnits;
    const totalKm = totalMeters / 1000;
    const totalKg = totalMeters * result.copperDensity;
    const totalUSD = totalKg * result.copperPricePerKg;
    return { totalKm, totalUSD, units: productionUnits };
  }, [result, productionUnits]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: 'var(--surface)' }}>
      {/* HEADER */}
      <div className="panel-header">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.20)', color: '#A78BFA' }}>
            <Zap size={14} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-200 font-display">Generative Routing Optimizer</h2>
            <p className="text-[10px] text-slate-600">Dijkstra's SSSP · 3D Spatial Graph</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Select two connectors and run the optimizer to find the mathematically shortest copper path — and quantify the exact manufacturing cost savings.
        </p>
      </div>

      {/* CONTROLS */}
      <div className="p-4 space-y-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Connector selectors */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-section-header block mb-1.5">Source</label>
            <div className="relative">
              <select
                value={sourceId}
                onChange={e => setSourceId(e.target.value)}
                className="w-full text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 appearance-none pr-7
                           outline-none transition-all cursor-pointer"
                style={{ background: 'var(--surface-inset)', border: '1px solid rgba(255,255,255,0.08)',
                         color: sourceId ? '#e2e8f0' : '#64748b' }}
              >
                <option value="">Select source…</option>
                {rawNodes.map((n: any) => (
                  <option key={n.id} value={n.id}>{n.label || n.id}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-section-header block mb-1.5">Target</label>
            <div className="relative">
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="w-full text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 appearance-none pr-7
                           outline-none transition-all cursor-pointer"
                style={{ background: 'var(--surface-inset)', border: '1px solid rgba(255,255,255,0.08)',
                         color: targetId ? '#e2e8f0' : '#64748b' }}
              >
                <option value="">Select target…</option>
                {rawNodes.filter((n: any) => n.id !== sourceId).map((n: any) => (
                  <option key={n.id} value={n.id}>{n.label || n.id}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Production scale */}
        <div>
          <label className="text-section-header block mb-1.5">Production Scale</label>
          <div className="grid grid-cols-4 gap-1">
            {PRODUCTION_PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={() => setProductionUnits(preset.value)}
                className="py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all"
                style={productionUnits === preset.value
                  ? { background: 'rgba(167,139,250,0.15)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.30)' }
                  : { background: 'rgba(255,255,255,0.04)', color: '#475569', border: '1px solid rgba(255,255,255,0.07)' }
                }
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={isRunning || !sourceId || !targetId}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed py-2.5"
        >
          {isRunning ? (
            <><Loader2 size={13} className="animate-spin" /> Running Dijkstra's…</>
          ) : (
            <><Zap size={13} /> Run Optimizer</>
          )}
        </button>

        {error && (
          <div className="flex items-start gap-2 rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.20)', color: '#FF4757' }}>
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* RESULTS */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="p-4 space-y-4"
            >
              {/* HERO ROI METRICS */}
              <div className="rounded-2xl p-4 space-y-4"
                style={{ background: 'rgba(59,158,255,0.06)', border: '1px solid rgba(59,158,255,0.18)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={14} style={{ color: '#3B9EFF' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3B9EFF' }}>Optimization Complete</span>
                </div>

                {/* Primary saving stat */}
                <div className="text-center py-1">
                  <div className="text-4xl font-black text-white tracking-tight font-display">
                    {formatNum(result.savedCm)}
                    <span className="text-xl ml-1" style={{ color: '#3B9EFF' }}>cm</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">copper saved per vehicle</p>
                  {result.savedLength > 0 && (
                    <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: 'rgba(0,229,160,0.12)', color: '#00E5A0' }}>
                      <TrendingDown size={10} />
                      {savingsPct}% shorter than legacy routing
                    </div>
                  )}
                </div>

                {/* ROI grid */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="rounded-xl p-3 text-center"
                    style={{ background: 'var(--surface-active)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Globe size={14} className="mx-auto mb-1" style={{ color: '#3B9EFF' }} />
                    <div className="text-lg font-black text-white font-display">{formatNum(liveStats?.totalKm || 0, 1)} <span className="text-xs text-slate-500">km</span></div>
                    <p className="text-[9px] text-slate-600 mt-0.5 uppercase tracking-wider">Wire Saved</p>
                  </div>
                  <div className="rounded-xl p-3 text-center"
                    style={{ background: 'var(--surface-active)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <DollarSign size={14} className="mx-auto mb-1" style={{ color: '#00E5A0' }} />
                    <div className="text-sm font-black font-display" style={{ color: '#00E5A0' }}>{formatUSD(liveStats?.totalUSD || 0)}</div>
                    <p className="text-[9px] text-slate-600 mt-0.5 uppercase tracking-wider">Revenue Impact</p>
                  </div>
                </div>
              </div>

              {/* ROUTE COMPARISON */}
              <div className="space-y-2.5">
                <p className="text-section-header">Route Comparison</p>

                {/* Original Route */}
                <div className="rounded-xl p-3"
                  style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.15)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF4757' }} />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Legacy Route</span>
                    </div>
                    <span className="font-mono text-xs font-bold" style={{ color: '#FF4757' }}>{formatNum(result.originalLength)} mm</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {result.originalPath.map((nodeId, i) => (
                      <React.Fragment key={nodeId}>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <Cpu size={8} className="text-slate-600" />
                          <span className="font-mono text-[9px] text-slate-400">{nodeId}</span>
                        </div>
                        {i < result.originalPath.length - 1 && (
                          <ArrowRight size={9} className="text-slate-700" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2 px-1">
                  <div className="flex-1 h-px" style={{ background: 'rgba(167,139,250,0.25)' }} />
                  <div className="flex items-center gap-1 text-[9px] font-bold" style={{ color: '#A78BFA' }}>
                    <Zap size={10} /> Dijkstra's Optimization <RefreshCw size={9} />
                  </div>
                  <div className="flex-1 h-px" style={{ background: 'rgba(167,139,250,0.25)' }} />
                </div>

                {/* Optimized Route */}
                <div className="rounded-xl p-3"
                  style={{ background: 'rgba(59,158,255,0.06)', border: '1px solid rgba(59,158,255,0.18)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#3B9EFF' }} />
                      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#3B9EFF' }}>AI Optimized</span>
                    </div>
                    <span className="font-mono text-xs font-bold" style={{ color: '#3B9EFF' }}>{formatNum(result.optimizedLength)} mm</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {result.optimizedPath.map((nodeId, i) => (
                      <React.Fragment key={nodeId}>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(59,158,255,0.10)', border: '1px solid rgba(59,158,255,0.15)' }}>
                          <Cpu size={8} style={{ color: '#3B9EFF' }} />
                          <span className="font-mono text-[9px]" style={{ color: '#3B9EFF' }}>{nodeId}</span>
                        </div>
                        {i < result.optimizedPath.length - 1 && (
                          <ArrowRight size={9} style={{ color: 'rgba(59,158,255,0.5)' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* DETAILED METRICS */}
              <div className="space-y-2">
                <p className="text-section-header">Technical Parameters</p>
                <div className="space-y-0.5">
                  {[
                    { label: 'Wire Spec', value: 'AWG 18 / 0.12 kg/m' },
                    { label: 'Saved per unit', value: `${formatNum(result.savedLength)} mm (${formatNum(result.savedCm)} cm)` },
                    { label: 'Total fleet saved', value: `${formatNum(liveStats?.totalKm || 0, 2)} km` },
                    { label: 'Copper mass saved', value: `${formatNum((liveStats?.totalUSD || 0) / result.copperPricePerKg, 0)} kg` },
                    { label: 'Copper price', value: `$${result.copperPricePerKg} / kg (LME)` },
                    { label: 'Total material savings', value: formatUSD(liveStats?.totalUSD || 0) },
                    { label: 'Weight reduction / unit', value: `${((result.savedLength / 1000) * result.copperDensity * 1000).toFixed(1)} g` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 px-2.5 rounded-lg
                         hover:bg-white/[0.03] transition-colors">
                      <span className="text-[11px] text-slate-600 font-medium">{label}</span>
                      <span className="font-mono text-[11px] text-slate-300 font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* HEADLINE SUMMARY */}
              <div className="rounded-xl p-3.5"
                style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)' }}>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <span className="font-bold" style={{ color: '#00E5A0' }}>AI finding: </span>
                  Optimized routing saves{' '}
                  <span className="font-semibold text-slate-200">{formatNum(result.savedCm)} cm</span> of wire per vehicle.
                  At <span className="font-semibold text-slate-200">{(productionUnits / 1_000_000).toFixed(1)}M units</span> produced,
                  this eliminates <span className="font-semibold text-slate-200">{formatNum(liveStats?.totalKm || 0, 1)} km</span> of copper
                  worth <span className="font-semibold" style={{ color: '#00E5A0' }}>{formatUSD(liveStats?.totalUSD || 0)}</span> in material costs.
                </p>
              </div>
            </motion.div>
          )}

          {!result && !isRunning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-40 text-center px-6"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <TrendingDown size={20} className="text-slate-700" />
              </div>
              <p className="text-xs text-slate-600">Select connectors above and run the optimizer to see copper savings and ROI analysis.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
