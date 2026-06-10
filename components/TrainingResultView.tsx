import React from 'react';
import { TrainingResult } from '../types';
import { formatCurrency } from '../utils/dataParser';
import { motion } from 'motion/react';
import { CheckCircle, BrainCircuit } from 'lucide-react';

interface Props {
  result: TrainingResult;
}

export const TrainingResultView: React.FC<Props> = ({ result }) => {
  const getDiff = (actual: number, predicted: number) => {
    const diff = ((predicted - actual) / actual) * 100;
    return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
  };

  const scoreColor = result.accuracyScore > 85 ? 'text-teal-400' : result.accuracyScore > 70 ? 'text-amber-400' : 'text-red-400';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-dark-card rounded-2xl border border-dark-border overflow-hidden"
    >
      <div className="p-6 border-b border-brand-900/30 bg-brand-950/20">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-900/30 rounded-xl text-brand-500 border border-brand-500/20">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-display font-medium text-white">Validation Successful</h3>
                    <p className="text-[11px] font-medium text-dark-muted mt-0.5 uppercase tracking-wide">
                        {result.stockName} <span className="text-[#333] mx-1">|</span> {result.sector}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <div className="text-[10px] uppercase text-dark-muted font-medium tracking-widest mb-1">Model Accuracy</div>
                <div className={`text-4xl font-display font-semibold ${scoreColor}`}>{result.accuracyScore}%</div>
            </div>
        </div>
      </div>
      
      <div className="p-8 space-y-8">
        
        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
            <h4 className="text-[11px] font-medium text-dark-muted uppercase tracking-widest mb-4">Backtesting Results ({result.predictedYear})</h4>
            <div className="overflow-hidden border border-dark-border rounded-xl">
                <table className="min-w-full divide-y divide-dark-border">
                    <thead className="bg-[#080808]">
                        <tr>
                            <th className="px-6 py-3 text-left text-[11px] font-medium text-dark-muted uppercase tracking-wider">Metric</th>
                            <th className="px-6 py-3 text-right text-[11px] font-medium text-dark-muted uppercase tracking-wider">AI Predicted</th>
                            <th className="px-6 py-3 text-right text-[11px] font-medium text-brand-500 uppercase tracking-wider bg-brand-900/10">Actual</th>
                            <th className="px-6 py-3 text-right text-[11px] font-medium text-dark-muted uppercase tracking-wider">Deviation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border bg-dark-card text-sm">
                        <tr>
                            <td className="px-6 py-4 font-medium text-slate-300">Sales</td>
                            <td className="px-6 py-4 text-right font-mono text-slate-400">{formatCurrency(result.predictedData.sales)}</td>
                            <td className="px-6 py-4 text-right font-mono font-medium bg-brand-900/10 text-brand-400">{formatCurrency(result.actualData.sales)}</td>
                            <td className="px-6 py-4 text-right font-mono text-dark-muted">{getDiff(result.actualData.sales, result.predictedData.sales)}</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 font-medium text-slate-300">Op. Profit</td>
                            <td className="px-6 py-4 text-right font-mono text-slate-400">{formatCurrency(result.predictedData.operatingProfit)}</td>
                            <td className="px-6 py-4 text-right font-mono font-medium bg-brand-900/10 text-brand-400">{formatCurrency(result.actualData.operatingProfit)}</td>
                            <td className="px-6 py-4 text-right font-mono text-dark-muted">{getDiff(result.actualData.operatingProfit, result.predictedData.operatingProfit)}</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 font-medium text-slate-300">Net Profit</td>
                            <td className="px-6 py-4 text-right font-mono text-slate-400">{formatCurrency(result.predictedData.netProfit)}</td>
                            <td className="px-6 py-4 text-right font-mono font-medium bg-brand-900/10 text-brand-400">{formatCurrency(result.actualData.netProfit)}</td>
                            <td className="px-6 py-4 text-right font-mono text-dark-muted">{getDiff(result.actualData.netProfit, result.predictedData.netProfit)}</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 font-medium text-slate-300">EPS</td>
                            <td className="px-6 py-4 text-right font-mono text-slate-400">{result.predictedData.eps.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-mono font-medium bg-brand-900/10 text-brand-400">{result.actualData.eps.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-mono text-dark-muted">{getDiff(result.actualData.eps, result.predictedData.eps)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </motion.div>

        {/* Insight Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[#080808] border border-dark-border p-6 rounded-2xl text-white"
        >
            <h4 className="flex items-center gap-2 text-[11px] font-medium text-brand-400 uppercase tracking-widest mb-3">
                <BrainCircuit size={16} />
                New Pattern Assimilated
            </h4>
            <p className="text-lg font-medium leading-relaxed text-slate-100">
                "{result.learning}"
            </p>
            <div className="mt-4 pt-4 border-t border-dark-border flex gap-3">
                <span className="text-dark-muted font-medium text-sm shrink-0">Logic:</span>
                <p className="text-slate-300 text-sm opacity-90 leading-relaxed">
                   {result.rationale}
                </p>
            </div>
        </motion.div>

      </div>
    </motion.div>
  );
};