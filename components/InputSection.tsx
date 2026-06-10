import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Upload, Activity } from 'lucide-react';

interface InputSectionProps {
  mode: 'training' | 'estimating';
  rawData: string;
  stockName: string;
  sector: string;
  onDataChange: (text: string) => void;
  onStockNameChange: (text: string) => void;
  onSectorChange: (text: string) => void;
  onAnalyze: () => void;
  onBulkUpload: (file: File) => void;
  onBulkDownload: () => void;
  existingSectors: string[];
  isLoading: boolean;
  isValid: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  mode, rawData, stockName, sector,
  onDataChange, onStockNameChange, onSectorChange,
  onAnalyze, onBulkUpload, onBulkDownload,
  existingSectors, isLoading, isValid 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onBulkUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-dark-card rounded-2xl border border-dark-border p-6 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/25 to-transparent" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/10 shadow-inner">
                <Activity size={18} />
            </div>
            <h3 className="text-sm font-display font-medium text-white uppercase tracking-wider">
                {mode === 'training' ? 'Training Parameters' : 'Analysis Inputs'}
            </h3>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => fileInputRef.current?.click()}
                title="Upload Data (.txt) or Load Knowledge Base (.json)"
                className="p-2 bg-dark-bg hover:bg-[#111] text-dark-muted hover:text-brand-400 rounded-lg transition-colors border border-dark-border"
            >
                <Upload size={16} />
            </button>
            <button 
                onClick={onBulkDownload}
                title="Save Knowledge Base (JSON)"
                className="p-2 bg-dark-bg hover:bg-[#111] text-dark-muted hover:text-brand-400 rounded-lg transition-colors border border-dark-border"
            >
                <Download size={16} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.json" onChange={handleFileChange} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium text-dark-muted uppercase tracking-wider">Stock Name</label>
          <input 
            type="text"
            className="w-full px-3 py-2.5 bg-[#050505] border border-dark-border rounded-xl text-xs text-brand-300 focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500 outline-none transition-all placeholder-[#333]"
            placeholder="e.g. TCS"
            value={stockName}
            onChange={(e) => onStockNameChange(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium text-dark-muted uppercase tracking-wider">Sector</label>
          <input 
            type="text"
            list="sectors-list"
            className="w-full px-3 py-2.5 bg-[#050505] border border-dark-border rounded-xl text-xs text-brand-300 focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500 outline-none transition-all placeholder-[#333]"
            placeholder="e.g. IT"
            value={sector}
            onChange={(e) => onSectorChange(e.target.value)}
          />
          <datalist id="sectors-list">
              {existingSectors.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <label className="block text-[10px] font-medium text-dark-muted uppercase tracking-wider flex justify-between">
            <span>Fundamental Data</span>
            <span className="font-normal text-brand-500/50 normal-case">Column Detection Active</span>
        </label>
        <div className="relative group">
            <textarea
            className="w-full h-72 p-4 border border-dark-border rounded-xl text-xs leading-relaxed font-mono focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500 bg-[#050505] text-[#a3a3a3] outline-none transition-all resize-none custom-scrollbar"
            placeholder={`Paste Table Data Here...`}
            value={rawData}
            onChange={(e) => onDataChange(e.target.value)}
            spellCheck={false}
            />
        </div>
      </div>

      <button
        onClick={onAnalyze}
        disabled={isLoading || !isValid || (!stockName || !sector)}
        className={`w-full py-3.5 px-4 rounded-xl font-medium text-white transform active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2.5
          ${isLoading || !isValid || (!stockName || !sector)
            ? 'bg-[#111] cursor-not-allowed text-dark-muted border border-dark-border' 
            : 'bg-brand-600 hover:bg-brand-500 shadow-[0_4px_20px_rgba(20,184,166,0.3)]'
          }`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
            <span className="text-xs uppercase tracking-wider font-semibold">Learning Patterns...</span>
          </>
        ) : (
          <>
             <span className="text-xs uppercase tracking-wider font-semibold">{mode === 'training' ? 'Train Model' : 'Analyze & Estimate'}</span>
             <Activity size={14} className="opacity-80" />
          </>
        )}
      </button>
    </motion.div>
  );
};