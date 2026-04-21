import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileJson, FileSpreadsheet, CheckCircle2, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';

type Format = 'json' | 'csv';

export const ExportPanel: React.FC = () => {
  const { data } = useStore();
  const [selectedFormat, setSelectedFormat] = useState<Format>('json');
  const [exported, setExported] = useState<Format | null>(null);

  if (!data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
        style={{ background: 'var(--surface)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Download size={20} className="text-slate-700" />
        </div>
        <p className="text-sm font-semibold text-slate-500">No data to export</p>
        <p className="text-xs text-slate-600 mt-1 max-w-[180px] leading-relaxed">
          Upload and analyze a harness diagram first.
        </p>
      </div>
    );
  }

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'aether_netlist.json';
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
    setExported('json');
    setTimeout(() => setExported(null), 2500);
  };

  const handleDownloadCSV = () => {
    const wires = data.connections || data.wires || [];
    if (wires.length === 0) { alert('No connections found to export.'); return; }
    let csv = 'Source Node,Target Node,Wire Color/Label\n';
    wires.forEach((w: any) => {
      csv += `"${w.source || 'UNKNOWN'}","${w.target || 'UNKNOWN'}","${w.wire_color || w.label || 'N/A'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'aether_netlist.csv';
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
    setExported('csv');
    setTimeout(() => setExported(null), 2500);
  };

  const formats: { id: Format; label: string; desc: string; icon: React.ReactNode; action: () => void }[] = [
    {
      id: 'json', label: 'JSON Export', desc: 'Full raw data — netlist, nodes, coordinates',
      icon: <FileJson size={18} />, action: handleDownloadJSON,
    },
    {
      id: 'csv', label: 'CSV Export', desc: 'Connection table — import to Excel / CAD',
      icon: <FileSpreadsheet size={18} />, action: handleDownloadCSV,
    },
  ];

  const nodes = data.nodes || data.connectors || [];
  const wires = data.connections || data.wires || [];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: 'var(--surface)' }}>

      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.20)', color: '#A78BFA' }}>
            <Sparkles size={14} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-200 font-display">Export Netlist</h2>
            <p className="text-[10px] text-slate-600">Download the extracted harness data</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-2 gap-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="rounded-xl p-3 text-center"
          style={{ background: 'rgba(59,158,255,0.06)', border: '1px solid rgba(59,158,255,0.12)' }}>
          <p className="text-lg font-bold font-mono" style={{ color: '#3B9EFF' }}>{nodes.length}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Components</p>
        </div>
        <div className="rounded-xl p-3 text-center"
          style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.12)' }}>
          <p className="text-lg font-bold font-mono" style={{ color: '#00E5A0' }}>{wires.length}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Connections</p>
        </div>
      </div>

      {/* Format selector */}
      <div className="p-4 space-y-2 flex-1">
        <p className="text-section-header mb-3">Select Format</p>
        {formats.map(fmt => {
          const isSelected = selectedFormat === fmt.id;
          const isDone     = exported === fmt.id;
          return (
            <button
              key={fmt.id}
              onClick={() => setSelectedFormat(fmt.id)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-150"
              style={isSelected
                ? { background: 'rgba(59,158,255,0.08)', border: '1px solid rgba(59,158,255,0.25)',
                    boxShadow: '0 0 12px rgba(59,158,255,0.08)' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }
              }
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={isSelected
                  ? { background: 'rgba(59,158,255,0.15)', color: '#3B9EFF' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#475569' }
                }>
                {isDone ? <CheckCircle2 size={18} style={{ color: '#00E5A0' }} /> : fmt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${isSelected ? 'text-slate-100' : 'text-slate-400'}`}>
                  {fmt.label}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">{fmt.desc}</p>
              </div>
              {isSelected && (
                <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                  style={{ background: '#3B9EFF' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Export CTA */}
      <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={formats.find(f => f.id === selectedFormat)?.action}
          className="btn-primary w-full gap-2"
        >
          <Download size={14} />
          Download {selectedFormat.toUpperCase()} File
        </motion.button>
        <p className="text-[10px] text-slate-600 text-center mt-2">
          Exported files are ready for CAD / Digital Twin import
        </p>
      </div>
    </div>
  );
};