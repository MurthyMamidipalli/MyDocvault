import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Pin, 
  Download, 
  Copy, 
  Check, 
  Tag, 
  FileText, 
  Sparkles,
  ChevronLeft,
  Calendar,
  AlertCircle,
  Hash
} from 'lucide-react';
import { NotepadNote } from '../types';

interface NotepadTabProps {
  currentUserEmail?: string;
  triggerToast: (msg: string) => void;
  notes: NotepadNote[];
  onUpdateNotes: (notes: NotepadNote[]) => void;
}

export default function NotepadTab({ 
  currentUserEmail, 
  triggerToast,
  notes,
  onUpdateNotes
}: NotepadTabProps) {
  const emailPrefix = currentUserEmail ? currentUserEmail.toLowerCase().trim() : 'guest';
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    if (notes && notes.length > 0) {
      return notes[0].id;
    }
    return null;
  });

  // Auto-activate first note if activeNoteId is not valid and notes are loaded
  useEffect(() => {
    if (notes && notes.length > 0) {
      if (!activeNoteId || !notes.some(n => n.id === activeNoteId)) {
        setActiveNoteId(notes[0].id);
      }
    } else {
      setActiveNoteId(null);
    }
  }, [notes, activeNoteId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copied, setCopied] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  // 2. Notepad actions
  const handleCreateNote = () => {
    const newNote: NotepadNote = {
      id: `note-${Date.now()}`,
      title: 'Untitled Document',
      content: '',
      updatedAt: new Date().toISOString(),
      category: 'General',
      isPinned: false
    };
    onUpdateNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setIsMobileListOpen(false); // Focus on editor directly on mobile
    triggerToast('New notepad document instantiated.');
  };

  const handleDeleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const executeDelete = (id: string) => {
    const nextNotes = notes.filter(n => n.id !== id);
    if (activeNoteId === id) {
      const nextActiveId = nextNotes.length > 0 ? nextNotes[0].id : null;
      setActiveNoteId(nextActiveId);
    }
    onUpdateNotes(nextNotes);
    triggerToast('Document deleted successfully.');
  };

  const handleUpdateActiveNote = (field: keyof NotepadNote, value: any) => {
    if (!activeNoteId) return;
    const updated = notes.map(n => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          [field]: value,
          updatedAt: new Date().toISOString()
        };
      }
      return n;
    });
    onUpdateNotes(updated);
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.map(n => {
      if (n.id === id) {
        const nextState = !n.isPinned;
        triggerToast(nextState ? 'Document pinned to top.' : 'Document unpinned.');
        return { ...n, isPinned: nextState };
      }
      return n;
    });
    onUpdateNotes(updated);
  };

  // 3. Export & copy actions
  const handleCopyContent = () => {
    if (!activeNote) return;
    navigator.clipboard.writeText(activeNote.content);
    setCopied(true);
    triggerToast('Content copied to clipboard.');
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDownloadFile = (type: 'txt' | 'md') => {
    if (!activeNote) return;
    const titleSlug = activeNote.title ? activeNote.title.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'note';
    const filename = `${titleSlug}.${type}`;
    
    let content = activeNote.content;
    if (type === 'md') {
      content = `# ${activeNote.title}\n*Category: ${activeNote.category || 'General'}*\n*Updated: ${new Date(activeNote.updatedAt).toLocaleDateString()}*\n\n---\n\n${activeNote.content}`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Downloaded ${filename} successfully.`);
  };

  // Helper selectors & metrics
  const categoriesList = ['All', ...Array.from(new Set(notes.map(n => n.category || 'General').filter(Boolean)))];

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort pinned items to the very top, then sort others by updatedAt descending
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const getWordCount = (text: string) => {
    const clean = text.trim();
    if (!clean) return 0;
    return clean.split(/\s+/).length;
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-300 font-sans" id="notepad-workspace-root">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1 border-b border-slate-900/60">
        <div>
          <div className="flex items-center gap-2.5 pb-1">
            <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white select-none">Intelligence Note Pad</h1>
          </div>
          <p className="text-xs text-gray-400 select-none">
            Dynamically capture ideas, organize notes, and log system intelligence files with auto-saving telemetry.
          </p>
        </div>
        
        <button
          onClick={handleCreateNote}
          className="flex items-center gap-2 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl active:scale-95 transition shadow-lg shadow-emerald-500/10 cursor-pointer select-none"
        >
          <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span>New Document</span>
        </button>
      </div>

      {/* 2. Bento Container Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] bg-slate-950/20 border border-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* SIDEBAR NOTES DIRECTORY */}
        <div className={`col-span-1 lg:col-span-4 border-r border-slate-900/80 bg-[#0a0b0f]/80 flex flex-col ${isMobileListOpen ? 'block' : 'hidden lg:flex'}`}>
          
          <div className="p-4 border-b border-slate-900 space-y-3 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents & text..."
                className="w-full bg-[#050608]/90 border border-slate-850 focus:border-slate-700/60 text-xs text-white placeholder-gray-500 rounded-xl py-2 pl-9 pr-4 transition-colors focus:outline-none"
              />
            </div>

            {/* Category Pill Filters */}
            <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1.5 custom-scrollbar text-[11px] font-mono select-none">
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 border transition ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 text-emerald-400 border-slate-800' 
                      : 'bg-[#06070a] text-gray-400 border-slate-900 hover:text-white'
                  }`}
                >
                  {cat === 'All' ? 'All Tags' : `• ${cat}`}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Stack Loop */}
          <div className="flex-1 overflow-y-auto max-h-[550px] custom-scrollbar p-3 space-y-2">
            {sortedNotes.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2 text-gray-500 select-none">
                <div className="text-slate-800 flex justify-center pb-1">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="text-xs font-medium">No matching documents</p>
                <p className="text-[10px] text-gray-600">Create a new document to get writing.</p>
              </div>
            ) : (
              sortedNotes.map(note => {
                const isActive = note.id === activeNoteId;
                const noteWordCount = getWordCount(note.content);
                const snippet = note.content ? note.content.slice(0, 85) + (note.content.length > 85 ? '...' : '') : 'Empty notepad document.';
                
                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setActiveNoteId(note.id);
                      setIsMobileListOpen(false); // Open editor view on mobile
                    }}
                    className={`p-3.5 rounded-2xl cursor-pointer transition border group relative flex flex-col gap-2 ${
                      isActive 
                        ? 'bg-slate-900/90 text-white border-slate-800/80 shadow-md' 
                        : 'bg-[#06070a]/40 text-gray-400 border-slate-900 hover:border-slate-800 hover:bg-slate-900/20'
                    }`}
                  >
                    {/* Note Title Block */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {note.isPinned && (
                          <Pin className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20 shrink-0" />
                        )}
                        <h3 className={`text-xs font-bold truncate leading-tight ${isActive ? 'text-white' : 'text-gray-300'}`}>
                          {note.title.trim() || 'Untitled Document'}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition duration-150">
                        <button
                          type="button"
                          onClick={(e) => handleTogglePin(note.id, e)}
                          title="Pin note"
                          className="p-1 hover:bg-slate-800 text-gray-500 hover:text-emerald-400 rounded-md transition"
                        >
                          <Pin className={`w-3 h-3 ${note.isPinned ? 'text-emerald-400 fill-emerald-400/20' : ''}`} />
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          title="Delete note"
                          className="p-1 hover:bg-slate-800 text-gray-500 hover:text-rose-400 rounded-md transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Content Snippet */}
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                      {snippet}
                    </p>

                    {/* Metadata Footer bar */}
                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-600 pt-1 group-hover:text-gray-500">
                      <span className="flex items-center gap-1 uppercase">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        {note.category && (
                          <span className="text-slate-500 border border-slate-900 bg-slate-950/80 px-1.5 py-0.5 rounded-md text-[8px] tracking-wide font-bold">
                            {note.category}
                          </span>
                        )}
                        <span>{noteWordCount} words</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* ACTIVE EDITOR SCREEN */}
        <div className={`col-span-1 lg:col-span-8 flex flex-col bg-[#050608]/40 ${!isMobileListOpen ? 'block' : 'hidden lg:flex'}`}>
          {activeNote ? (
            <div className="flex flex-col h-full flex-1">
              
              {/* Note Editor Header Tools */}
              <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-[#07080a]/60 gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileListOpen(true)}
                  className="flex items-center gap-1 hover:text-white text-gray-400 font-semibold text-xs lg:hidden cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span>List</span>
                </button>

                {/* Editor operations */}
                <div className="flex items-center gap-2.5 select-none font-sans ml-auto">
                  {/* Explicit Save Button */}
                  <button
                    onClick={() => {
                      if (activeNote) {
                        handleUpdateActiveNote('updatedAt', new Date().toISOString());
                        triggerToast('Document saved successfully.');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer select-none shadow-md shadow-emerald-500/10"
                    title="Save document"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Save Note</span>
                  </button>

                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wider font-bold text-slate-500 uppercase bg-slate-950 px-2 py-1 rounded-lg border border-slate-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Auto-Saved Local
                  </span>

                  <button
                    onClick={handleCopyContent}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0b0f] hover:bg-slate-900 text-gray-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-850 active:scale-95 transition cursor-pointer"
                    title="Copy absolute note body to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <div className="relative group">
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0b0f] hover:bg-slate-900 text-gray-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-850 active:scale-95 transition cursor-pointer"
                      title="Download options"
                    >
                      <Download className="w-3.5 h-3.5 text-gray-500" />
                      <span>Export</span>
                    </button>
                    {/* Dropdown overlay */}
                    <div className="absolute right-0 mt-1 w-28 bg-[#0a0b0f] border border-slate-850 rounded-xl shadow-xl hidden group-hover:block hover:block z-20 overflow-hidden font-sans">
                      <button
                        onClick={() => handleDownloadFile('txt')}
                        className="w-full text-left text-[11px] text-gray-300 hover:text-white hover:bg-slate-900 py-2 px-3.5 transition"
                      >
                        Text (.txt)
                      </button>
                      <button
                        onClick={() => handleDownloadFile('md')}
                        className="w-full text-left text-[11px] text-gray-300 hover:text-white hover:bg-slate-900 py-2 px-3.5 transition border-t border-slate-900"
                      >
                        Markdown (.md)
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteNote(activeNote.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/25 hover:border-rose-400/40 active:scale-95 transition cursor-pointer"
                    title="Delete document forever"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>

              {/* Editor Workspace Core Inputs */}
              <div className="p-6 md:p-8 flex-1 flex flex-col space-y-4">
                {/* 1. Title Input Row */}
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateActiveNote('title', e.target.value)}
                  placeholder="Enter Document Title..."
                  className="w-full bg-transparent text-xl font-extrabold text-white placeholder-gray-600 focus:outline-none border-b border-transparent focus:border-slate-850/40 pb-2 transition"
                />

                {/* 2. Tags/Metadata Inline Panel */}
                <div className="flex flex-wrap items-center gap-4 text-xs select-none">
                  <div className="flex items-center gap-1.5 text-gray-400 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-xl">
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono text-[10px] uppercase font-bold text-gray-500 mr-1.5">Tag Category</span>
                    <input
                      type="text"
                      value={activeNote.category || ''}
                      onChange={(e) => handleUpdateActiveNote('category', e.target.value)}
                      placeholder="General"
                      className="bg-transparent text-white focus:outline-none placeholder-gray-700 w-20 text-[11px] font-semibold"
                    />
                  </div>

                  <span className="text-[10px] font-mono text-gray-500 tracking-wider">
                    LAST RETRIEVAL SYNCED: {new Date(activeNote.updatedAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* 3. Text Area Main Editor - Unlimited lines support */}
                <div className="flex-1 flex flex-col pt-2 min-h-[350px]">
                  <textarea
                    value={activeNote.content}
                    onChange={(e) => handleUpdateActiveNote('content', e.target.value)}
                    placeholder="Start typing your documents or transcripts and let the auto-saving modules work..."
                    className="w-full flex-1 bg-transparent text-xs text-gray-300 placeholder-gray-600 resize-none focus:outline-none leading-relaxed custom-scrollbar font-sans font-medium"
                    style={{ minHeight: '320px' }}
                  />
                </div>

                {/* 4. Active Note Stats panel */}
                <div className="pt-4 border-t border-slate-900/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-gray-500 select-none">
                  <div className="flex items-center gap-4">
                    <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-900">
                      Words: <strong className="text-gray-300 font-bold">{getWordCount(activeNote.content)}</strong>
                    </span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-900">
                      Characters: <strong className="text-gray-300 font-bold">{activeNote.content.length}</strong>
                    </span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-900">
                      Lines: <strong className="text-gray-300 font-bold">{activeNote.content.split('\n').length}</strong>
                    </span>
                  </div>
                  <div>
                    <span>UUID: {activeNote.id}</span>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center py-20 px-6 text-center space-y-4 text-gray-500 select-none">
              <div className="p-4 bg-slate-950 border border-slate-900 text-slate-800 rounded-full">
                <FileText className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-400">No active document selected</p>
                <p className="text-xs text-gray-600">Select an existing note from the sidebar or instate a clean slate.</p>
              </div>
              <button
                onClick={handleCreateNote}
                className="py-1.5 px-4 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 rounded-xl transition text-xs font-semibold cursor-pointer active:scale-95"
              >
                Create Document
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Delete Confirmation Modal Overlay */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="delete-confirmation-dialog">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Confirm Deletion</h3>
            </div>
            
            <p className="text-xs text-gray-400 leading-relaxed">
              Are you sure you want to delete this document forever? All content will be permanently lost and cannot be recovered.
            </p>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-gray-400 hover:text-white text-xs font-bold rounded-xl border border-slate-800 transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  executeDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
