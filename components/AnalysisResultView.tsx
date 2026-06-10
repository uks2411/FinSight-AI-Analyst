import React from 'react';
import { AnalysisResult } from '../types';
import { motion } from 'motion/react';
import { FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  result: AnalysisResult;
}

export const AnalysisResultView: React.FC<Props> = ({ result }) => {
  const sentimentColor = 
    result.overallSentiment === 'Bullish' ? 'bg-brand-500/10 text-brand-400 border-brand-500/30' :
    result.overallSentiment === 'Bearish' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
    'bg-[#1a1a1a] text-dark-muted border-dark-border';

  const SentimentIcon = 
    result.overallSentiment === 'Bullish' ? TrendingUp :
    result.overallSentiment === 'Bearish' ? TrendingDown :
    Minus;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-dark-card rounded-2xl border border-dark-border overflow-hidden"
    >
      <div className="p-6 border-b border-dark-border flex justify-between items-center bg-dark-card">
        <h3 className="text-xl font-display font-medium text-white flex items-center gap-3">
          <div className="p-2 bg-[#111] rounded-lg text-brand-500">
            <FileText size={20} />
          </div>
          AI Analyst Report
        </h3>
        <span className={`px-4 py-1.5 rounded-full text-xs font-medium border flex items-center gap-2 ${sentimentColor}`}>
          <SentimentIcon size={14} />
          {result.overallSentiment} Outlook
        </span>
      </div>
      
      <div className="p-8 space-y-8">
        
        {/* Forecast Rationale */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h4 className="text-[11px] font-medium text-dark-muted uppercase tracking-widest mb-4">Executive Summary</h4>
          <div className="bg-[#050505] border border-dark-border rounded-xl p-6 text-slate-300 leading-relaxed text-sm">
            {result.forecast.rationale}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Key Patterns */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-dark-card rounded-xl border border-dark-border p-6"
            >
                <h4 className="text-[11px] font-medium text-dark-muted uppercase tracking-widest mb-4">Identified Growth Drivers</h4>
                <ul className="space-y-4">
                    {result.keyPatterns.map((pattern, i) => (
                    <li key={i} className="flex items-start gap-4 text-slate-300 text-sm group">
                        <span className="mt-0.5 flex-shrink-0 w-6 h-6 bg-brand-500/10 text-brand-500 rounded-full flex items-center justify-center text-xs font-mono border border-brand-500/20 group-hover:bg-brand-500 group-hover:text-black transition-colors">
                        {i + 1}
                        </span>
                        <span className="leading-snug">{pattern}</span>
                    </li>
                    ))}
                </ul>
            </motion.div>

            {/* Sector Context */}
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-dark-card rounded-xl border border-dark-border p-6"
            >
                <h4 className="text-[11px] font-medium text-dark-muted uppercase tracking-widest mb-4">Sector Intelligence</h4>
                <div className="prose prose-sm text-[#a3a3a3] leading-relaxed">
                    <p>{result.sectorComparison}</p>
                </div>
            </motion.div>
        </div>

      </div>
    </motion.div>
  );
};