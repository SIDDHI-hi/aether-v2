import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Connector, Wire } from '../../mockData';

export const FaultHeatMapPanel: React.FC = () => {
  const { data } = useStore();

  const getRiskColor = (score: string) => {
    switch(score) {
      case 'high': return 'text-neon-red bg-neon-red/10 border-neon-red/20';
      case 'medium': return 'text-neon-amber bg-neon-amber/10 border-neon-amber/20';
      case 'low': return 'text-neon-green bg-neon-green/10 border-neon-green/20';
      default: return 'text-gray-400 bg-gray-800 border-gray-700';
    }
  };

  const allItems = [
    ...data.connectors.map((c: Connector) => ({ id: c.id, label: c.label, type: 'Connector', risk: data.risk_score[c.id] })),
    ...data.wires.map((w: Wire) => ({ id: w.id, label: w.label, type: 'Wire', risk: data.risk_score[w.id] }))
  ].sort((a, b) => {
    const riskWeight = { high: 3, medium: 2, low: 1 };
    return (riskWeight[b.risk as keyof typeof riskWeight] || 0) - (riskWeight[a.risk as keyof typeof riskWeight] || 0);
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-4 right-4 w-96 glass-panel rounded-xl p-5 shadow-2xl z-30 flex flex-col max-h-[70vh]"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-neon-red/10 rounded-lg">
          <AlertTriangle className="text-neon-red" size={20} />
        </div>
        <div>
          <h3 className="text-gray-200 font-semibold tracking-wide">Hazard Report</h3>
          <p className="text-xs text-neon-red animate-pulse">Live scanning active</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="space-y-2">
          {allItems.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center justify-between p-3 rounded-lg border ${getRiskColor(item.risk)}`}
            >
              <div>
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs opacity-80">{item.type} • {item.id}</p>
              </div>
              <div className="uppercase text-[10px] font-bold tracking-widest px-2 py-1 rounded-sm bg-black/20">
                {item.risk}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
