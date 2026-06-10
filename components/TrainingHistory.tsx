import React, { useState } from 'react';
import { LearnedPattern } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Database } from 'lucide-react';

interface Props {
  patterns: LearnedPattern[];
  metaInsights?: string[];
  onSelectPattern: (pattern: LearnedPattern) => void;
  selectedId?: string;
}

export const TrainingHistory: React.FC<Props> = ({ patterns, metaInsights = [], onSelectPattern, selectedId }) => {
  const [isStrategiesOpen, setIsStrategiesOpen] = useState(false);

  if (patterns.length === 0) return null;

  const averageAccuracy = Math.round(
    patterns.reduce((acc, curr) => acc + curr.accuracyScore, 0) / patterns.length
  );

  const groupedPatterns = patterns.reduce((acc, pattern) => {
    const sector = pattern.sector || 'Uncategorized';
    if (!acc[sector]) acc[sector] = [];
    acc[sector].push(pattern);
    return acc;
  }, {} as Record<string, LearnedPattern[]>);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="bg-gradient-to-r from-brand-900/40 to-dark-card rounded-2xl p-8 text-white border border-brand-900/50 flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-display font-medium text-white flex items-center gap-2">
            <Database size={20} className="text-brand-400" />
            Continuous Knowledge Store
          </h3>
          <p className="text-brand-100/70 text-sm mt-2 flex items-center gap-2 font-mono">
            <span>{patterns.length} patterns stored.</span>
          </p>
        </div>
        <div className="relative z-10 text-right">
          <div className="text-[11px] font-medium text-brand-300 uppercase tracking-widest mb-1">Avg. Accuracy</div>
          <div className={`text-5xl font-display font-semibold ${averageAccuracy > 80 ? 'text-brand-400' : 'text-amber-400'}`}>
            {averageAccuracy}%
          </div>
        </div>
      </div>

      {metaInsights.length > 0 && (
        <div className="bg-brand-950/30 border border-brand-500/20 rounded-2xl overflow-hidden transition-all duration-300">
             <button 
                onClick={() => setIsStrategiesOpen(!isStrategiesOpen)}
                className="w-full flex items-center justify-between p-6 bg-brand-950/50 hover:bg-brand-900/50 transition-colors group"
             >
                 <div className="flex items-center gap-3">
                     <div className="w-1.5 h-8 bg-brand-500 rounded-full group-hover:h-10 transition-all"></div>
                     <div className="text-left">
                        <h4 className="text-[11px] font-medium text-brand-400 uppercase tracking-widest">
                            Active Master Strategies
                        </h4>
                        <p className="text-xs text-brand-500/60 font-mono mt-1">Applied to all {patterns.length} stocks</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-3">
                     <span className="px-3 py-1 bg-brand-500/20 rounded-full text-[11px] font-medium text-brand-400 border border-brand-500/20">
                        {metaInsights.length} Active
                     </span>
                     <div className={`p-1 rounded-full bg-[#050505] border border-dark-border transition-transform duration-300 ${isStrategiesOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown size={16} className="text-brand-500" />
                     </div>
                 </div>
             </button>
             
             <AnimatePresence>
               {isStrategiesOpen && (
                   <motion.div 
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: 'auto', opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="overflow-hidden"
                   >
                     <div className="p-6 pt-0 grid gap-3">
                        <div className="h-px bg-brand-500/20 w-full mb-4"></div>
                        {metaInsights.map((insight, idx) => (
                            <div key={idx} className="bg-[#050505] p-4 rounded-xl border border-brand-500/10 text-brand-100 text-sm leading-relaxed flex gap-3 hover:border-brand-500/30 transition-colors">
                                <span className="text-brand-500/50 font-mono text-xs mt-0.5 shrink-0">0{idx + 1}</span>
                                <span>{insight}</span>
                            </div>
                        ))}
                     </div>
                   </motion.div>
               )}
             </AnimatePresence>
        </div>
      )}

      <div className="space-y-8">
        {Object.keys(groupedPatterns).map((sector) => {
            const items = groupedPatterns[sector];
            return (
            <div key={sector} className="space-y-4">
                 <h3 className="text-lg font-display font-medium text-brand-400 flex items-center gap-2 px-1">
                    <span className="w-1.5 h-6 bg-brand-600 rounded-full"></span>
                    {sector}
                    <span className="text-xs text-dark-muted font-mono bg-[#050505] border border-dark-border px-2 py-0.5 rounded-full ml-2">{items.length}</span>
                </h3>
                
                <div className="flex gap-4 overflow-x-auto pb-6 px-1 custom-scrollbar">
                    {items.map((item) => (
                        <motion.div 
                            whileHover={{ y: -4 }}
                            key={item.id}
                            onClick={() => onSelectPattern(item)}
                            className={`
                                flex-shrink-0 w-52 p-5 rounded-2xl border cursor-pointer transition-colors group
                                ${selectedId === item.id 
                                    ? 'bg-brand-900/20 border-brand-500 shadow-[0_0_20px_rgba(20,184,166,0.15)]' 
                                    : 'bg-dark-card border-dark-border hover:border-brand-500/30 hover:bg-[#111]'
                                }
                            `}
                        >
                            <div className="flex flex-col h-full justify-between gap-4">
                                <div>
                                    <div className="font-medium text-slate-200 text-lg leading-tight truncate font-display" title={item.stockName}>
                                        {item.stockName}
                                    </div>
                                    <div className="text-[10px] text-dark-muted font-mono mt-1">
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-dark-border group-hover:border-[#333] transition-colors flex items-end justify-between">
                                    <div className="text-[10px] font-medium text-dark-muted uppercase tracking-wider mb-1">Accuracy</div>
                                    <div className={`text-2xl font-display font-semibold tracking-tight ${item.accuracyScore > 80 ? 'text-brand-400' : item.accuracyScore > 60 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {item.accuracyScore}%
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        )})}
      </div>
    </motion.div>
  );
};