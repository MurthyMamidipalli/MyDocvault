import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, 
  ExternalLink, 
  Trash2, 
  FileText, 
  X, 
  Paperclip, 
  Check, 
  Pencil, 
  Eye, 
  Award, 
  BookOpen, 
  BarChart2, 
  Layers, 
  Download, 
  File, 
  Sparkles, 
  Search,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { Project } from '../types';
import { openPdfInNewTab, downloadFileUrl } from '../lib/pdfUtils';
import { supabase, STORAGE_BUCKETS, uploadFileToSupabaseStorage } from '../lib/supabase';

interface OthersTabProps {
  others: Project[];
  onAddOther: (item: Omit<Project, 'id'>) => void;
  onDeleteOther: (id: string) => void;
  onUpdateOther: (item: Project) => void;
}

const DOC_TYPES = [
  'Report',
  'Research Paper',
  'Case Study',
  'Certificate',
  'Whitepaper',
  'Presentation',
  'Other'
];

export default function OthersTab({
  others,
  onAddOther,
  onDeleteOther,
  onUpdateOther
}: OthersTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Project | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');

  // Form States
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('Report');
  const [date, setDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [techStackText, setTechStackText] = useState('');
  const [highlightsText, setHighlightsText] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // File States
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfName, setPdfName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Deduplicate and filter items
  const cleanOthers = useMemo(() => {
    const list: Project[] = [];
    const seen = new Set<string>();

    if (others && Array.isArray(others)) {
      for (const item of others) {
        const key = item.id || (item.name ? item.name.toLowerCase().trim() : '');
        if (key && !seen.has(key)) {
          seen.add(key);
          list.push(item);
        } else if (!key) {
          list.push(item);
        }
      }
    }
    return list;
  }, [others]);

  // Filtered items based on filter pill and search query
  const filteredItems = useMemo(() => {
    return cleanOthers.filter(item => {
      // Type filter
      if (selectedFilter !== 'All') {
        const itemType = (item.docType || item.category || 'Other').toLowerCase();
        if (selectedFilter.toLowerCase() !== itemType) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = (item.name || '').toLowerCase().includes(query);
        const matchesDesc = (item.description || '').toLowerCase().includes(query);
        const matchesType = (item.docType || '').toLowerCase().includes(query);
        const matchesTags = (item.techStack || []).some(t => t.toLowerCase().includes(query));
        if (!matchesName && !matchesDesc && !matchesType && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [cleanOthers, selectedFilter, searchQuery]);

  // Counts by document type
  const countsByType = useMemo(() => {
    const counts: Record<string, number> = { All: cleanOthers.length };
    for (const item of cleanOthers) {
      const type = item.docType || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }, [cleanOthers]);

  const handleStartAdd = () => {
    setEditingItem(null);
    setTitle('');
    setDocType('Report');
    const today = new Date();
    setDate(today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    setToDate('');
    setUrl('');
    setDescription('');
    setCoverUrl('');
    setPdfUrl('');
    setPdfName('');
    setTechStackText('');
    setHighlightsText('');
    setIsPublic(true);
    setShowForm(true);
  };

  const handleStartEdit = (item: Project) => {
    setEditingItem(item);
    setTitle(item.name || '');
    setDocType(item.docType || 'Report');
    setDate(item.date || '');
    setToDate(item.toDate || '');
    setUrl(item.liveUrl || '');
    setDescription(item.description || '');
    setCoverUrl(item.coverUrl || item.imageUrl || '');
    setPdfUrl(item.pdfUrl || '');
    setPdfName(item.pdfName || '');
    setTechStackText(item.techStack ? item.techStack.join(', ') : '');
    setHighlightsText(item.highlights ? item.highlights.join('\n') : '');
    setIsPublic(item.isPublic !== false);
    setShowForm(true);
  };

  const handleResetForm = () => {
    setTitle('');
    setDocType('Report');
    setDate('');
    setToDate('');
    setUrl('');
    setDescription('');
    setCoverUrl('');
    setPdfUrl('');
    setPdfName('');
    setTechStackText('');
    setHighlightsText('');
    setIsPublic(true);
    setEditingItem(null);
    setShowForm(false);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawResult = reader.result as string;
        const img = new Image();
        img.src = rawResult;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_AXIS = 600;

          if (width > height) {
            if (width > MAX_AXIS) {
              height *= MAX_AXIS / width;
              width = MAX_AXIS;
            }
          } else {
            if (height > MAX_AXIS) {
              width *= MAX_AXIS / height;
              height = MAX_AXIS;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.7);
            setCoverUrl(compressed);
          } else {
            setCoverUrl(rawResult);
          }
        };
        img.onerror = () => setCoverUrl(rawResult);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfName(file.name);
      setIsUploading(true);
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          const result = await uploadFileToSupabaseStorage(STORAGE_BUCKETS.PROJECTS, user.id, file, 'others');
          if (result && result.publicUrl) {
            setPdfUrl(result.publicUrl);
            setIsUploading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Supabase storage upload fallback:", err);
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfUrl(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const payload: Omit<Project, 'id'> = {
      name: title.trim(),
      category: 'utilities',
      type: 'other',
      docType: docType || 'Report',
      date: date.trim() || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      toDate: toDate.trim() || undefined,
      description: description.trim(),
      techStack: techStackText.trim() ? techStackText.split(',').map(t => t.trim()).filter(Boolean) : [docType || 'Document'],
      githubUrl: '',
      liveUrl: url.trim(),
      highlights: highlightsText.trim() ? highlightsText.split('\n').map(h => h.trim()).filter(Boolean) : [],
      coverUrl: coverUrl || undefined,
      imageUrl: coverUrl || undefined,
      pdfUrl: pdfUrl || undefined,
      pdfName: pdfName || undefined,
      isPublic: isPublic
    };

    if (editingItem) {
      onUpdateOther({
        ...payload,
        id: editingItem.id
      });
    } else {
      onAddOther(payload);
    }

    handleResetForm();
  };

  const getDocTypeIcon = (type?: string) => {
    switch ((type || '').toLowerCase()) {
      case 'certificate':
        return <Award className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'research paper':
        return <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'report':
        return <BarChart2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'case study':
        return <Layers className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'whitepaper':
        return <FileText className="w-4 h-4 text-cyan-400 shrink-0" />;
      default:
        return <File className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="others-pane">
      {/* 1. Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Others / Documents & Files
              <Layers className="w-5.5 h-5.5 text-emerald-400 select-none stroke-[1.5]" />
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Store and showcase your research papers, analytical reports, case studies, certificates, and external documents.
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="bg-[#10b981] hover:bg-[#059669] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition select-none active:scale-[0.98] shadow-md shadow-[#10b981]/15 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Document</span>
        </button>
      </div>

      {/* 2. Filter Pills and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Document Type Switcher */}
        <div className="flex flex-wrap items-center bg-[#0b0c10]/95 p-1 rounded-2xl border border-slate-800/80 w-fit select-none gap-1">
          {['All', 'Report', 'Research Paper', 'Case Study', 'Certificate', 'Other'].map(cat => {
            const isSelected = selectedFilter === cat;
            const count = countsByType[cat] || (cat === 'All' ? cleanOthers.length : 0);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1.5 transition select-none cursor-pointer ${
                  isSelected
                    ? 'bg-[#16171d] text-white shadow-sm border border-slate-800/85'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-gray-400 border border-slate-800">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full bg-[#0c0c10] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* 3. Grid: Displays Records */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#0c0c10] border border-slate-800/60 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-bold text-base">No documents found</h3>
            <p className="text-xs text-gray-400">
              {searchQuery ? 'No documents match your search query.' : 'Click "+ Add Document" above to upload your first report, paper, or file.'}
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedFilter('All'); }}
              className="text-xs text-emerald-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className="bg-[#0c0c10] border border-slate-800/65 rounded-[24px] overflow-hidden flex flex-col justify-between group hover:border-slate-800 transition-all duration-300 relative shadow-2xl"
            >
              {/* Document Banner */}
              <div className="h-[180px] relative select-none rounded-t-[24px] overflow-hidden flex flex-col justify-between p-5 border-b border-slate-800/40 bg-gradient-to-tr from-[#0b0c10] via-[#111218] to-[#181a24]">
                {item.coverUrl || item.imageUrl ? (
                  <img 
                    src={item.coverUrl || item.imageUrl} 
                    alt={item.name} 
                    className="absolute inset-0 w-full h-full object-cover opacity-35" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_70%)]" />
                )}

                <div className="relative z-10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono tracking-wider uppercase border border-slate-700 bg-slate-900/90 text-white">
                    {getDocTypeIcon(item.docType)}
                    <span>{item.docType || 'Document'}</span>
                  </span>

                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold border select-none ${
                    item.isPublic !== false 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-red-500/10 text-rose-450 border-red-500/20'
                  }`}>
                    {item.isPublic !== false ? 'Public' : 'Private'}
                  </div>
                </div>

                {/* Central Document Icon & Details in Banner */}
                <div className="relative z-10 flex items-center gap-3 my-auto">
                  <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-center text-emerald-400 shadow-md">
                    {item.pdfUrl ? (
                      <Paperclip className="w-6 h-6" />
                    ) : item.liveUrl ? (
                      <ExternalLink className="w-6 h-6" />
                    ) : (
                      <File className="w-6 h-6" />
                    )}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    <span className="text-[10px] font-mono text-gray-400 block truncate">
                      {item.pdfName || (item.liveUrl ? 'Online Link Attached' : 'Document File Record')}
                    </span>
                    <span className="text-xs font-bold text-gray-200 block truncate">
                      {item.date || 'Added Recently'}
                    </span>
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
                  <button 
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 bg-[#0e0e11]/90 hover:bg-[#10b981]/15 border border-slate-800 text-gray-400 hover:text-emerald-400 rounded-lg cursor-pointer transition select-none"
                    title="Edit document"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                      setDeleteId(item.id);
                      setDeleteName(item.name);
                    }}
                    className="p-1.5 bg-[#0e0e11]/90 hover:bg-rose-950 border border-slate-800 text-gray-400 hover:text-rose-400 rounded-lg cursor-pointer transition select-none"
                    title="Remove document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <h3 className="text-white font-bold text-lg md:text-xl tracking-tight leading-snug group-hover:text-emerald-400 transition-colors duration-200">
                    {item.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span>{item.date}{item.toDate ? ` - ${item.toDate}` : ''}</span>
                  </div>

                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>

                {/* Highlights / Bullet points */}
                {item.highlights && item.highlights.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/40">
                    {item.highlights.slice(0, 3).map((hl, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span className="line-clamp-2">{hl}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tags / Keywords */}
                {item.techStack && item.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.techStack.map((tag, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    {item.pdfUrl && (
                      <>
                        <button
                          onClick={() => openPdfInNewTab(item.pdfUrl!)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition select-none cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Document</span>
                        </button>
                        <button
                          onClick={() => downloadFileUrl(item.pdfUrl!, item.pdfName || `${item.name}.pdf`)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-gray-400 hover:text-white border border-slate-800 transition select-none cursor-pointer"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {item.liveUrl && (
                      <a
                        href={item.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition select-none"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>External Link</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Modal for Add / Edit Document */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b0c10] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingItem ? 'Edit Document' : 'Add New Document'}
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    Upload research papers, reports, case studies, or certificates
                  </span>
                </div>
              </div>
              <button
                onClick={handleResetForm}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-slate-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Document Title */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Supply Chain Resilience Analysis"
                  className="w-full bg-[#12131a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Document Type & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Document Type
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-[#12131a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    {DOC_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Date / Release Period
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="e.g. Oct 2026"
                    className="w-full bg-[#12131a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Description / Abstract *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of the document, findings, key takeaways, or certification details..."
                  className="w-full bg-[#12131a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              {/* PDF Document Upload */}
              <div className="border border-slate-800/80 rounded-2xl p-4 bg-[#12131a]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">File Attachment (PDF / Doc)</span>
                    <span className="text-[11px] text-gray-400">Attach the document file to view or download</span>
                  </div>
                  <input
                    type="file"
                    ref={pdfInputRef}
                    onChange={handlePdfChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{pdfUrl ? 'Replace File' : 'Upload File'}</span>
                  </button>
                </div>

                {pdfName && (
                  <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-xl text-xs text-gray-300">
                    <span className="truncate max-w-xs">{pdfName}</span>
                    <button
                      type="button"
                      onClick={() => { setPdfUrl(''); setPdfName(''); }}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Cover Image Upload */}
              <div className="border border-slate-800/80 rounded-2xl p-4 bg-[#12131a]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Cover Image / Preview Banner</span>
                    <span className="text-[11px] text-gray-400">Optional banner or header thumbnail for this card</span>
                  </div>
                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={handleCoverChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{coverUrl ? 'Change Image' : 'Upload Image'}</span>
                  </button>
                </div>

                {coverUrl && (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-800">
                    <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCoverUrl('')}
                      className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black rounded-lg text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* External Live URL */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  External URL / Link (Optional)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://doi.org/... or https://drive.google.com/..."
                  className="w-full bg-[#12131a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Tags / Keywords */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Tags / Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={techStackText}
                  onChange={(e) => setTechStackText(e.target.value)}
                  placeholder="e.g. Analytics, Machine Learning, Harvard HBR"
                  className="w-full bg-[#12131a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Key Highlights */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Key Takeaways / Highlights (one per line)
                </label>
                <textarea
                  rows={2}
                  value={highlightsText}
                  onChange={(e) => setHighlightsText(e.target.value)}
                  placeholder="Primary result or finding&#10;Secondary finding or metric"
                  className="w-full bg-[#12131a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              {/* Public Visibility Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xs font-bold text-white block">Public Visibility</span>
                  <span className="text-[11px] text-gray-400">Display this document on your public portfolio page</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-11 h-6 rounded-full transition relative cursor-pointer ${isPublic ? 'bg-emerald-500' : 'bg-slate-800'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isPublic ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-gray-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#10b981]/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Save Changes' : 'Create Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b0c10] border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Document</h3>
                <span className="text-xs text-gray-400">Are you sure you want to remove this?</span>
              </div>
            </div>

            <p className="text-xs text-gray-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <span className="font-bold text-white">{deleteName}</span> will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setDeleteId(null); setDeleteName(''); }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-gray-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteId) onDeleteOther(deleteId);
                  setDeleteId(null);
                  setDeleteName('');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
