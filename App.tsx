import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FinancialData, AnalysisResult, TrainingResult, LearnedPattern, Note } from './types';
import { parseFinancialText, parseBulkFile, BulkStockEntry } from './utils/dataParser';
import { analyzeAndForecast, trainStockModel, synthesizeKnowledge } from './services/geminiService';
import { InputSection } from './components/InputSection';
import { Dashboard } from './components/Dashboard';
import { AnalysisResultView } from './components/AnalysisResultView';
import { TrainingResultView } from './components/TrainingResultView';
import { TrainingHistory } from './components/TrainingHistory';
import { NotesModal } from './components/NotesModal';
import { DataView } from './components/DataView';
import { motion, AnimatePresence } from 'motion/react';
import { IntroSplash } from './components/IntroSplash';

const DEFAULT_INPUT = `Mar 2020	Mar 2021	Mar 2022	Mar 2023	Mar 2024	Mar 2025
Sales +	35	80	408	1,781	1,754	2,255
Expenses +	220	257	668	2,488	2,438	2,836
Operating Profit	-185	-177	-260	-708	-685	-581
OPM %	-523%	-222%	-64%	-40%	-39%	-26%
Net Profit +	-220	-233	-344	-864	-1,060	-812
EPS in Rs	-20118.9	-21344.9	-30078.6	-75436.3	-92469.4	-27.9`;

const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.ceil(seconds % 60);
    if (min > 0) return `${min}m ${sec}s`;
    return `${sec}s`;
};

const App: React.FC = () => {
  const [isSplashActive, setIsSplashActive] = useState<boolean>(true);
  const [mode, setMode] = useState<'training' | 'estimating' | 'data'>('training');
  const [knowledgeBase, setKnowledgeBase] = useState<LearnedPattern[]>(() => {
    try {
      const saved = localStorage.getItem('finsight_kb');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [metaInsights, setMetaInsights] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('finsight_metaInsights');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('finsight_notes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  // Automatically sync to local storage
  useEffect(() => {
    localStorage.setItem('finsight_kb', JSON.stringify(knowledgeBase));
  }, [knowledgeBase]);

  useEffect(() => {
    localStorage.setItem('finsight_metaInsights', JSON.stringify(metaInsights));
  }, [metaInsights]);

  useEffect(() => {
    localStorage.setItem('finsight_notes', JSON.stringify(notes));
  }, [notes]);

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [rawData, setRawData] = useState<string>(DEFAULT_INPUT);
  const [stockName, setStockName] = useState<string>("Ather Energy");
  const [sector, setSector] = useState<string>("EV");
  const [parsedData, setParsedData] = useState<FinancialData[] | null>(() => parseFinancialText(DEFAULT_INPUT));
  
  // Results
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<LearnedPattern | null>(null);
  
  // Progress States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [learningStatus, setLearningStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Bulk States
  const [bulkQueue, setBulkQueue] = useState<BulkStockEntry[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [eta, setEta] = useState<string | null>(null);

  // Simple timer for single request ETA
  const [elapsedTime, setElapsedTime] = useState(0);
  useEffect(() => {
    let interval: any;
    if (isLoading && !isBulkProcessing && !learningStatus?.includes("Meta-Insight")) {
      setElapsedTime(0);
      interval = setInterval(() => setElapsedTime(t => t + 1), 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isLoading, isBulkProcessing, learningStatus]);


  const kbRef = useRef<LearnedPattern[]>([]);
  const metaRef = useRef<string[]>([]);
  useEffect(() => { kbRef.current = knowledgeBase; }, [knowledgeBase]);
  useEffect(() => { metaRef.current = metaInsights; }, [metaInsights]);

  const handleParse = useCallback((text: string) => {
    setRawData(text);
    try {
      const data = parseFinancialText(text);
      setParsedData(data.length > 0 ? data : null);
      setAnalysis(null);
      setTrainingResult(null);
      setSelectedHistory(null);
      setError(null);
    } catch (e) { setParsedData(null); }
  }, []);

  const processTraining = async (name: string, sec: string, data: FinancialData[], currentKB: LearnedPattern[]): Promise<LearnedPattern> => {
    if (data.length < 3) throw new Error(`${name}: Insufficient history.`);
    const history = data.slice(0, data.length - 1);
    const actual = data[data.length - 1];
    const range = `${data[0].year} - ${actual.year}`;
    const result = await trainStockModel(history, actual, name, sec, currentKB, metaRef.current);
    
    return {
        id: Math.random().toString(36).substr(2, 9),
        stockName: result.stockName,
        sector: result.sector,
        insight: result.learning,
        accuracyScore: result.accuracyScore,
        yearRange: range,
        timestamp: Date.now(),
        history,
        actual,
        fullTrainingResult: result
    };
  };

  // Bulk processing loop
  useEffect(() => {
    if (bulkQueue.length > 0 && isBulkProcessing) {
      const processNext = async () => {
        const entry = bulkQueue[0];
        try {
          const newPattern = await processTraining(entry.stockName, entry.sector, entry.data, kbRef.current);
          setKnowledgeBase(prev => [newPattern, ...prev]);
          
          const itemsCompleted = processedCount + 1;
          setProcessedCount(itemsCompleted);
          
          // Calculate ETA
          // We use the time elapsed since the START of the bulk process
          if (startTime) {
            const elapsedMs = Date.now() - startTime;
            const avgTimePerItem = elapsedMs / itemsCompleted;
            const itemsRemaining = totalInQueue - itemsCompleted;
            
            if (itemsRemaining > 0) {
                const etaMs = avgTimePerItem * itemsRemaining;
                setEta(formatDuration(etaMs / 1000));
            } else {
                setEta("Finishing...");
            }
          }

          setBulkQueue(prev => prev.slice(1));
          
        } catch (e: any) {
          setError(`Failed ${entry.stockName}: ${e.message}`);
          setBulkQueue(prev => prev.slice(1));
        }
      };
      processNext();
    } else if (bulkQueue.length === 0 && isBulkProcessing) {
      setIsBulkProcessing(false);
      setEta(null);
      setStartTime(null);
      setError("Bulk processing complete.");
    }
  }, [bulkQueue, isBulkProcessing, startTime, processedCount, totalInQueue]);

  const handleBulkUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
        const text = await file.text();
        
        // Handle JSON Knowledge Base Load
        if (file.name.toLowerCase().endsWith('.json')) {
            try {
                const json = JSON.parse(text);
                
                let loadedPatterns: LearnedPattern[] = [];
                let loadedMeta: string[] = [];
                let loadedNotes: Note[] = [];

                // Detect format: Array (legacy) or Object (new)
                if (Array.isArray(json)) {
                    loadedPatterns = json;
                } else if (json.patterns && Array.isArray(json.patterns)) {
                    loadedPatterns = json.patterns;
                    if (json.metaInsights && Array.isArray(json.metaInsights)) {
                        loadedMeta = json.metaInsights;
                    }
                    if (json.notes && Array.isArray(json.notes)) {
                        loadedNotes = json.notes;
                    }
                } else {
                    throw new Error("Invalid JSON structure.");
                }
                
                const validPatterns = loadedPatterns.filter(p => p.id && p.stockName && p.insight);
                if (validPatterns.length === 0 && loadedMeta.length === 0 && loadedNotes.length === 0) throw new Error("No valid data found in JSON.");

                setKnowledgeBase(prev => {
                    const prevIds = new Set(prev.map(p => p.id));
                    const newItems = validPatterns.filter(p => !prevIds.has(p.id));
                    return [...newItems, ...prev];
                });

                if (loadedMeta.length > 0) {
                    setMetaInsights(loadedMeta);
                }
                
                if (loadedNotes.length > 0) {
                    setNotes(prev => {
                        const prevIds = new Set(prev.map(n => n.id));
                        const newNotes = loadedNotes.filter(n => !prevIds.has(n.id));
                        return [...newNotes, ...prev];
                    });
                }

                setLearningStatus(`Restored ${validPatterns.length} models, ${loadedMeta.length} strategies & ${loadedNotes.length} notes.`);
                setTimeout(() => setLearningStatus(null), 3000);
            } catch (e: any) {
                throw new Error("Failed to parse JSON file: " + e.message);
            }
        } else {
            // Handle Raw Text Data Bulk Processing
            const entries = parseBulkFile(text);
            if (entries.length === 0) throw new Error("No valid records found in text file.");
            
            // RESET ETA tracking for new bulk upload
            setBulkQueue(entries);
            setTotalInQueue(entries.length);
            setProcessedCount(0);
            setStartTime(Date.now());
            setEta("Calculating...");
            setIsBulkProcessing(true);
        }
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  };

  const handleGlobalLearn = async () => {
    if (knowledgeBase.length < 2) {
        setError("Need at least 2 stocks in knowledge base to find broader patterns.");
        return;
    }
    setIsLoading(true);
    setLearningStatus("Synthesizing Master Strategy...");
    try {
        const { masterInsights, status } = await synthesizeKnowledge(knowledgeBase);
        
        if (status === 'none') {
            setLearningStatus("No new meta-patterns found.");
            setTimeout(() => setLearningStatus(null), 3000);
            return;
        }

        setMetaInsights(masterInsights);
        
        // Re-calculate everything using the new global insights with ETA
        const updatedKB: LearnedPattern[] = [];
        const totalToRetrain = knowledgeBase.length;
        let count = 0;
        const retrainStartTime = Date.now();
        setEta("Calculating...");
        
        // We'll just iterate knowledgeBase.
        for (const pattern of [...knowledgeBase]) {
             setLearningStatus(`Applying Meta-Insights (${count + 1}/${totalToRetrain})...`);
             
             const reTrained = await processTraining(pattern.stockName, pattern.sector, [...pattern.history, pattern.actual], updatedKB);
             updatedKB.push(reTrained); // Add to new array
             
             count++;
             
             // Update ETA
             const elapsed = Date.now() - retrainStartTime;
             const avgTime = elapsed / count;
             const remaining = totalToRetrain - count;
             if (remaining > 0) {
                 const etaMs = avgTime * remaining;
                 setEta(formatDuration(etaMs / 1000));
             } else {
                 setEta("Finishing...");
             }
        }

        setKnowledgeBase(updatedKB);
        
        setLearningStatus("Global optimization complete.");
        setEta(null);
        setTimeout(() => setLearningStatus(null), 4000);
    } catch (e: any) { setError("Meta-learning failed: " + e.message); setEta(null); }
    finally { setIsLoading(false); }
  };

  const handleAction = useCallback(async () => {
    if (!parsedData) return;
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'training') {
        const newPattern = await processTraining(stockName, sector, parsedData, knowledgeBase);
        setTrainingResult(newPattern.fullTrainingResult!);
        setKnowledgeBase(prev => [newPattern, ...prev]);
        setSelectedHistory(null);
      } else {
        const result = await analyzeAndForecast(parsedData, stockName, sector, knowledgeBase);
        setAnalysis(result);
      }
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, [mode, parsedData, stockName, sector, knowledgeBase]);

  const handleBulkDownload = () => {
    if (knowledgeBase.length === 0 && metaInsights.length === 0 && notes.length === 0) {
        setError("No data to save.");
        return;
    }
    
    // Save individual patterns, global meta-insights, and notes
    const exportData = {
        metaInsights: metaInsights,
        patterns: knowledgeBase,
        notes: notes,
        exportDate: new Date().toISOString(),
        version: '1.1'
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finsight_kb_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const uniqueSectors = Array.from(new Set(knowledgeBase.map(kb => kb.sector)));

  return (
    <>
      <AnimatePresence>
        {isSplashActive && (
          <IntroSplash onComplete={() => setIsSplashActive(false)} />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: isSplashActive ? 0 : 1, scale: isSplashActive ? 0.98 : 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen bg-[#050505] text-slate-200 font-sans pb-20 overflow-x-hidden"
      >
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/10 via-[#050505] to-black -z-10" />
      
      {/* Dynamic Header Banner with ETA */}
      {(learningStatus || isBulkProcessing) && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-brand-600 text-white px-6 py-3 rounded-2xl shadow-2xl shadow-brand-900/50 flex flex-col gap-1 border border-brand-400 min-w-[320px]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/20 border-t-white"></div>
                    <span className="text-sm font-medium font-display">{learningStatus || 'Bulk Training active'}</span>
                  </div>
                  {eta && <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded font-mono font-medium tracking-tight">ETA: {eta}</span>}
                </div>
                {isBulkProcessing && (
                  <div className="w-full bg-black/20 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-white h-full transition-all duration-500" 
                      style={{ width: `${(processedCount / totalInQueue) * 100}%` }}
                    ></div>
                  </div>
                )}
            </div>
        </div>
      )}

      {/* Dynamic Training Progress Box */}
      {isBulkProcessing && bulkQueue.length > 0 && (
        <div className="fixed bottom-8 left-8 z-50 animate-in slide-in-from-left-8 duration-500">
          <div className="bg-dark-card border border-dark-border p-5 rounded-2xl shadow-2xl w-64 shadow-black/60 relative overflow-hidden ring-1 ring-brand-500/30">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
            <div className="text-[10px] font-medium text-dark-muted uppercase tracking-widest mb-1 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
               In Progress
            </div>
            <div className="text-xl font-display font-medium text-white truncate">{bulkQueue[0].stockName}</div>
            <div className="text-[10px] text-brand-500 font-mono mt-0.5">{bulkQueue[0].sector}</div>
            
            {bulkQueue.length > 1 && (
              <div className="mt-5 pt-3 border-t border-dark-border flex flex-col items-end">
                <div className="text-[8px] font-medium text-dark-muted uppercase tracking-widest mb-0.5">Next Up</div>
                <div className="text-xs font-medium text-slate-400 truncate max-w-[150px]">{bulkQueue[1].stockName}</div>
              </div>
            )}
            
            <div className="mt-4 flex justify-between items-center text-[10px] font-mono">
              <span className="text-dark-muted font-medium">{processedCount} <span className="text-[#333]">/</span> {totalInQueue}</span>
              <div className="flex gap-0.5">
                {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-brand-500/40 animate-bounce" style={{animationDelay: `${i*100}ms`}}></div>)}
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-[#050505]/95 backdrop-blur-md border-b border-dark-border sticky top-0 z-40 py-3.5 shadow-[0_1px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-2 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.25)] border border-brand-400/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <div>
              <h1 className="text-sm font-display font-bold text-white tracking-widest uppercase">FINSIGHT <span className="text-brand-500 font-medium">ENGINE</span></h1>
              <p className="text-[10px] font-mono text-dark-muted">Pattern-Matching Valuation Lab</p>
            </div>
          </div>

          {/* Centered mode switch slider */}
          <div className="flex bg-[#090909] p-1 rounded-xl border border-dark-border shadow-inner relative">
              {(['training', 'estimating', 'data'] as const).map((tab) => {
                const isActive = mode === tab;
                const label = tab.charAt(0).toUpperCase() + tab.slice(1);
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setMode(tab);
                      setSelectedHistory(null);
                      if (tab === 'training') setTrainingResult(null);
                    }}
                    className={`relative px-5 py-1.5 text-[10px] font-semibold rounded-lg uppercase tracking-wider transition-all duration-300 z-10 ${
                      isActive ? 'text-black font-bold' : 'text-dark-muted hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute inset-0 bg-brand-500 rounded-lg -z-10 shadow-[0_0_14px_rgba(20,184,166,0.35)]"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    {label}
                  </button>
                );
              })}
          </div>

          <div className="flex items-center gap-3">
            <button
                onClick={() => setIsNotesOpen(true)}
                className="p-2.5 rounded-lg bg-dark-card border border-dark-border text-dark-muted hover:text-white hover:border-brand-500/40 hover:bg-brand-500/5 transition-all relative group shadow-md"
                title="Open Research Notes"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {notes.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full text-[9px] flex items-center justify-center text-black font-bold border border-[#050505]">
                        {notes.length}
                    </span>
                )}
            </button>
            
            <button 
                onClick={handleGlobalLearn}
                disabled={isLoading || isBulkProcessing || knowledgeBase.length < 2}
                className={`flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase font-bold tracking-wider rounded-lg border transition-all ${
                  isLoading || isBulkProcessing 
                    ? 'opacity-40 cursor-not-allowed text-dark-muted border-dark-border bg-dark-bg' 
                    : 'bg-brand-950/40 text-brand-400 border-brand-900/50 hover:bg-brand-900/20 hover:border-brand-500/30'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                {metaInsights.length > 0 ? `Update Meta-Strategies (${metaInsights.length})` : 'Learn Meta'}
            </button>
          </div>
        </div>
      </header>
      
      {isNotesOpen && (
        <NotesModal 
            notes={notes} 
            onClose={() => setIsNotesOpen(false)} 
            onAdd={(note) => setNotes(prev => [note, ...prev])}
            onDelete={(id) => setNotes(prev => prev.filter(n => n.id !== id))}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        {mode === 'data' ? (
          <DataView 
            patterns={knowledgeBase}
            metaInsights={metaInsights}
            onDeletePattern={(id) => {
              setKnowledgeBase(prev => prev.filter(p => p.id !== id));
            }}
            onDeleteMetaInsight={(index) => {
              setMetaInsights(prev => prev.filter((_, idx) => idx !== index));
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 sticky top-24">
              <InputSection 
                  mode={mode as 'training' | 'estimating'} stockName={stockName} sector={sector}
                  onStockNameChange={setStockName} onSectorChange={setSector}
                  rawData={rawData} onDataChange={handleParse} 
                  onAnalyze={handleAction} onBulkUpload={handleBulkUpload} onBulkDownload={handleBulkDownload}
                  existingSectors={uniqueSectors} isLoading={isLoading || isBulkProcessing} isValid={!!parsedData}
              />
              {error && (
                  <div className="mt-4 p-4 bg-red-900/10 border border-red-800/30 rounded-xl text-red-400 text-[11px] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                      {error}
                  </div>
              )}
               
              {/* Simple ETA Timer for single requests */}
              {isLoading && !isBulkProcessing && !learningStatus && (
                 <div className="mt-4 flex justify-center animate-pulse">
                    <span className="text-[11px] font-mono text-brand-500 bg-brand-950/50 px-3 py-1 rounded-full border border-brand-900">
                      <span className="text-dark-muted mr-1">Time Elapsed:</span> 
                      {formatDuration(elapsedTime)}
                    </span>
                 </div>
              )}

            </div>

            <div className="lg:col-span-8 space-y-8 min-w-0">
              {/* Results Display */}
              {selectedHistory ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300 space-y-8">
                      <div className="flex justify-between items-center bg-dark-card p-4 rounded-xl border border-dark-border shadow-xl">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-medium text-brand-500 bg-brand-500/10 px-2 py-1 rounded uppercase tracking-wider">HISTORY</span>
                            <span className="text-sm font-display font-medium text-slate-200">{selectedHistory.stockName}</span>
                            <span className="text-[10px] text-dark-muted font-mono">({selectedHistory.sector})</span>
                          </div>
                          <button onClick={() => setSelectedHistory(null)} className="text-brand-500 text-[11px] font-medium hover:text-brand-400 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Close Detail
                          </button>
                      </div>
                      {selectedHistory.fullTrainingResult && <TrainingResultView result={selectedHistory.fullTrainingResult} />}
                      <Dashboard data={[...selectedHistory.history, selectedHistory.actual]} />
                  </div>
              ) : (
                  <>
                      {mode === 'training' && trainingResult && <TrainingResultView result={trainingResult} />}
                      {mode === 'estimating' && parsedData && <Dashboard data={parsedData} forecast={analysis?.forecast} />}
                      {mode === 'estimating' && analysis && <AnalysisResultView result={analysis} />}
                  </>
              )}
              
              <TrainingHistory 
                  patterns={knowledgeBase} 
                  metaInsights={metaInsights}
                  onSelectPattern={setSelectedHistory} 
                  selectedId={selectedHistory?.id}
              />
            </div>
          </div>
        )}
      </main>
    </motion.div>
  </>
  );
};

export default App;