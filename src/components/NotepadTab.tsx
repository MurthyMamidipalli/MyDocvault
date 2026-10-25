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
  CheckSquare,
  Square,
  ChevronLeft, 
  Calendar, 
  AlertTriangle, 
  Maximize2, 
  Minimize2,
  ExternalLink,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Pencil,
  RotateCcw,
  ListTodo,
  CheckCircle2,
  X
} from 'lucide-react';
import { NotepadNote, TaskItem, generateUUID } from '../types';

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
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    if (notes && notes.length > 0) {
      return notes[0].id;
    }
    return null;
  });

  // Mode: All Documents vs Notes vs Tasks
  const [viewMode, setViewMode] = useState<'all' | 'notes' | 'tasks'>('all');
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // Layout state
  const [isFullTab, setIsFullTab] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copied, setCopied] = useState(false);

  // Dialog & Warning states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [warningTask, setWarningTask] = useState<{ id: string; title: string } | null>(null);

  // Rich Text Editor states
  const [activeFont, setActiveFont] = useState('Inter, sans-serif');
  const [activeFontSize, setActiveFontSize] = useState('3'); // HTML font size 1-7
  const editorRef = useRef<HTMLDivElement>(null);
  const editorWorkspaceRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // Preserve user's current highlighted selection in editor
  const saveSelection = () => {
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    } catch (_) {}
  };

  const restoreSelection = () => {
    try {
      if (savedRangeRef.current && editorRef.current) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current);
        }
      }
    } catch (_) {}
  };

  // Subtask input state for active note
  const [newSubtaskText, setNewSubtaskText] = useState('');

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

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  // Sync editor HTML when activeNote changes
  useEffect(() => {
    if (editorRef.current && activeNote) {
      if (editorRef.current.innerHTML !== activeNote.content) {
        editorRef.current.innerHTML = activeNote.content || '';
      }
    }
  }, [activeNoteId]);

  // Handle URL param ?new=true to instantiate note on load
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash.includes('new=true') || window.location.search.includes('new=true')) {
        handleCreateDocument('note');
      }
    } catch (_) {}
  }, []);

  // Format command helper for Rich Text Toolbar
  const executeFormat = (command: string, value: string = '') => {
    editorRef.current?.focus();
    restoreSelection();
    try {
      document.execCommand(command, false, value);
    } catch (_) {}
    saveSelection();
    if (editorRef.current && activeNoteId) {
      handleUpdateActiveNote('content', editorRef.current.innerHTML);
    }
  };

  // Heading Block Formatter for Normal, H1, H2, H3
  const applyHeadingBlock = (tag: 'p' | 'h1' | 'h2' | 'h3') => {
    editorRef.current?.focus();
    restoreSelection();
    try {
      const ok = document.execCommand('formatBlock', false, `<${tag.toUpperCase()}>`);
      if (!ok) {
        document.execCommand('formatBlock', false, tag);
      }
    } catch (_) {
      try {
        document.execCommand('formatBlock', false, tag);
      } catch (e) {}
    }

    // Fallback: If text was selected and formatBlock was ignored by browser, wrap selection
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode)) {
      try {
        const range = sel.getRangeAt(0);
        const el = document.createElement(tag);
        el.appendChild(range.extractContents());
        range.insertNode(el);
        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);
        savedRangeRef.current = range.cloneRange();
      } catch (_) {}
    }

    saveSelection();
    if (editorRef.current && activeNoteId) {
      handleUpdateActiveNote('content', editorRef.current.innerHTML);
    }
  };

  // Font Family: Changes ONLY the highlighted/selected text
  const applyFontToSelection = (fontFamily: string) => {
    editorRef.current?.focus();
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !editorRef.current?.contains(sel.anchorNode)) {
      triggerToast('Please select/highlight the specific text you want to change font for.');
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontFamily = fontFamily;
      span.appendChild(range.extractContents());
      range.insertNode(span);

      // Re-select newly styled span
      range.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(range);
      savedRangeRef.current = range.cloneRange();
      triggerToast('Font applied to selected text.');
    } catch (err) {
      console.warn('Font apply error', err);
    }

    if (editorRef.current && activeNoteId) {
      handleUpdateActiveNote('content', editorRef.current.innerHTML);
    }
  };

  // Font Size: Changes ONLY the highlighted/selected text
  const applyFontSizeToSelection = (sizePx: string) => {
    editorRef.current?.focus();
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !editorRef.current?.contains(sel.anchorNode)) {
      triggerToast('Please select/highlight the specific text you want to resize.');
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = sizePx;
      span.appendChild(range.extractContents());
      range.insertNode(span);

      range.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(range);
      savedRangeRef.current = range.cloneRange();
      triggerToast('Font size updated on selected text.');
    } catch (err) {
      console.warn('Font size apply error', err);
    }

    if (editorRef.current && activeNoteId) {
      handleUpdateActiveNote('content', editorRef.current.innerHTML);
    }
  };

  // Create Note or Task Document
  const handleCreateDocument = (type: 'note' | 'task' = 'note') => {
    // If the active filter hides this type, switch to 'all' so it is visible in the list
    if (type === 'task' && viewMode === 'notes') {
      setViewMode('all');
    } else if (type === 'note' && viewMode === 'tasks') {
      setViewMode('all');
    }

    const newDoc: NotepadNote = {
      id: generateUUID(),
      title: type === 'task' ? 'Untitled Work Task' : 'Untitled Document',
      content: '',
      updatedAt: new Date().toISOString(),
      category: type === 'task' ? 'Work' : 'General',
      isPinned: false,
      type,
      completed: false,
      tasks: []
    };
    onUpdateNotes([newDoc, ...notes]);
    setActiveNoteId(newDoc.id);
    setIsMobileListOpen(false); // Mobile: switch directly to active editor
    triggerToast(`New ${type === 'task' ? 'work task' : 'document'} opened in editor.`);

    // Focus and scroll directly into the main editor workspace where notes are already open
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
      editorWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  // Right-click "New Document" action: opens in new browser tab
  const handleRightClickNewDocument = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const targetUrl = window.location.origin + window.location.pathname + '#notepad?new=true';
      window.open(targetUrl, '_blank');
      triggerToast('Opened new document in separate browser tab.');
    } catch (_) {
      handleCreateDocument('note');
    }
  };

  const executeDelete = (id: string) => {
    const nextNotes = notes.filter(n => n.id !== id);
    if (activeNoteId === id) {
      const nextActiveId = nextNotes.length > 0 ? nextNotes[0].id : null;
      setActiveNoteId(nextActiveId);
    }
    onUpdateNotes(nextNotes);
    setDeleteConfirmId(null);
    triggerToast('Document deleted successfully from Supabase.');
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

  // Pin Toggle with priority sorting and Supabase tags persistence
  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = notes.map(n => {
      if (n.id === id) {
        const nextState = !n.isPinned;
        triggerToast(nextState ? 'Pinned to top of document list.' : 'Unpinned from top.');
        return { ...n, isPinned: nextState, updatedAt: new Date().toISOString() };
      }
      return n;
    });
    onUpdateNotes(updated);
  };

  // Task Completion Handler (Tick vs Untick)
  // *if user completed the work user select tick option that work will remove from the tasks. 
  // *if user select untick it shows like warning task is not completed.
  const handleToggleTaskStatus = (noteItem: NotepadNote, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const willBeCompleted = !noteItem.completed;

    if (willBeCompleted) {
      // User clicked tick -> complete work and remove from active tasks view
      const updated = notes.map(n => {
        if (n.id === noteItem.id) {
          return {
            ...n,
            completed: true,
            updatedAt: new Date().toISOString()
          };
        }
        return n;
      });
      onUpdateNotes(updated);
      triggerToast(`Task "${noteItem.title}" completed and removed from active work list.`);
    } else {
      // User clicked untick -> show warning that work is not completed!
      setWarningTask({ id: noteItem.id, title: noteItem.title });
    }
  };

  // Subtask Checklist items within active task
  const handleAddSubtask = () => {
    if (!newSubtaskText.trim() || !activeNote) return;
    const currentTasks = activeNote.tasks || [];
    const newTaskItem: TaskItem = {
      id: generateUUID(),
      text: newSubtaskText.trim(),
      completed: false
    };
    handleUpdateActiveNote('tasks', [...currentTasks, newTaskItem]);
    setNewSubtaskText('');
  };

  const handleToggleSubtask = (taskId: string) => {
    if (!activeNote) return;
    const currentTasks = activeNote.tasks || [];
    const targetTask = currentTasks.find(t => t.id === taskId);
    if (!targetTask) return;

    if (!targetTask.completed) {
      // Tick: mark complete and remove or cross out
      const updatedTasks = currentTasks.map(t => t.id === taskId ? { ...t, completed: true } : t);
      handleUpdateActiveNote('tasks', updatedTasks);
      triggerToast('Task item checked off as completed.');
    } else {
      // Untick: warning
      setWarningTask({ id: taskId, title: targetTask.text });
    }
  };

  const handleRemoveSubtask = (taskId: string) => {
    if (!activeNote) return;
    const currentTasks = activeNote.tasks || [];
    handleUpdateActiveNote('tasks', currentTasks.filter(t => t.id !== taskId));
  };

  // Confirm unticking task after warning modal
  const handleConfirmUntick = () => {
    if (!warningTask) return;
    // Check if it's the root note or a subtask
    const isRootNote = notes.some(n => n.id === warningTask.id);
    if (isRootNote) {
      const updated = notes.map(n => {
        if (n.id === warningTask.id) {
          return { ...n, completed: false, updatedAt: new Date().toISOString() };
        }
        return n;
      });
      onUpdateNotes(updated);
    } else if (activeNote) {
      const currentTasks = activeNote.tasks || [];
      const updatedTasks = currentTasks.map(t => t.id === warningTask.id ? { ...t, completed: false } : t);
      handleUpdateActiveNote('tasks', updatedTasks);
    }
    setWarningTask(null);
    triggerToast('Task marked incomplete. Please address pending requirements.');
  };

  // Export & copy
  const handleCopyContent = () => {
    if (!activeNote) return;
    const plainText = editorRef.current ? (editorRef.current.innerText || activeNote.content) : activeNote.content;
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    triggerToast('Content copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (type: 'txt' | 'md' | 'html') => {
    if (!activeNote) return;
    const titleSlug = activeNote.title ? activeNote.title.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'note';
    const filename = `${titleSlug}.${type}`;
    
    let content = activeNote.content;
    if (type === 'txt' && editorRef.current) {
      content = editorRef.current.innerText || activeNote.content;
    } else if (type === 'md') {
      const plain = editorRef.current ? editorRef.current.innerText : activeNote.content;
      content = `# ${activeNote.title}\n*Type: ${activeNote.type || 'Note'}*\n*Category: ${activeNote.category || 'General'}*\n*Updated: ${new Date(activeNote.updatedAt).toLocaleDateString()}*\n\n---\n\n${plain}`;
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

  // Filtering Notes & Tasks
  const categoriesList = ['All', ...Array.from(new Set(notes.map(n => n.category || 'General').filter(Boolean)))];

  const filteredNotes = notes.filter(n => {
    // Mode filter
    if (viewMode === 'notes' && n.type === 'task') return false;
    if (viewMode === 'tasks') {
      if (n.type !== 'task') return false;
      // In tasks mode, if completed and showCompletedTasks is false, remove from active list
      if (n.completed && !showCompletedTasks) return false;
    }

    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort pinned items to the very top, then others by updatedAt descending
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const getWordCount = (text: string) => {
    const clean = text.replace(/<[^>]*>/g, ' ').trim();
    if (!clean) return 0;
    return clean.split(/\s+/).length;
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-300 font-sans" id="notepad-workspace-root">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-900/60">
        <div>
          <div className="flex items-center gap-2.5 pb-1">
            <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white select-none">
              Intelligence Note Pad & Work Tasks
            </h1>
          </div>
          <p className="text-xs text-gray-400 select-none">
            Organize personal notes, track mission-critical work tasks with completion ticks, and format documents seamlessly.
          </p>
        </div>
        
        {/* Top Action Buttons: New Document & New Task with Right-Click Support */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleCreateDocument('note')}
            onContextMenu={handleRightClickNewDocument}
            title="Click to open full tab; Right-click to open in separate browser tab"
            className="flex items-center gap-2 py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl active:scale-95 transition shadow-lg shadow-emerald-500/10 cursor-pointer select-none"
          >
            <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>New Document</span>
          </button>

          <button
            onClick={() => handleCreateDocument('task')}
            className="flex items-center gap-2 py-2 px-3.5 bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold rounded-xl active:scale-95 transition shadow-lg shadow-blue-500/10 cursor-pointer select-none"
            title="Create a work task with tick/untick verification"
          >
            <ListTodo className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 2. Bento Container Setup */}
      <div className={`${isFullTab ? 'flex flex-col' : 'grid grid-cols-1 lg:grid-cols-12 gap-6'} min-h-[640px] bg-slate-950/20 border border-slate-900 rounded-3xl overflow-hidden shadow-2xl relative`}>
        
        {/* SIDEBAR DIRECTORY: Notes & Tasks List (Hidden in Full Tab) */}
        {!isFullTab && (
          <div className={`col-span-1 lg:col-span-4 border-r border-slate-900/80 bg-[#0a0b0f]/80 flex flex-col ${isMobileListOpen ? 'block' : 'hidden lg:flex'}`}>
          
          <div className="p-4 border-b border-slate-900 space-y-3 shrink-0">
            {/* View Mode Switcher: All | Notes | Tasks */}
            <div className="flex items-center justify-between p-1 bg-[#050608] rounded-xl border border-slate-850 text-xs font-bold select-none">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition ${
                  viewMode === 'all' 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setViewMode('notes')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition flex items-center justify-center gap-1 ${
                  viewMode === 'notes' 
                    ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Notes</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tasks')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition flex items-center justify-center gap-1 ${
                  viewMode === 'tasks' 
                    ? 'bg-blue-500 text-slate-950 shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <CheckSquare className="w-3 h-3" />
                <span>Tasks</span>
              </button>
            </div>

            {/* In Tasks view: Toggle to show/hide completed tasks */}
            {viewMode === 'tasks' && (
              <div className="flex items-center justify-between text-[11px] font-mono px-1">
                <span className="text-gray-400">Active Work Tasks</span>
                <button
                  type="button"
                  onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                  className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  {showCompletedTasks ? 'Hide Completed' : 'Show Completed'}
                </button>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, tasks & content..."
                className="w-full bg-[#050608]/90 border border-slate-850 focus:border-slate-700/60 text-xs text-white placeholder-gray-500 rounded-xl py-2 pl-9 pr-4 transition-colors focus:outline-none"
              />
            </div>

            {/* Category Pill Filters */}
            <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1 custom-scrollbar text-[11px] font-mono select-none">
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

          {/* Notes & Tasks Stack Loop */}
          <div className="flex-1 overflow-y-auto max-h-[550px] custom-scrollbar p-3 space-y-2.5">
            {sortedNotes.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2 text-gray-500 select-none">
                <div className="text-slate-800 flex justify-center pb-1">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="text-xs font-medium">No matching items</p>
                <p className="text-[10px] text-gray-600">Create a new document or task to get started.</p>
              </div>
            ) : (
              sortedNotes.map(note => {
                const isActive = note.id === activeNoteId;
                const isTask = note.type === 'task';
                const snippet = note.content 
                  ? note.content.replace(/<[^>]*>/g, ' ').slice(0, 85).trim() + (note.content.length > 85 ? '...' : '') 
                  : 'Empty document body.';
                
                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setActiveNoteId(note.id);
                      setIsMobileListOpen(false); // Mobile: switch to editor
                    }}
                    className={`p-3.5 rounded-2xl cursor-pointer transition border relative flex flex-col gap-2.5 ${
                      isActive 
                        ? 'bg-slate-900/95 text-white border-slate-800 shadow-md ring-1 ring-slate-800' 
                        : 'bg-[#06070a]/40 text-gray-400 border-slate-900 hover:border-slate-800 hover:bg-slate-900/25'
                    } ${note.completed ? 'opacity-70 border-emerald-900/40 bg-emerald-950/10' : ''}`}
                  >
                    {/* Top Row: Type Indicator + Title + Action Bar */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {/* Task Tick/Untick Button for Tasks */}
                        {isTask && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleTaskStatus(note, e)}
                            title={note.completed ? "Task completed (Click to untick)" : "Tick to complete and remove from active tasks"}
                            className={`p-1 rounded-md transition cursor-pointer shrink-0 ${
                              note.completed 
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                                : 'bg-slate-800 text-gray-400 hover:text-emerald-400 hover:bg-slate-700'
                            }`}
                          >
                            {note.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {note.isPinned && (
                          <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30 shrink-0" />
                        )}

                        <h3 className={`text-xs font-bold truncate leading-tight ${isActive ? 'text-white' : 'text-gray-300'} ${note.completed ? 'line-through text-gray-500' : ''}`}>
                          {note.title.trim() || 'Untitled Document'}
                        </h3>
                      </div>

                      {/* CLEARLY VISIBLE ACTION BAR: Pin, Edit, and Delete with Proper Space */}
                      <div className="flex items-center gap-2.5 shrink-0" onClick={e => e.stopPropagation()}>
                        {/* Pin Button */}
                        <button
                          type="button"
                          onClick={(e) => handleTogglePin(note.id, e)}
                          title={note.isPinned ? "Unpin document" : "Pin to top of list"}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            note.isPinned 
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                              : 'bg-slate-900 border-slate-800 text-gray-500 hover:text-amber-400 hover:border-slate-700'
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                        </button>

                        {/* Clearly Visible Edit Option */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNoteId(note.id);
                            setIsMobileListOpen(false);
                            setTimeout(() => {
                              editorWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              editorRef.current?.focus();
                            }, 50);
                          }}
                          title="Edit document"
                          className="flex items-center gap-1 px-2.5 py-1 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 hover:text-sky-300 border border-sky-500/40 rounded-lg text-[10px] font-bold transition cursor-pointer shadow-sm active:scale-95"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {/* Clearly Visible Delete Option */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(note.id);
                          }}
                          title="Delete document"
                          className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/40 rounded-lg text-[10px] font-bold transition cursor-pointer shadow-sm active:scale-95"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Content Snippet */}
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                      {snippet}
                    </p>

                    {/* Metadata Footer bar */}
                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-600 pt-1">
                      <span className="flex items-center gap-1 uppercase">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        {isTask ? (
                          <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider ${
                            note.completed ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-blue-950 text-blue-400 border border-blue-900'
                          }`}>
                            {note.completed ? '✓ Completed' : '⚡ Task'}
                          </span>
                        ) : (
                          <span className="text-slate-500 border border-slate-900 bg-slate-950 px-1.5 py-0.5 rounded-md text-[8px] tracking-wide font-bold">
                            {note.category || 'Note'}
                          </span>
                        )}
                        <span>{getWordCount(note.content)} words</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

        {/* ACTIVE EDITOR SCREEN: Full Tap / Tab Workspace */}
        <div 
          ref={editorWorkspaceRef}
          id="notepad-active-editor-pane"
          className={`${isFullTab ? 'w-full' : 'col-span-1 lg:col-span-8'} flex flex-col bg-[#050608]/40 ${!isMobileListOpen || isFullTab ? 'block' : 'hidden lg:flex'}`}
        >
          {activeNote ? (
            <div className="flex flex-col h-full flex-1">
              
              {/* Note Editor Header Tools */}
              <div className="p-3.5 md:p-4 border-b border-slate-900 flex flex-wrap justify-between items-center bg-[#07080a]/70 gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMobileListOpen(true)}
                    className="flex items-center gap-1 hover:text-white text-gray-400 font-semibold text-xs lg:hidden cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    <span>List</span>
                  </button>

                  {/* Toggle Note / Task badge */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextType = activeNote.type === 'task' ? 'note' : 'task';
                      handleUpdateActiveNote('type', nextType);
                      triggerToast(`Switched document format to ${nextType.toUpperCase()}.`);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase border transition cursor-pointer flex items-center gap-1.5 ${
                      activeNote.type === 'task' 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {activeNote.type === 'task' ? <CheckSquare className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    <span>{activeNote.type === 'task' ? 'Work Task' : 'Note Document'}</span>
                  </button>

                  {/* Pin option directly in editor */}
                  <button
                    type="button"
                    onClick={() => handleTogglePin(activeNote.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      activeNote.isPinned 
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                        : 'bg-slate-900 border-slate-850 text-gray-400 hover:text-amber-400'
                    }`}
                    title={activeNote.isPinned ? "Unpin document" : "Pin to top of list"}
                  >
                    <Pin className="w-3 h-3" />
                    <span className="hidden sm:inline">{activeNote.isPinned ? 'Pinned' : 'Pin'}</span>
                  </button>
                  {/* Top Edit Mode Indicator */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-xl text-[10px] font-bold font-mono uppercase">
                    <Pencil className="w-3 h-3 shrink-0" />
                    <span>Edit Document</span>
                  </div>
                </div>

                {/* Editor operations: Full Tab toggle, Save, Copy, Export, and Delete */}
                <div className="flex items-center gap-2.5 select-none font-sans ml-auto flex-wrap">
                  {/* Full Tab Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isFullTab;
                      setIsFullTab(next);
                      if (isMobileListOpen) {
                        setIsMobileListOpen(false);
                      }
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        document.getElementById('notepad-workspace-root')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 20);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border active:scale-95 transition cursor-pointer ${
                      isFullTab 
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-[#0a0b0f] hover:bg-slate-900 text-gray-300 hover:text-white border-slate-850'
                    }`}
                    title={isFullTab ? "Exit Full Tab mode (Split View)" : "Open Full Tab workspace"}
                  >
                    {isFullTab ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span>{isFullTab ? 'Split View' : 'Full Tab'}</span>
                  </button>

                  {/* Save Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (editorRef.current) {
                        handleUpdateActiveNote('content', editorRef.current.innerHTML);
                      }
                      handleUpdateActiveNote('updatedAt', new Date().toISOString());
                      triggerToast('Document saved successfully in Supabase.');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer select-none shadow-md shadow-emerald-500/10"
                    title="Save document changes"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Save Note</span>
                  </button>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={handleCopyContent}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0b0f] hover:bg-slate-900 text-gray-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-850 active:scale-95 transition cursor-pointer"
                    title="Copy note text to clipboard"
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

                  {/* Export Dropdown */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0b0f] hover:bg-slate-900 text-gray-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-850 active:scale-95 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-gray-500" />
                      <span>Export</span>
                    </button>
                    <div className="absolute right-0 mt-1 w-28 bg-[#0a0b0f] border border-slate-850 rounded-xl shadow-xl hidden group-hover:block hover:block z-20 overflow-hidden font-sans">
                      <button
                        type="button"
                        onClick={() => handleDownloadFile('txt')}
                        className="w-full text-left text-[11px] text-gray-300 hover:text-white hover:bg-slate-900 py-2 px-3.5 transition"
                      >
                        Text (.txt)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadFile('md')}
                        className="w-full text-left text-[11px] text-gray-300 hover:text-white hover:bg-slate-900 py-2 px-3.5 transition border-t border-slate-900"
                      >
                        Markdown (.md)
                      </button>
                    </div>
                  </div>

                  {/* Clearly Visible Delete Button with clear space */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(activeNote.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/25 hover:border-rose-400/40 active:scale-95 transition cursor-pointer ml-1"
                    title="Delete document forever"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* RICH TEXT FORMATTING TOOLBAR */}
              {/* Headings, Font Family, Font Size, Styles (Bold, Italic, Underline), Alignment */}
              <div className="px-4 py-2 border-b border-slate-900 bg-[#06070a] flex items-center gap-2 overflow-x-auto custom-scrollbar select-none">
                
                {/* Heading selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHeadingBlock('p')}
                    className="px-2 py-1 text-[11px] font-bold text-gray-400 hover:text-white rounded hover:bg-slate-850 transition"
                    title="Normal text (Paragraph)"
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHeadingBlock('h1')}
                    className="px-2 py-1 text-[11px] font-bold text-gray-400 hover:text-white rounded hover:bg-slate-850 transition"
                    title="Heading 1 (Main Header)"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHeadingBlock('h2')}
                    className="px-2 py-1 text-[11px] font-bold text-gray-400 hover:text-white rounded hover:bg-slate-850 transition"
                    title="Heading 2 (Sub-header)"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHeadingBlock('h3')}
                    className="px-2 py-1 text-[11px] font-bold text-gray-400 hover:text-white rounded hover:bg-slate-850 transition"
                    title="Heading 3 (Section Header)"
                  >
                    H3
                  </button>
                </div>

                {/* Font Family selector: changes selected text only */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
                  <Type className="w-3.5 h-3.5 text-gray-500 ml-1" />
                  <select
                    value={activeFont}
                    onMouseDown={saveSelection}
                    onChange={(e) => {
                      const selectedFont = e.target.value;
                      setActiveFont(selectedFont);
                      applyFontToSelection(selectedFont);
                    }}
                    className="bg-transparent text-white text-[11px] font-semibold focus:outline-none cursor-pointer pr-1"
                    title="Select text and choose font to apply"
                  >
                    <option value="Inter, sans-serif" className="bg-slate-900">Inter</option>
                    <option value="Outfit, sans-serif" className="bg-slate-900">Outfit</option>
                    <option value="Merriweather, serif" className="bg-slate-900">Merriweather (Serif)</option>
                    <option value="JetBrains Mono, monospace" className="bg-slate-900">Mono (JetBrains)</option>
                    <option value="'Space Grotesk', sans-serif" className="bg-slate-900">Space Grotesk</option>
                    <option value="Georgia, serif" className="bg-slate-900">Georgia</option>
                  </select>
                </div>

                {/* Font Size selector: changes selected text only */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
                  <span className="text-[10px] text-gray-500 font-mono ml-1">Size</span>
                  <select
                    value={activeFontSize}
                    onMouseDown={saveSelection}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveFontSize(val);
                      const sizeMap: Record<string, string> = {
                        '2': '12px',
                        '3': '14px',
                        '4': '16px',
                        '5': '18px',
                        '6': '22px'
                      };
                      applyFontSizeToSelection(sizeMap[val] || '14px');
                    }}
                    className="bg-transparent text-white text-[11px] font-semibold focus:outline-none cursor-pointer pr-1"
                    title="Select text and choose font size to apply"
                  >
                    <option value="2" className="bg-slate-900">Small (12px)</option>
                    <option value="3" className="bg-slate-900">Normal (14px)</option>
                    <option value="4" className="bg-slate-900">Medium (16px)</option>
                    <option value="5" className="bg-slate-900">Large (18px)</option>
                    <option value="6" className="bg-slate-900">X-Large (22px)</option>
                  </select>
                </div>

                {/* Text Formatting buttons: Bold, Italic, Underline, Strikethrough */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => executeFormat('bold')}
                    className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-slate-850 transition"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => executeFormat('italic')}
                    className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-slate-850 transition"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => executeFormat('underline')}
                    className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-slate-850 transition"
                    title="Underline (Ctrl+U)"
                  >
                    <UnderlineIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => executeFormat('strikeThrough')}
                    className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-slate-850 transition"
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Alignment buttons: Left, Center, Right, Justify */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => executeFormat('justifyLeft')}
                    className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-slate-850 transition"
                    title="Align Left"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => executeFormat('justifyCenter')}
                    className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-slate-850 transition"
                    title="Align Center"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => executeFormat('justifyRight')}
                    className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-slate-850 transition"
                    title="Align Right"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => executeFormat('justifyFull')}
                    className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-slate-850 transition"
                    title="Justify"
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Editor Workspace Core Inputs */}
              <div className="p-5 md:p-7 flex-1 flex flex-col space-y-4">
                
                {/* 1. Title Input Row & Work Task Completion Option */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850/60 pb-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {/* Task Tick/Untick Option in Editor */}
                    {activeNote.type === 'task' && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleTaskStatus(activeNote, e)}
                        title={activeNote.completed ? "Task is marked completed. Click to untick." : "Click tick when work is completed (removes from active tasks)"}
                        className={`p-2 rounded-xl border transition cursor-pointer shrink-0 flex items-center gap-2 ${
                          activeNote.completed
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/40'
                        }`}
                      >
                        {activeNote.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                        <span className="text-xs font-bold font-mono">
                          {activeNote.completed ? 'COMPLETED' : 'TICK WHEN DONE'}
                        </span>
                      </button>
                    )}

                    <input
                      ref={titleInputRef}
                      type="text"
                      value={activeNote.title}
                      onChange={(e) => handleUpdateActiveNote('title', e.target.value)}
                      placeholder={activeNote.type === 'task' ? "Enter Work Task Title..." : "Enter Document Title..."}
                      className={`w-full bg-transparent text-xl md:text-2xl font-extrabold text-white placeholder-gray-600 focus:outline-none transition ${
                        activeNote.completed ? 'line-through text-gray-500' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* 2. Tags/Metadata Inline Panel */}
                <div className="flex flex-wrap items-center gap-3 text-xs select-none">
                  <div className="flex items-center gap-1.5 text-gray-400 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-xl">
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono text-[10px] uppercase font-bold text-gray-500 mr-1">Category</span>
                    <input
                      type="text"
                      value={activeNote.category || ''}
                      onChange={(e) => handleUpdateActiveNote('category', e.target.value)}
                      placeholder="General"
                      className="bg-transparent text-white focus:outline-none placeholder-gray-700 w-24 text-[11px] font-semibold"
                    />
                  </div>

                  <span className="text-[10px] font-mono text-gray-500 tracking-wider">
                    LAST SYNCED: {new Date(activeNote.updatedAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* 3. If Type is Task: Work Task Checklist Section */}
                {activeNote.type === 'task' && (
                  <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-blue-400" />
                        <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                          Work Deliverables & Subtasks
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">
                        {(activeNote.tasks || []).filter(t => t.completed).length} / {(activeNote.tasks || []).length} done
                      </span>
                    </div>

                    {/* Subtask Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubtaskText}
                        onChange={(e) => setNewSubtaskText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                        placeholder="Add subtask or work item..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-blue-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubtask}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {/* Subtask List */}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                      {(activeNote.tasks || []).map(task => (
                        <div 
                          key={task.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-850/80 hover:border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleSubtask(task.id)}
                              className={`p-1 rounded cursor-pointer transition ${
                                task.completed ? 'text-emerald-400 bg-emerald-500/20' : 'text-gray-500 hover:text-white'
                              }`}
                              title={task.completed ? "Click to untick" : "Tick to complete"}
                            >
                              {task.completed ? <Check className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            </button>
                            <span className={`break-words ${task.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                              {task.text}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtask(task.id)}
                            className="text-gray-600 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Rich ContentEditable Main Editor */}
                <div className="flex-1 flex flex-col pt-1 min-h-[360px]">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      const html = (e.currentTarget as HTMLDivElement).innerHTML;
                      handleUpdateActiveNote('content', html);
                      saveSelection();
                    }}
                    onKeyUp={saveSelection}
                    onMouseUp={saveSelection}
                    onSelect={saveSelection}
                    data-placeholder="Start typing your documents or transcripts and let the auto-saving modules work..."
                    className="w-full flex-1 bg-transparent text-sm text-gray-200 focus:outline-none leading-relaxed custom-scrollbar font-sans font-medium p-3 rounded-xl border border-transparent focus:border-slate-850/60 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-600 notepad-editor-surface"
                    style={{ 
                      minHeight: '340px'
                    }}
                  />
                </div>

                {/* 5. Active Note Stats panel */}
                <div className="pt-3 border-t border-slate-900/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-gray-500 select-none gap-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-900">
                      Words: <strong className="text-gray-300 font-bold">{getWordCount(activeNote.content)}</strong>
                    </span>
                    <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-900">
                      Format: <strong className="text-emerald-400 font-bold uppercase">{activeNote.type || 'Note'}</strong>
                    </span>
                    {activeNote.type === 'task' && (
                      <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-900">
                        Status: <strong className={activeNote.completed ? "text-emerald-400" : "text-amber-400"}>{activeNote.completed ? 'Completed' : 'Pending Work'}</strong>
                      </span>
                    )}
                  </div>
                  <div>
                    <span>UUID: {activeNote.id.substring(0, 13)}...</span>
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
                <p className="text-xs text-gray-600">Select an existing note/task from the sidebar or instate a clean slate.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCreateDocument('note')}
                  className="py-2 px-4 bg-emerald-500 text-slate-950 rounded-xl transition text-xs font-bold cursor-pointer active:scale-95"
                >
                  Create Document
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateDocument('task')}
                  className="py-2 px-4 bg-blue-500 text-slate-950 rounded-xl transition text-xs font-bold cursor-pointer active:scale-95"
                >
                  Create Work Task
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Task Incompletion Warning Alert Dialog */}
      {/* *if user select untick it shows like warning task is not completed. */}
      {warningTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="task-warning-dialog">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Task Warning
                </h3>
                <span className="text-[11px] font-bold text-amber-400">Task is not completed!</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-300 leading-relaxed bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
              <strong>Warning:</strong> The task <em>"{warningTask.title}"</em> is currently marked as not completed. Unticking this task signifies that work remains pending and incomplete.
            </p>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWarningTask(null)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-gray-400 hover:text-white text-xs font-bold rounded-xl border border-slate-800 transition active:scale-95 cursor-pointer"
              >
                Keep Completed
              </button>
              <button
                type="button"
                onClick={handleConfirmUntick}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer"
              >
                Confirm Incomplete
              </button>
            </div>
          </div>
        </div>
      )}

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
              Are you sure you want to delete this document forever? All content will be permanently removed from Supabase and local storage.
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
                onClick={() => executeDelete(deleteConfirmId)}
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
