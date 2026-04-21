import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import {
  Layers3, Network, Archive, Zap, Plus, Settings,
  ChevronDown, FlameKindling
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { viewMode, setViewMode, resetSession, appState } = useStore();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarW = collapsed ? 62 : 224;
  const disabled = appState !== 'dashboard';

  const viewItems = [
    {
      id: 'list', label: 'Asset Inventory', description: 'Full component registry',
      icon: <Archive size={15} />,
      action: () => setViewMode('netlist'), isActive: () => viewMode === 'netlist',
    },
    {
      id: 'schematic', label: '2D Schematic', description: 'Cartesian wire diagram',
      icon: <Network size={15} />,
      action: () => setViewMode('viewer2d'), isActive: () => viewMode === 'viewer2d',
    },
    {
      id: 'twin3d', label: '3D Digital Twin', description: 'X-Ray spatial model',
      icon: <Layers3 size={15} />,
      action: () => setViewMode('viewer3d'), isActive: () => viewMode === 'viewer3d',
    },
  ];

  return (
    <aside
      className="h-full flex flex-col z-50 shrink-0 transition-all duration-300"
      style={{
        width: sidebarW,
        background: 'linear-gradient(180deg,#0F1629 0%,#0C1221 100%)',
        borderRight: '1px solid rgba(255,255,255,0.055)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.35)',
      }}
    >
      {/* ── LOGO ── */}
      <div className="h-[60px] flex items-center gap-3 shrink-0 px-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg,#3B9EFF 0%,#6E54FF 55%,#A78BFA 100%)',
            boxShadow: '0 0 14px rgba(59,158,255,0.4), 0 2px 6px rgba(0,0,0,0.4)',
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <Zap size={14} className="text-white" />
        </button>

        {!collapsed && (
          <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }} className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold text-white tracking-tight leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Aether
            </p>
            <p className="text-[9px] text-slate-600 uppercase tracking-[0.2em] mt-0.5">Wire Intelligence</p>
          </motion.div>
        )}
      </div>

      {/* ── NAV ── */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-2 space-y-5">

        {/* VIEWPORT section */}
        <div>
          {!collapsed && (
            <div className="nav-section-header flex items-center justify-between px-2 mb-2">
              <span>Viewport</span>
              <ChevronDown size={10} />
            </div>
          )}
          <div className="space-y-0.5">
            {viewItems.map(item => {
              const active = item.isActive();
              const isDisabled = disabled && !active;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  disabled={isDisabled}
                  title={item.label}
                  className={`nav-item ${active ? 'nav-item-active' : ''} ${isDisabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''} ${collapsed ? 'justify-center px-2' : ''} w-full`}
                >
                  {active && (
                    <motion.div
                      layoutId={`sidebar-bar-${item.id}`}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: '#3B9EFF', boxShadow: '0 0 8px rgba(59,158,255,0.6)' }}
                      transition={{ type: 'spring', stiffness: 450, damping: 36 }}
                    />
                  )}
                  <span className="shrink-0" style={active ? { color: '#3B9EFF', filter: 'drop-shadow(0 0 5px rgba(59,158,255,0.5))' } : {}}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-[12px] font-semibold leading-none truncate" style={active ? { color: '#3B9EFF' } : { color: '#94a3b8' }}>
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5 truncate">{item.description}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ANALYSIS section — single item: Thermal Simulator */}
        <div>
          {!collapsed && (
            <div className="nav-section-header flex items-center justify-between px-2 mb-2">
              <span>Analysis</span>
              <ChevronDown size={10} />
            </div>
          )}
          <div className="space-y-0.5">
            <button
              className={`nav-item nav-item-active ${collapsed ? 'justify-center px-2' : ''} w-full`}
              title="Thermal Simulator"
              style={{ background: 'rgba(59,158,255,0.07)', borderColor: 'rgba(59,158,255,0.16)' }}
            >
              <motion.div
                layoutId="sidebar-bar-thermal"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                style={{ background: '#3B9EFF', boxShadow: '0 0 8px rgba(59,158,255,0.6)' }}
              />
              <span className="shrink-0" style={{ color: '#3B9EFF', filter: 'drop-shadow(0 0 5px rgba(59,158,255,0.5))' }}>
                <FlameKindling size={15} />
              </span>
              {!collapsed && (
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[12px] font-semibold leading-none truncate" style={{ color: '#3B9EFF' }}>Thermal Simulator</p>
                  <p className="text-[10px] text-slate-600 mt-0.5 truncate">Voltage-driven heat model</p>
                </div>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ── FOOTER ── */}
      <div className="p-2.5 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.055)' }}>
        {/* New Extraction CTA */}
        <button
          onClick={resetSession}
          title="New Extraction"
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group font-semibold text-[11.5px] ${collapsed ? 'justify-center' : ''}`}
          style={{
            background: 'linear-gradient(135deg,rgba(59,158,255,0.14) 0%,rgba(110,84,255,0.10) 100%)',
            border: '1px solid rgba(59,158,255,0.22)',
            color: '#93C5FD',
            boxShadow: '0 0 16px rgba(59,158,255,0.07)',
          }}
        >
          <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
            style={{ background: 'rgba(59,158,255,0.18)', color: '#3B9EFF' }}>
            <Plus size={12} />
          </div>
          {!collapsed && <span className="transition-colors group-hover:text-white">New Extraction</span>}
        </button>

        {/* Status row */}
        {!collapsed ? (
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="status-dot status-dot-live" />
            <span className="text-[9.5px] text-slate-600 uppercase tracking-wider font-medium">Live</span>
            <div className="flex-1" />
            <span className="text-[9.5px] text-slate-700 font-mono">v2.4</span>
            <button className="btn-ghost p-1 text-slate-700 hover:text-slate-400" title="Settings">
              <Settings size={12} />
            </button>
          </div>
        ) : (
          <button className="btn-ghost w-full justify-center py-1.5 text-slate-700" title="Settings">
            <Settings size={13} />
          </button>
        )}
      </div>
    </aside>
  );
};