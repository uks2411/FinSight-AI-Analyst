import React, { useState, useMemo } from 'react';
import { LearnedPattern } from '../types';
import { 
  Trash2, Search, Filter, Database, Calendar, Tag, 
  TrendingUp, BarChart2, ChevronRight, BrainCircuit, AlertTriangle, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TrainingResultView } from './TrainingResultView';
import { Dashboard } from './Dashboard';

interface DataViewProps {
  patterns: LearnedPattern[];
  onDeletePattern: (id: string) => void;
  metaInsights?: string[];
  onDeleteMetaInsight?: (index: number) => void;
}

export const DataView: React.FC<DataViewProps> = ({ 
  patterns, 
  onDeletePattern,
  metaInsights = [],
  onDeleteMetaInsight = () => {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'accuracy-desc' | 'accuracy-asc' | 'name-asc'>('date-desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'insights' | 'charts'>('insights');

  // Find selected stock details
  const selectedStock = useMemo(() => {
    return patterns.find(p => p.id === selectedId) || null;
  }, [patterns, selectedId]);

  // Extract unique sectors for dropdown filter
  const sectors = useMemo(() => {
    const list = new Set(patterns.map(p => p.sector));
    return ['ALL', ...Array.from(list)];
  }, [patterns]);

  // Filter & Sort
  const processedPatterns = useMemo(() => {
    let result = patterns.filter(p => {
      const matchSearch = p.stockName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.insight.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSector = selectedSector === 'ALL' || p.sector === selectedSector;
      return matchSearch && matchSector;
    });

    result.sort((a, b) => {
      if (sortBy === 'date-desc') return b.timestamp - a.timestamp;
      if (sortBy === 'date-asc') return a.timestamp - b.timestamp;
      if (sortBy === 'accuracy-desc') return b.accuracyScore - a.accuracyScore;
      if (sortBy === 'accuracy-asc') return a.accuracyScore - b.accuracyScore;
      if (sortBy === 'name-asc') return a.stockName.localeCompare(b.stockName);
      return 0;
    });

    return result;
  }, [patterns, searchTerm, selectedSector, sortBy]);

  // Handle single item deletion
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeletePattern(id);
    if (selectedId === id) {
      setSelectedId(null);
    }
    setConfirmDeleteId(null);
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      {/* Overview stats header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-card border border-dark-border p-6 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="text-[11px] font-medium text-dark-muted uppercase tracking-widest">Total Uploaded Stocks</h4>
            <p className="text-3xl font-display font-semibold text-white mt-2">{patterns.length}</p>
          </div>
          <div className="bg-brand-500/10 text-brand-400 p-3 rounded-xl border border-brand-500/15">
            <Database size={24} />
          </div>
        </div>
        
        <div className="bg-dark-card border border-dark-border p-6 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="text-[11px] font-medium text-dark-muted uppercase tracking-widest">Sectors Tracked</h4>
            <p className="text-3xl font-display font-semibold text-teal-400 mt-2">
              {sectors.filter(s => s !== 'ALL').length}
            </p>
          </div>
          <div className="bg-teal-500/10 text-teal-400 p-3 rounded-xl border border-teal-500/15">
            <Tag size={24} />
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border p-6 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="text-[11px] font-medium text-dark-muted uppercase tracking-widest">Avg. Forecasting Accuracy</h4>
            <p className="text-3xl font-display font-semibold text-amber-500 mt-2">
              {patterns.length > 0 
                ? `${Math.round(patterns.reduce((sum, p) => sum + p.accuracyScore, 0) / patterns.length)}%` 
                : 'N/A'}
            </p>
          </div>
          <div className="bg-amber-500/10 text-amber-400 p-3 rounded-xl border border-amber-500/15">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Master Strategies Database Section */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-dark-border pb-4">
          <div>
            <h3 className="font-display font-medium text-white flex items-center gap-2 text-sm uppercase tracking-wider">
              <BrainCircuit className="text-brand-400" size={16} />
              Master Strategies Database
            </h3>
            <p className="text-xs text-dark-muted mt-0.5">Systemic rules of thumb synthesized from your entire multi-stock portfolio.</p>
          </div>
          <span className="text-xs font-mono bg-dark-bg px-2.5 py-1 rounded-full border border-dark-border text-brand-400">
            {metaInsights.length} strategies
          </span>
        </div>

        {metaInsights.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-dark-border rounded-xl flex flex-col items-center justify-center p-6 bg-[#050505]/40 animate-in fade-in duration-300">
            <p className="text-xs text-slate-400">No systemic master strategies synthesized yet.</p>
            <p className="text-[10px] text-dark-muted mt-1">Cross-examine patterns by training at least 2 different stocks, then click "Learn Meta-Patterns" in the main interface.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {metaInsights.map((insight, index) => (
                <motion.div
                  key={index}
                  layoutId={`meta-${index}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#050505] p-4 rounded-xl border border-brand-500/10 text-brand-100 text-xs leading-relaxed flex justify-between gap-4 group hover:border-brand-500/25 hover:bg-[#0c0c0c] transition-all"
                >
                  <div className="flex gap-3">
                    <span className="text-brand-500/50 font-mono text-xs shrink-0 select-none">0{index + 1}</span>
                    <span className="text-slate-300">{insight}</span>
                  </div>
                  <button
                    onClick={() => onDeleteMetaInsight(index)}
                    className="self-start text-dark-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                    title="Delete strategy"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Directory of Stored Stocks */}
        <div className={`space-y-4 ${selectedStock ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border pb-4">
              <h3 className="font-display font-medium text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                Stocks Index
              </h3>
              <span className="text-xs font-mono bg-dark-bg px-2.5 py-1 rounded-full border border-dark-border text-brand-400">
                {processedPatterns.length} listed
              </span>
            </div>

            {/* Filters */}
            <div className={`grid gap-3 ${selectedStock ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-muted" />
                <input
                  type="text"
                  placeholder="Search stock metrics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#050505] border border-dark-border rounded-xl text-xs text-brand-300 focus:ring-1 focus:ring-brand-500 outline-none transition-all placeholder-[#333]"
                />
              </div>

              {/* Sector Filter */}
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-[#050505] border border-dark-border rounded-xl text-xs text-slate-300 outline-none focus:ring-1 focus:ring-brand-500 appearance-none"
                >
                  {sectors.map(sec => (
                    <option key={sec} value={sec}>{sec === 'ALL' ? 'All Sectors' : sec}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-dark-muted">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>

              {/* Sorting */}
              <div className="relative">
                <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full pl-8 pr-4 py-2.5 bg-[#050505] border border-dark-border rounded-xl text-xs text-slate-300 outline-none focus:ring-1 focus:ring-brand-500 appearance-none"
                >
                  <option value="date-desc">Newest Added</option>
                  <option value="date-asc">Oldest Added</option>
                  <option value="accuracy-desc">Accuracy (High → Low)</option>
                  <option value="accuracy-asc">Accuracy (Low → High)</option>
                  <option value="name-asc">Alphabetical (A → Z)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-dark-muted">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>
            </div>

            {/* List/Grid of Cards */}
            <div className={`mt-2 ${selectedStock ? 'max-h-[600px] overflow-y-auto pr-1 space-y-3 custom-scrollbar' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
              <AnimatePresence mode="popLayout">
                {processedPatterns.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="col-span-full py-16 text-center border border-dashed border-dark-border rounded-2xl flex flex-col items-center justify-center p-6"
                  >
                    <Database size={40} className="text-[#222] mb-4" />
                    <h4 className="text-sm font-medium text-slate-300">No database records found</h4>
                    <p className="text-xs text-dark-muted mt-1 max-w-xs mx-auto">
                      There are no stored stocks matching your search filters. Train high-fidelity models inside the main workspace to save listings.
                    </p>
                  </motion.div>
                ) : (
                  processedPatterns.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => setSelectedId(item.id)}
                      className={`
                        p-5 rounded-2xl border cursor-pointer relative group flex flex-col justify-between overflow-hidden transition-all
                        ${selectedId === item.id 
                          ? 'bg-brand-900/10 border-brand-500 shadow-[0_0_25px_rgba(20,184,166,0.1)] ring-1 ring-brand-500/20' 
                          : 'bg-dark-card border-dark-border hover:border-brand-500/20 hover:bg-[#111]'
                        }
                      `}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0 flex-1">
                            {/* Stock Name */}
                            <h4 className="text-lg font-display font-semibold text-white leading-tight truncate" title={item.stockName}>
                              {item.stockName}
                            </h4>
                            {/* Year Range (BELOW IT) */}
                            <div className="flex items-center gap-1.5 text-xs text-dark-muted font-mono mt-1">
                              <Calendar size={12} className="text-dark-muted/80" />
                              <span>{item.yearRange}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Sector Badge */}
                            <span className="text-[10px] font-medium bg-dark-bg border border-dark-border text-dark-muted px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                              {item.sector}
                            </span>
                          </div>
                        </div>

                        {/* Pattern insight preview (visible if on full grid) */}
                        {!selectedStock && (
                          <div className="bg-[#050505] p-3 rounded-xl border border-dark-border text-[11px] leading-relaxed text-slate-400 line-clamp-2 h-11 italic">
                            "{item.insight}"
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-dark-border flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-dark-muted uppercase font-medium">Model Match:</span>
                          <span className={`text-sm font-mono font-bold ${item.accuracyScore > 85 ? 'text-teal-400' : 'text-amber-400'}`}>
                            {item.accuracyScore}%
                          </span>
                        </div>

                        {/* Delete controls */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1 bg-red-950/80 border border-red-500/30 rounded-lg p-0.5 animate-in fade-in zoom-in-95 duration-200">
                              <button 
                                onClick={(e) => handleDelete(item.id, e)}
                                className="text-[9px] font-bold text-red-400 hover:text-white bg-red-500/20 px-2.5 py-1 rounded-md transition-colors"
                              >
                                Delete
                              </button>
                              <button 
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[9px] font-medium text-dark-muted hover:text-white px-2 py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(item.id);
                              }}
                              className="p-1.5 rounded-lg text-dark-muted hover:text-red-400 hover:bg-red-500/10 transition-all border border-dark-border opacity-60 hover:opacity-100 group/btn"
                              title="Delete stock data"
                            >
                              <Trash2 size={13} className="transition-transform group-hover/btn:scale-110" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed analysis & full storage report */}
        {selectedStock && (
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-dark-border pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-semibold text-brand-400 bg-brand-500/10 border border-brand-500/15 px-2.5 py-1 rounded uppercase tracking-wider">
                      Database Records
                    </span>
                    <span className="text-xs font-mono text-dark-muted">Added {new Date(selectedStock.timestamp).toLocaleDateString()}</span>
                  </div>
                  <h2 className="text-2xl font-display font-semibold text-white mt-1.5">{selectedStock.stockName}</h2>
                  <p className="text-xs text-dark-muted mt-0.5">Tracked financial history and validation models for EV / automotive development.</p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="bg-dark-bg border border-dark-border p-1 rounded-xl flex">
                    <button 
                      onClick={() => setActiveSubTab('insights')} 
                      className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeSubTab === 'insights' ? 'bg-brand-600 text-white shadow-md' : 'text-dark-muted hover:text-white'}`}
                    >
                      <BrainCircuit size={13} />
                      AI Insights
                    </button>
                    <button 
                      onClick={() => setActiveSubTab('charts')} 
                      className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeSubTab === 'charts' ? 'bg-brand-600 text-white shadow-md' : 'text-dark-muted hover:text-white'}`}
                    >
                      <BarChart2 size={13} />
                      Statements & Charts
                    </button>
                  </div>
                  
                  {/* Close button */}
                  <button 
                    onClick={() => setSelectedId(null)} 
                    className="p-2 border border-dark-border rounded-xl text-dark-muted hover:text-white hover:bg-dark-bg transition-colors ml-1"
                    title="Close Inspect Panel"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Sub-tab Rendering */}
              <div>
                {activeSubTab === 'insights' && (
                  <div className="space-y-6">
                    {selectedStock.fullTrainingResult ? (
                      <TrainingResultView result={selectedStock.fullTrainingResult} />
                    ) : (
                      <div className="bg-[#080808] border border-dark-border p-6 rounded-2xl text-white">
                        <h4 className="flex items-center gap-2 text-[11px] font-medium text-brand-400 uppercase tracking-widest mb-3">
                          Assimilated Pattern
                        </h4>
                        <p className="text-lg font-medium leading-relaxed text-slate-100">
                          "{selectedStock.insight}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === 'charts' && (
                  <div className="space-y-6">
                    <Dashboard data={[...selectedStock.history, selectedStock.actual]} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
