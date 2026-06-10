import React, { useState } from 'react';
import { Note } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, FileText, ArrowLeft, Lightbulb } from 'lucide-react';

interface Props {
  notes: Note[];
  onAdd: (note: Note) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const NotesModal: React.FC<Props> = ({ notes, onAdd, onDelete, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      content: content.trim(),
      timestamp: Date.now(),
    };

    onAdd(newNote);
    setTitle('');
    setContent('');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onDelete(id);
      if (selectedNote?.id === id) setSelectedNote(null);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-5xl bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border bg-[#080808]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg">
                <FileText size={20} />
            </div>
            <div>
                <h2 className="text-xl font-display font-medium text-white">Research Notes</h2>
                <p className="text-[11px] text-dark-muted uppercase tracking-wider mt-0.5">Capture your investment thesis</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-dark-muted hover:text-white hover:bg-[#111] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Add Note Form */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-dark-border p-6 bg-[#050505] overflow-y-auto custom-scrollbar flex flex-col">
            <h3 className="text-[11px] font-medium text-dark-muted uppercase tracking-widest mb-5">New Note</h3>
            <form onSubmit={handleSubmit} className="space-y-4 flex-1">
              <div>
                <input
                  type="text"
                  placeholder="Note Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-brand-300 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-[#333]"
                />
              </div>
              <div>
                <textarea
                  placeholder="Note Content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-48 px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-slate-300 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none placeholder-[#333]"
                />
              </div>
              <button
                type="submit"
                disabled={!title.trim() || !content.trim()}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 disabled:bg-[#111] disabled:text-dark-muted disabled:border disabled:border-dark-border text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Save Note
              </button>
            </form>
            
            <div className="mt-6 p-4 bg-brand-900/10 border border-brand-500/20 rounded-xl flex gap-3 items-start">
                <Lightbulb size={16} className="text-brand-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-brand-300/80 leading-relaxed">
                    Your notes are automatically included when you export your knowledge base JSON file.
                </p>
            </div>
          </div>

          {/* Notes List / Detail */}
          <div className="w-full md:w-2/3 p-6 overflow-y-auto bg-dark-card custom-scrollbar">
            <AnimatePresence mode="wait">
                {selectedNote ? (
                    <motion.div 
                        key="detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-dark-border">
                            <button 
                                onClick={() => setSelectedNote(null)}
                                className="flex items-center gap-2 text-dark-muted hover:text-white transition-colors text-sm font-medium group"
                            >
                                <div className="p-1.5 rounded-lg bg-[#111] group-hover:bg-[#222] transition-colors">
                                    <ArrowLeft size={16} />
                                </div>
                                Back to List
                            </button>
                            <div className="flex items-center gap-4">
                                <span className="text-[11px] font-mono text-dark-muted">{formatDate(selectedNote.timestamp)}</span>
                                <button 
                                    onClick={(e) => handleDelete(e, selectedNote.id)}
                                    className="text-dark-muted hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-all"
                                    title="Delete Note"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        
                        <h2 className="text-2xl font-display font-medium text-white mb-6 leading-tight">{selectedNote.title}</h2>
                        
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                                {selectedNote.content}
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <h3 className="text-[11px] font-medium text-dark-muted uppercase tracking-widest mb-5 flex justify-between items-center">
                            <span>Saved Notes ({notes.length})</span>
                        </h3>
                        
                        {notes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-dark-muted border border-dashed border-dark-border rounded-xl bg-[#050505]">
                                <FileText size={48} className="mb-4 opacity-20" />
                                <p className="text-sm">No notes saved yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {notes.map((note) => (
                                <motion.div 
                                    whileHover={{ y: -2 }}
                                    key={note.id} 
                                    onClick={() => setSelectedNote(note)}
                                    className="bg-[#050505] border border-dark-border rounded-xl p-5 group hover:border-brand-500/30 transition-colors relative cursor-pointer flex flex-col h-48"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-display font-medium text-slate-200 pr-8 truncate group-hover:text-brand-400 transition-colors">{note.title}</h4>
                                        <button
                                            onClick={(e) => handleDelete(e, note.id)}
                                            className="absolute top-4 right-4 p-1.5 text-dark-muted hover:text-red-400 hover:bg-red-400/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-400 line-clamp-4 leading-relaxed flex-1 font-mono text-[11px]">
                                        {note.content}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-dark-border flex justify-between items-center">
                                        <p className="text-[10px] text-dark-muted font-mono">
                                            {formatDate(note.timestamp)}
                                        </p>
                                        <span className="text-brand-500 text-[10px] font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                            Read More →
                                        </span>
                                    </div>
                                </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};