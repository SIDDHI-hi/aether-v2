import React from 'react';
import { motion } from 'framer-motion';
import { Network, Plus, Minus, FileEdit } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const DiffEnginePanel: React.FC = () => {
  const { data } = useStore();

  const stats = {
    added: Object.values(data.diff_state).filter(s => s === 'added').length,
    removed: Object.values(data.diff_state).filter(s => s === 'removed').length,
    modified: Object.values(data.diff_state).filter(s => s === 'modified').length,
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-4 right-4 w-80 glass-panel rounded-xl p-5 shadow-2xl z-30"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-neon-amber/10 rounded-lg">
          <Network className="text-neon-amber" size={20} />
        </div>
        <div>
          <h3 className="text-gray-200 font-semibold tracking-wide">Diff Engine</h3>
          <p className="text-xs text-neon-amber animate-pulse">Comparing baseline v1.2</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg border border-neon-green/20">
          <div className="flex items-center gap-2 text-neon-green">
            <Plus size={16} />
            <span className="text-sm font-medium">Added</span>
          </div>
          <span className="font-mono text-neon-green">{stats.added}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg border border-neon-red/20">
          <div className="flex items-center gap-2 text-neon-red">
            <Minus size={16} />
            <span className="text-sm font-medium">Removed</span>
          </div>
          <span className="font-mono text-neon-red">{stats.removed}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg border border-neon-amber/20">
          <div className="flex items-center gap-2 text-neon-amber">
            <FileEdit size={16} />
            <span className="text-sm font-medium">Modified</span>
          </div>
          <span className="font-mono text-neon-amber">{stats.modified}</span>
        </div>
      </div>
    </motion.div>
  );
};
