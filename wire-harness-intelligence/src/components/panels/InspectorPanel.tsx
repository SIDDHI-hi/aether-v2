import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import {
  Database, Activity, Cpu, SlidersHorizontal,
  Box, Upload, Loader2, Clipboard, Share2, ExternalLink,
  MapPin, PlugZap, CheckCircle2
} from 'lucide-react';

// Extend JSX intrinsic elements for Google's <model-viewer> custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.HTMLAttributes<HTMLElement> & {
        src?: string;
        'auto-rotate'?: boolean | string;
        'camera-controls'?: boolean | string;
        ar?: boolean | string;
        alt?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

function getConfColor(conf: number) {
  if (conf >= 95) return '#00E5A0';
  if (conf >= 85) return '#3B9EFF';
  if (conf >= 75) return '#FFB020';
  return '#FF4757';
}

export const InspectorPanel: React.FC = () => {
  const { selectedItem, upload3DModel, data } = useStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  if (!selectedItem) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
        style={{ background: 'var(--surface)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <SlidersHorizontal size={22} className="text-slate-700" />
        </div>
        <h3 className="text-sm font-semibold text-slate-400 mb-1">Nothing Selected</h3>
        <p className="text-[11px] text-slate-600 max-w-[180px] leading-relaxed">
          Click any component in the list or schematic to inspect it here.
        </p>
      </div>
    );
  }

  const isNode = selectedItem.type === 'node';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedItem) return;
    setIsUploading(true);
    try {
      await upload3DModel(file, selectedItem.id);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const connections = data?.wires?.filter(
    (w: any) => w.source === selectedItem.id || w.target === selectedItem.id
  ) || [];

  const HIDDEN_KEYS = ['x', 'y', 'width', 'height', 'type', 'modelUrl', 'label', 'id'];
  const displayProps = Object.entries(selectedItem).filter(([k]) => !HIDDEN_KEYS.includes(k));

  const conf = 88 + (selectedItem.id?.charCodeAt(0) || 0) % 12;
  const confColor = getConfColor(conf);

  const coords = selectedItem.coordinates_3d
    ? `${Math.round(selectedItem.coordinates_3d.x)}, ${Math.round(selectedItem.coordinates_3d.y)}, ${Math.round(selectedItem.coordinates_3d.z)}`
    : selectedItem.x !== undefined
    ? `${selectedItem.x}, ${selectedItem.y}, 0`
    : '—';

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: 'var(--surface)' }}>

      {/* ── HEADER ── */}
      <div className="panel-header">
        {/* Type badge + actions */}
        <div className="flex items-center justify-between mb-3">
          <span className={`badge ${isNode ? 'badge-brand' : 'badge-warning'}`}>
            {isNode ? 'Component' : 'Connection'}
          </span>
          <div className="flex gap-0.5">
            <button className="btn-ghost px-2 py-1" title="Copy ID"
              onClick={() => navigator.clipboard.writeText(selectedItem.id)}>
              <Clipboard size={12} />
            </button>
            <button className="btn-ghost px-2 py-1" title="Share">
              <Share2 size={12} />
            </button>
            <button className="btn-ghost px-2 py-1" title="Open">
              <ExternalLink size={12} />
            </button>
          </div>
        </div>

        {/* Component identity */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={isNode
              ? { background: 'rgba(59,158,255,0.12)', border: '1px solid rgba(59,158,255,0.20)', color: '#3B9EFF' }
              : { background: 'rgba(255,176,32,0.12)', border: '1px solid rgba(255,176,32,0.20)', color: '#FFB020' }
            }
          >
            {isNode ? <Cpu size={18} /> : <Activity size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-100 truncate font-display">
              {selectedItem.label || selectedItem.id}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <code className="text-[10px] text-slate-500 font-mono">{selectedItem.id}</code>
              <span className="text-slate-700">·</span>
              <span className="text-[10px] text-slate-600">Class IV</span>
            </div>
          </div>
        </div>

        {/* Status pills row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg p-2 text-center"
            style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.12)' }}>
            <CheckCircle2 size={12} className="mx-auto mb-1" style={{ color: '#00E5A0' }} />
            <p className="text-[10px] font-semibold" style={{ color: '#00E5A0' }}>Validated</p>
          </div>
          <div className="rounded-lg p-2 text-center"
            style={{ background: 'rgba(59,158,255,0.06)', border: '1px solid rgba(59,158,255,0.12)' }}>
            <PlugZap size={12} className="mx-auto mb-1" style={{ color: '#3B9EFF' }} />
            <p className="text-[10px] font-semibold" style={{ color: '#3B9EFF' }}>{connections.length} Conns</p>
          </div>
          <div className="rounded-lg p-2 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <MapPin size={12} className="mx-auto mb-1 text-slate-500" />
            <p className="text-[10px] font-semibold text-slate-500">Tracked</p>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}>

        {/* Confidence */}
        <div className="panel-body">
          <div className="flex items-center justify-between mb-2">
            <p className="text-section-header">Confidence Score</p>
            <span className="text-sm font-bold font-mono" style={{ color: confColor }}>{conf}%</span>
          </div>
          <div className="progress-track">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${conf}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{ background: `linear-gradient(90deg, ${confColor}80, ${confColor})` }}
            />
          </div>
        </div>

        {/* 3D Digital Twin */}
        {isNode && (
          <div className="panel-body">
            <div className="flex items-center justify-between mb-3">
              <span className="text-section-header flex items-center gap-1.5">
                <Box size={10} /> Digital Twin (3D)
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn-ghost py-0.5 text-[10px] gap-1 disabled:opacity-50"
              >
                {isUploading ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                {isUploading ? 'Uploading…' : 'Update Model'}
              </button>
            </div>

            <div className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'var(--surface-inset)' }}>
              {selectedItem.modelUrl ? (
                <div className="relative h-48 cursor-grab active:cursor-grabbing">
                  <model-viewer
                    src={selectedItem.modelUrl}
                    auto-rotate
                    camera-controls
                    style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                  />
                  <div className="absolute bottom-2 right-2">
                    <span className="badge badge-success text-[9px]">● LIVE</span>
                  </div>
                </div>
              ) : (
                <div className="h-28 flex flex-col items-center justify-center text-center">
                  <Box size={20} className="text-slate-700 mb-2" />
                  <p className="text-[10px] text-slate-600">No geometry attached</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-ghost mt-1.5 text-[10px] text-brand gap-1"
                  >
                    <Upload size={9} /> Upload .GLB / .GLTF
                  </button>
                </div>
              )}
            </div>
            <input type="file" accept=".glb,.gltf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          </div>
        )}

        {/* 3D Position */}
        <div className="panel-body">
          <p className="text-section-header mb-2 flex items-center gap-1.5"><MapPin size={10} /> 3D Position</p>
          <div className="rounded-lg px-3 py-2 font-mono text-xs text-slate-400"
            style={{ background: 'var(--surface-inset)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {coords}
          </div>
        </div>

        {/* Active Connections */}
        {isNode && connections.length > 0 && (
          <div className="panel-body">
            <p className="text-section-header mb-2.5">
              Active Connections ({connections.length})
            </p>
            <div className="space-y-1.5">
              {connections.map((w: any) => (
                <div
                  key={w.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-100"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: w.wire_color?.toLowerCase() || '#3B9EFF' }} />
                  <code className="text-[11px] text-slate-300 flex-1 truncate font-mono">
                    {w.source === selectedItem.id ? w.target : w.source}
                  </code>
                  <span className="badge badge-neutral text-[9px]">{w.label || w.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Parameters */}
        {displayProps.length > 0 && (
          <div className="panel-body">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-section-header flex items-center gap-1.5">
                <Database size={10} /> Parameters
              </span>
              <button
                className="btn-ghost p-1 text-slate-600 hover:text-slate-400"
                title="Copy all"
                onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedItem, null, 2))}
              >
                <Clipboard size={11} />
              </button>
            </div>
            <dl className="space-y-0.5">
              {displayProps.map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-start gap-4 py-1.5 px-2.5 rounded-md
                             hover:bg-white/[0.03] transition-colors group cursor-default"
                >
                  <dt className="text-[11px] text-slate-600 group-hover:text-slate-500 shrink-0 font-medium">{key}</dt>
                  <dd className="font-mono text-[11px] text-slate-400 text-right break-all">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button className="btn-primary w-full">
          Edit Parameters
        </button>
      </div>
    </div>
  );
};