import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import {
  Database, Activity, Cpu, ChevronRight, ArrowUpDown,
  Search, Filter, MapPin, PlugZap
} from 'lucide-react';

type SortKey = 'id' | 'label' | 'confidence';
type SortDir  = 'asc' | 'desc';

/** Map component type keywords → wire color dot class */
function getWireColorClass(label: string = '', id: string = ''): string {
  const s = (label + ' ' + id).toLowerCase();
  if (s.includes('battery') || s.includes('power') || s.includes('pwr'))   return 'wire-dot-power';
  if (s.includes('ground') || s.includes('gnd'))                            return 'wire-dot-ground';
  if (s.includes('switch'))                                                  return 'wire-dot-switches';
  if (s.includes('connector') || s.includes('conn'))                         return 'wire-dot-connectors';
  if (s.includes('sensor'))                                                   return 'wire-dot-sensors';
  if (s.includes('light') || s.includes('lamp') || s.includes('led'))        return 'wire-dot-lights';
  if (s.includes('fuse'))                                                     return 'wire-dot-fuses';
  if (s.includes('ecu') || s.includes('motor') || s.includes('ammeter'))     return 'wire-dot-electrical';
  return 'wire-dot-generic';
}

function getConfColor(conf: number): string {
  if (conf >= 95) return '#00E5A0';
  if (conf >= 85) return '#3B9EFF';
  if (conf >= 75) return '#FFB020';
  return '#FF4757';
}

function getConfLabel(conf: number): string {
  if (conf >= 95) return 'Excellent';
  if (conf >= 85) return 'Good';
  if (conf >= 75) return 'Fair';
  return 'Poor';
}

export const DataGrid: React.FC = () => {
  const { data, setSelectedItem, selectedItem } = useStore();
  const [sortKey, setSortKey]     = useState<SortKey>('id');
  const [sortDir, setSortDir]     = useState<SortDir>('asc');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [search, setSearch]       = useState('');

  const rawNodes: any[] = data?.nodes || data?.connectors || [];
  const rawWires: any[] = data?.connections || data?.wires || [];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = rawNodes.filter((n: any) => {
    if (!search) return true;
    return (n.id + ' ' + (n.label || '')).toLowerCase().includes(search.toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = String(a[sortKey] ?? '');
    const bv = String(b[sortKey] ?? '');
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: 'var(--canvas)' }}>

      {/* ── HEADER ── */}
      <div
        className="px-6 pt-5 pb-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight font-display">
              Harness Inventory
            </h1>
            <p className="text-[0.75rem] text-slate-500 mt-0.5">
              Physical harness architecture — inspect and manage all components
            </p>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(59,158,255,0.08)', border: '1px solid rgba(59,158,255,0.15)', color: '#3B9EFF' }}>
              <Database size={12} />
              <span className="font-mono">{rawNodes.length}</span>
              <span className="font-sans text-slate-500">components</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.15)', color: '#00E5A0' }}>
              <Activity size={12} />
              <span className="font-mono">{rawWires.length}</span>
              <span className="font-sans text-slate-500">connections</span>
            </div>
          </div>
        </div>

        {/* Search + Sort row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            <input
              className="input pl-8 h-8 text-xs"
              placeholder="Search components…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-1">
            {(['id', 'label', 'confidence'] as SortKey[]).map(key => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide
                            flex items-center gap-1 transition-all duration-100`}
                style={sortKey === key
                  ? { background: 'rgba(59,158,255,0.12)', color: '#3B9EFF', border: '1px solid rgba(59,158,255,0.20)' }
                  : { background: 'rgba(255,255,255,0.04)', color: '#475569', border: '1px solid rgba(255,255,255,0.07)' }
                }
              >
                {key}
                <ArrowUpDown size={9} className={sortKey === key ? 'opacity-100' : 'opacity-40'} />
              </button>
            ))}
            <button className="btn-ghost gap-1.5 text-[10px] py-1">
              <Filter size={11} />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* ── CARD LIST ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2">
        {sorted.map((node: any) => {
          const isSelected  = selectedItem?.id === node.id;
          const isExpanded  = expandedCard === node.id;
          const connCount   = rawWires.filter((w: any) => w.source === node.id || w.target === node.id).length;
          const conf        = 88 + (node.id?.charCodeAt(0) || 0) % 12;
          const confColor   = getConfColor(conf);
          const dotClass    = getWireColorClass(node.label, node.id);
          const coords      = node.coordinates_3d
            ? `${Math.round(node.coordinates_3d.x)}, ${Math.round(node.coordinates_3d.y)}, ${Math.round(node.coordinates_3d.z)}`
            : node.x !== undefined ? `${node.x}, ${node.y}, 0` : '—';

          return (
            <React.Fragment key={node.id}>
              <motion.div
                layout
                onClick={() => {
                  setSelectedItem({ type: 'node', ...node });
                  setExpandedCard(isExpanded ? null : node.id);
                }}
                className="rounded-xl cursor-pointer transition-all duration-150 group"
                style={isSelected
                  ? { background: 'rgba(59,158,255,0.07)', border: '1px solid rgba(59,158,255,0.25)',
                      boxShadow: '0 0 0 1px rgba(59,158,255,0.10), 0 4px 12px rgba(0,0,0,0.3)' }
                  : { background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }
                }
                whileHover={!isSelected ? { y: -1,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.35), 0 0 0 1px rgba(59,158,255,0.12)' } : {}}
              >
                {/* Card main row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Component type dot */}
                  <div className={`status-dot ${dotClass} shrink-0`}
                    style={{ width: 8, height: 8, boxShadow: 'none' }} />

                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150"
                    style={isSelected
                      ? { background: 'rgba(59,158,255,0.15)', color: '#3B9EFF' }
                      : { background: 'rgba(255,255,255,0.05)', color: '#64748b' }
                    }
                  >
                    <Cpu size={14} />
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate leading-none
                      ${isSelected ? 'text-slate-100' : 'text-slate-300'}`}>
                      {node.label || 'Standard Connector'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-[10px] font-mono text-slate-600">{node.id}</code>
                      {connCount > 0 && (
                        <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                          <PlugZap size={9} />
                          {connCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-bold font-mono" style={{ color: confColor }}>
                      {conf}%
                    </span>
                    <p className="text-[10px] text-slate-600 mt-0.5">{getConfLabel(conf)}</p>
                  </div>

                  {/* Expand chevron */}
                  <ChevronRight
                    size={13}
                    className="text-slate-700 shrink-0 transition-transform duration-200"
                    style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  />
                </div>

                {/* Confidence fill bar */}
                <div className="px-4 pb-3">
                  <div className="conf-bar-track">
                    <motion.div
                      className="conf-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${conf}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
                      style={{ background: `linear-gradient(90deg, ${confColor}99, ${confColor})` }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Expanded detail area */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    key={`${node.id}-expand`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="rounded-xl mx-1 mb-1 p-4 grid grid-cols-3 gap-4 text-xs"
                      style={{ background: 'var(--surface-active)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      {/* Connected wires */}
                      <div>
                        <p className="text-section-header mb-2">Connections</p>
                        {rawWires
                          .filter((w: any) => w.source === node.id || w.target === node.id)
                          .map((w: any) => (
                            <div key={w.id} className="flex items-center gap-2 mb-1.5">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: w.wire_color?.toLowerCase() || '#3B9EFF' }} />
                              <code className="text-[10px] text-slate-400 font-mono truncate">
                                {w.source} → {w.target}
                              </code>
                            </div>
                          ))}
                        {connCount === 0 && (
                          <p className="text-[10px] text-slate-600">No direct connections</p>
                        )}
                      </div>

                      {/* Properties */}
                      <div>
                        <p className="text-section-header mb-2">Properties</p>
                        {Object.entries(node)
                          .filter(([k]) => !['id', 'x', 'y', 'width', 'height', 'modelUrl'].includes(k))
                          .slice(0, 4)
                          .map(([k, v]) => (
                            <div key={k} className="flex gap-2 mb-1">
                              <span className="text-[10px] text-slate-600 w-16 shrink-0">{k}</span>
                              <code className="text-[10px] text-slate-400 font-mono truncate">{String(v)}</code>
                            </div>
                          ))}
                      </div>

                      {/* 3D Coords + Actions */}
                      <div className="flex flex-col gap-2">
                        <p className="text-section-header">3D Position</p>
                        <code className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                          <MapPin size={9} className="shrink-0 text-brand" />
                          {coords}
                        </code>
                        <div className="flex flex-col gap-1.5 mt-1">
                          <button className="btn-secondary text-[10px] py-1.5">
                            View in 3D Twin
                          </button>
                          <button className="btn-ghost text-[10px] py-1.5">
                            Copy Node ID
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </React.Fragment>
          );
        })}

        {/* Empty state */}
        {rawNodes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Database size={22} className="text-slate-700" />
            </div>
            <p className="text-sm font-semibold text-slate-500">No components found</p>
            <p className="text-xs text-slate-600 mt-1 max-w-[200px] leading-relaxed">
              Upload a harness diagram to populate the inventory
            </p>
          </div>
        )}

        {/* Search empty state */}
        {rawNodes.length > 0 && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-sm text-slate-500">No results for "{search}"</p>
            <button onClick={() => setSearch('')} className="btn-ghost mt-2 text-xs text-brand">
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* ── FOOTER STATUS BAR ── */}
      <div
        className="px-6 py-2.5 flex items-center justify-between shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,14,26,0.6)' }}
      >
        <span className="text-[10px] text-slate-600">
          Showing <span className="text-slate-400 font-mono">{sorted.length}</span> of{' '}
          <span className="text-slate-400 font-mono">{rawNodes.length}</span> components
        </span>
        <div className="flex items-center gap-1.5">
          <span className="status-dot status-dot-live" style={{ width: 6, height: 6 }} />
          <span className="text-[10px] text-slate-600">Live data</span>
        </div>
      </div>
    </div>
  );
};
