import React from 'react';
import { motion } from 'framer-motion';
import {
  Thermometer, AlertOctagon, Wrench, DollarSign,
  Flame, Ruler, CheckCircle2, Zap
} from 'lucide-react';

export const ThermalRiskPanel: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden custom-scrollbar"
      style={{ background: 'var(--surface)' }}>

      {/* ── HEADER ─────────────────────────────── */}
      <div className="panel-header shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(255,71,87,0.12)',
              border: '1px solid rgba(255,71,87,0.25)',
              color: '#FF4757',
            }}>
            <Thermometer size={14} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-200 font-display tracking-tight">
              Thermal Risk Analysis
            </h2>
            <p className="text-[10px] text-slate-600">Harness Segment C (ECU to Firewall)</p>
          </div>

          {/* Live pulse badge */}
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full"
            style={{ background: 'rgba(255,71,87,0.10)', border: '1px solid rgba(255,71,87,0.22)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FF4757' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#FF4757' }}>
              1 Critical
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          AI detected a thermal proximity violation on the active segment. Review the risk data and recommended mitigation below.
        </p>
      </div>

      {/* ── SCROLLABLE BODY ────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

        {/* ── METRIC CARDS GRID ── */}
        <div>
          <p className="text-section-header mb-2.5">Risk Parameters</p>
          <div className="grid grid-cols-2 gap-2">

            {/* Heat Source */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-xl p-3.5 flex flex-col gap-2"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <Flame size={11} style={{ color: '#FF6B35' }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
                  Heat Source
                </span>
              </div>
              <p className="text-sm font-black text-slate-100 font-display leading-tight">
                Exhaust<br />Manifold
              </p>
            </motion.div>

            {/* Peak Temp */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl p-3.5 flex flex-col gap-2"
              style={{
                background: 'rgba(255,71,87,0.06)',
                border: '1px solid rgba(255,71,87,0.18)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <Thermometer size={11} style={{ color: '#FF4757' }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
                  Peak Temp
                </span>
              </div>
              <p className="text-3xl font-black font-display leading-none" style={{ color: '#FF4757' }}>
                145
                <span className="text-base ml-0.5" style={{ color: 'rgba(255,71,87,0.6)' }}>°C</span>
              </p>
            </motion.div>

            {/* Clearance — full width */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="col-span-2 rounded-xl p-3.5 flex items-center gap-4"
              style={{
                background: 'rgba(251,191,36,0.06)',
                border: '1px solid rgba(251,191,36,0.18)',
              }}
            >
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Ruler size={11} style={{ color: '#FBBF24' }} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
                    Clearance
                  </span>
                </div>
                <p className="text-3xl font-black font-display leading-none" style={{ color: '#FBBF24' }}>
                  3
                  <span className="text-base ml-0.5" style={{ color: 'rgba(251,191,36,0.6)' }}>cm</span>
                </p>
              </div>

              {/* Mini progress bar — clearance vs safe threshold */}
              <div className="flex-1">
                <div className="flex justify-between text-[9px] text-slate-600 mb-1.5 font-medium">
                  <span>Measured</span>
                  <span className="text-slate-400">Safe ≥10 cm</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '30%' }}
                    transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #FF4757, #FBBF24)' }}
                  />
                </div>
                <p className="text-[9px] text-slate-600 mt-1 font-medium">⚠ 70% below safe threshold</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── CRITICAL WARNING CARD ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,71,87,0.10) 0%, rgba(255,107,53,0.08) 100%)',
            border: '1px solid rgba(255,71,87,0.30)',
            boxShadow: '0 0 24px rgba(255,71,87,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.3)' }}>
              <AlertOctagon size={15} style={{ color: '#FF4757' }} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#FF4757' }}>
                Critical — Replacement Required
              </p>
              <p className="text-slate-300 text-xs font-semibold leading-snug">
                Est. Replacement Time
              </p>
            </div>

            <div className="ml-auto text-right">
              <p className="text-3xl font-black font-display" style={{ color: '#FF4757' }}>6.5</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Hours</p>
            </div>
          </div>

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,71,87,0.15)' }}>
            <Wrench size={11} className="shrink-0 mt-0.5" style={{ color: '#FF4757' }} />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Maintenance note: </span>
              Requires partial engine block removal. Schedule during next planned service window — do not defer beyond 2,000 km.
            </p>
          </div>
        </motion.div>

        {/* ── SEGMENT DETAIL ── */}
        <div>
          <p className="text-section-header mb-2.5">Segment Details</p>
          <div className="space-y-0.5">
            {[
              { label: 'Segment ID',      value: 'SEG-C-047' },
              { label: 'Route',           value: 'ECU → Firewall' },
              { label: 'Wire Spec',       value: 'AWG 14 / XLPE' },
              { label: 'Max Rated Temp',  value: '125 °C' },
              { label: 'Deviation',       value: '+20 °C over limit' },
              { label: 'Risk Level',      value: 'CRITICAL' },
            ].map(({ label, value }) => (
              <div key={label}
                className="flex justify-between items-center py-1.5 px-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                <span className="text-[11px] text-slate-600 font-medium">{label}</span>
                <span
                  className="font-mono text-[11px] font-semibold"
                  style={{ color: value === 'CRITICAL' ? '#FF4757' : '#e2e8f0' }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI FINDING CALLOUT ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(59,158,255,0.06)',
            border: '1px solid rgba(59,158,255,0.20)',
          }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
              style={{ background: 'rgba(59,158,255,0.15)', color: '#3B9EFF' }}>
              <Zap size={10} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3B9EFF' }}>
              AI Finding
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Early detection of this thermal violation avoids an unplanned field replacement.
            At OEM warranty labor rates ($185/hr), addressing this proactively saves an estimated{' '}
            <span className="font-bold" style={{ color: '#00E5A0' }}>$1,202 per vehicle</span>{' '}
            in warranty claim labor costs.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl p-2.5 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <DollarSign size={12} className="mx-auto mb-1" style={{ color: '#00E5A0' }} />
              <p className="text-sm font-black font-display" style={{ color: '#00E5A0' }}>$1,202</p>
              <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">Avoidance / unit</p>
            </div>
            <div className="rounded-xl p-2.5 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <CheckCircle2 size={12} className="mx-auto mb-1" style={{ color: '#3B9EFF' }} />
              <p className="text-sm font-black font-display text-white">6.5 hr</p>
              <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">Labor saved</p>
            </div>
          </div>
        </motion.div>

        {/* bottom spacer */}
        <div className="h-2" />
      </div>
    </div>
  );
};
