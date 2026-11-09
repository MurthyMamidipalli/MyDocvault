import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, 
  ExternalLink, 
  GitBranch, 
  Trash2, 
  Star, 
  Package, 
  Folder, 
  Calendar, 
  Sprout, 
  Layers, 
  Image as ImageIcon,
  FileText, 
  X, 
  Paperclip,
  Check,
  TrendingUp,
  BarChart2,
  Grid,
  Pencil,
  Eye,
  Lock,
  Award,
  BookOpen,
  Link2,
  Download,
  File,
  Loader2,
  FileCheck
} from 'lucide-react';
import { Project, isDemoItem, toUUID } from '../types';
import { openPdfInNewTab, downloadFileUrl } from '../lib/pdfUtils';
import { supabase, STORAGE_BUCKETS, uploadFileToSupabaseStorage } from '../lib/supabase';

interface ProjectsTabProps {
  projects: Project[];
  products?: Project[];
  others?: Project[];
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject: (project: Project) => void;
}

export default function ProjectsTab({
  projects,
  products,
  others,
  onAddProject,
  onDeleteProject,
  onUpdateProject
}: ProjectsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'project' | 'product' | 'other'>('project');
  const [editingItem, setEditingItem] = useState<Project | null>(null);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');

  // Modal Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  
  // Others category specific state
  const [docType, setDocType] = useState<string>('Report');

  // Custom File States (stored as Base64 strings)
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfName, setPdfName] = useState<string>('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isReadingCover, setIsReadingCover] = useState(false);

  // Advanced States
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [category, setCategory] = useState<Project['category']>('utilities');
  const [techStackText, setTechStackText] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [highlightsText, setHighlightsText] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Refs for hidden inputs
  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingCardItem, setPendingCardItem] = useState<Project | null>(null);
  const [pendingCardAction, setPendingCardAction] = useState<'open' | 'download'>('open');

  const resolveFileUrlByName = (targetName: string): string => {
    if (!targetName) return '';
    const cleanTarget = targetName.trim().toLowerCase();
    
    // 1. Check all projects, products, others
    const all = [...(projects || []), ...(products || []), ...(others || [])];
    for (const p of all) {
      if (!p) continue;
      const pName = (p.pdfName || (p as any).fileName || '').trim().toLowerCase();
      const pUrl = p.pdfUrl || (p as any).fileUrl || '';
      if (pName === cleanTarget && pUrl) return pUrl;
    }

    // 2. Check localStorage documents and resumes
    try {
      const email = getCurrentUserEmail();
      if (email) {
        const rawDocs = localStorage.getItem(`${email}_documents`);
        if (rawDocs) {
          const docs = JSON.parse(rawDocs);
          if (Array.isArray(docs)) {
            for (const d of docs) {
              const dName = (d.name || d.fileName || d.title || '').trim().toLowerCase();
              if ((dName === cleanTarget || cleanTarget.includes(dName)) && d.fileUrl) return d.fileUrl;
            }
          }
        }
        const rawResumes = localStorage.getItem(`${email}_nexus_vault_resumes`);
        if (rawResumes) {
          const resumes = JSON.parse(rawResumes);
          if (Array.isArray(resumes)) {
            for (const r of resumes) {
              const rName = (r.name || r.fileName || '').trim().toLowerCase();
              if ((rName === cleanTarget || cleanTarget.includes(rName)) && (r.fileUrl || r.dataUrl)) return r.fileUrl || r.dataUrl;
            }
          }
        }
      }
    } catch (_) {}

    return '';
  };

  const handleCardOpen = (item: Project, cardPdfUrl: string, cardPdfName: string) => {
    if (cardPdfUrl) {
      openPdfInNewTab(cardPdfUrl, cardPdfName || `${item.name.replace(/\s+/g, '_')}.pdf`);
      return;
    }
    const resolved = resolveFileUrlByName(cardPdfName);
    if (resolved) {
      openPdfInNewTab(resolved, cardPdfName || `${item.name.replace(/\s+/g, '_')}.pdf`);
      if (onUpdateProject) {
        onUpdateProject({ ...item, pdfUrl: resolved, pdfName: cardPdfName });
      }
      return;
    }
    setPendingCardItem(item);
    setPendingCardAction('open');
    cardFileInputRef.current?.click();
  };

  const handleCardDownload = (item: Project, cardPdfUrl: string, cardPdfName: string) => {
    if (cardPdfUrl) {
      downloadFileUrl(cardPdfUrl, cardPdfName || `${item.name.replace(/\s+/g, '_')}.pdf`);
      return;
    }
    const resolved = resolveFileUrlByName(cardPdfName);
    if (resolved) {
      downloadFileUrl(resolved, cardPdfName || `${item.name.replace(/\s+/g, '_')}.pdf`);
      if (onUpdateProject) {
        onUpdateProject({ ...item, pdfUrl: resolved, pdfName: cardPdfName });
      }
      return;
    }
    setPendingCardItem(item);
    setPendingCardAction('download');
    cardFileInputRef.current?.click();
  };

  const isUserLoggedIn = typeof window !== 'undefined' && Boolean(localStorage.getItem('nexus_current_user'));

  // 1. Projects: ONLY project records
  const projectItems = useMemo(() => {
    const list: Project[] = [];
    const seen = new Set<string>();

    const candidateProjects = projects.filter(p => {
      if (!p) return false;
      if (isUserLoggedIn && isDemoItem(p)) return false;
      if (p.type === 'product' || p.type === 'other' || p.category === 'products' || p.category === 'others' || Boolean(p.docType)) return false;
      if (products && products.some(prod => Boolean(prod.id && p.id && prod.id === p.id))) return false;
      if (others && others.some(oth => Boolean(oth.id && p.id && oth.id === p.id))) return false;
      return true;
    });

    for (const p of candidateProjects) {
      const idKey = p.id ? toUUID(p.id).toLowerCase().trim() : '';
      const nameKey = (p.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (idKey) {
        if (seen.has(`id:${idKey}`)) continue;
        seen.add(`id:${idKey}`);
      } else if (nameKey) {
        if (seen.has(`name:${nameKey}`)) continue;
        seen.add(`name:${nameKey}`);
      }
      list.push(p);
    }
    return list;
  }, [projects, products, others, isUserLoggedIn]);

  // 2. Products: ONLY product records
  const productItems = useMemo(() => {
    const list: Project[] = [];
    const seen = new Set<string>();

    const allCandidates = [
      ...(products && Array.isArray(products) ? products : []),
      ...(projects && Array.isArray(projects) ? projects.filter(p => p.type === 'product' || p.category === 'products') : [])
    ];

    for (const p of allCandidates) {
      if (!p) continue;
      if (isUserLoggedIn && isDemoItem(p)) continue;
      if (p.type && p.type !== 'product' && p.category !== 'products') continue;

      const idKey = p.id ? toUUID(p.id).toLowerCase().trim() : '';
      const nameKey = (p.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (idKey) {
        if (seen.has(`id:${idKey}`)) continue;
        seen.add(`id:${idKey}`);
      } else if (nameKey) {
        if (seen.has(`name:${nameKey}`)) continue;
        seen.add(`name:${nameKey}`);
      }
      list.push(p);
    }
    return list;
  }, [projects, products, isUserLoggedIn]);

  // 3. Others: ONLY other documents/files (excluding certificates)
  const otherItems = useMemo(() => {
    const list: Project[] = [];
    const seen = new Set<string>();

    const isNonCertificate = (p: Project) => {
      const dt = (p.docType || '').toLowerCase();
      return dt !== 'certificate';
    };

    const allCandidates = [
      ...(others && Array.isArray(others) ? others : []),
      ...(projects && Array.isArray(projects) ? projects.filter(p => p.type === 'other' || p.category === 'others' || Boolean(p.docType)) : [])
    ];

    for (const p of allCandidates) {
      if (!p) continue;
      if (isUserLoggedIn && isDemoItem(p)) continue;
      if (p.type && p.type !== 'other' && p.category !== 'others' && !p.docType) continue;
      if (!isNonCertificate(p)) continue;

      const idKey = p.id ? toUUID(p.id).toLowerCase().trim() : '';
      const nameKey = (p.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (idKey) {
        if (seen.has(`id:${idKey}`)) continue;
        seen.add(`id:${idKey}`);
      } else if (nameKey) {
        if (seen.has(`name:${nameKey}`)) continue;
        seen.add(`name:${nameKey}`);
      }
      list.push(p);
    }
    return list;
  }, [projects, others, isUserLoggedIn]);

  // Active items based on selected tab
  const currentItems = useMemo(() => {
    if (activeFilter === 'project') return projectItems;
    if (activeFilter === 'product') return productItems;
    return otherItems;
  }, [activeFilter, projectItems, productItems, otherItems]);

  const handleStartEdit = (item: Project) => {
    setEditingItem(item);
    setTitle(item.name || '');
    setDate(item.date || '');
    setToDate(item.toDate || '');
    setUrl(item.liveUrl || '');

    const rawDesc = item.description || '';
    let extractedBanner = item.coverUrl || item.imageUrl || '';
    if (!extractedBanner && rawDesc.includes('<!--banner:')) {
      const match = rawDesc.match(/<!--banner:([\s\S]*?)-->/);
      if (match) extractedBanner = match[1];
    }
    setCoverUrl(extractedBanner);

    let extractedFilename = item.pdfName || (item as any).fileName || '';
    if (!extractedFilename && rawDesc.includes('<!--filename:')) {
      const match = rawDesc.match(/<!--filename:([\s\S]*?)-->/);
      if (match) extractedFilename = match[1];
    }
    setPdfName(extractedFilename);

    const cleanDesc = rawDesc.replace(/<!--banner:[\s\S]*?-->/g, '').replace(/<!--filename:[\s\S]*?-->/g, '').trim();
    setDescription(cleanDesc);

    setPdfUrl(item.pdfUrl || (item as any).fileUrl || '');
    setCategory(item.category || 'utilities');
    setDocType(item.docType || 'Report');
    setTechStackText(item.techStack ? item.techStack.join(', ') : '');
    setGithubUrl(item.githubUrl || '');
    setHighlightsText(item.highlights ? item.highlights.join('\n') : '');
    setIsPublic(item.isPublic !== false);
    setShowForm(true);

    // Smoothly scroll to the form so the user immediately sees the form editing this item
    setTimeout(() => {
      const el = document.getElementById('project-form-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleStartAdd = () => {
    setEditingItem(null);
    setTitle('');
    const today = new Date();
    const formatted = today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    setDate(formatted);
    setToDate('');
    setUrl('');
    setDescription('');
    setCoverUrl('');
    setPdfUrl('');
    setPdfName('');
    setTechStackText('');
    setGithubUrl('');
    setHighlightsText('');
    setCategory('utilities');
    setDocType('Report');
    setIsPublic(true);
    setShowForm(true);
  };

  const handleResetForm = () => {
    setTitle('');
    setDate('');
    setToDate('');
    setUrl('');
    setDescription('');
    setCoverUrl('');
    setPdfUrl('');
    setPdfName('');
    setTechStackText('');
    setGithubUrl('');
    setHighlightsText('');
    setCategory('utilities');
    setDocType('Report');
    setIsPublic(true);
    setEditingItem(null);
    setIsReadingFile(false);
    setIsReadingCover(false);
    setShowForm(false);
  };

  // File Change Handlers - Process and attach immediately without blocking UI
  const processCoverFile = (file: File) => {
    setIsReadingCover(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = event.target?.result as string;
      if (!rawResult) {
        setIsReadingCover(false);
        return;
      }
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
        setIsReadingCover(false);
      };
      img.onerror = () => {
        setCoverUrl(rawResult);
        setIsReadingCover(false);
      };
    };
    reader.onerror = () => {
      setIsReadingCover(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCoverFile(file);
    }
    e.target.value = '';
  };

  const processPdfFile = (file: File) => {
    setPdfName(file.name);
    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPdfUrl(event.target.result as string);
      }
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setIsReadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPdfFile(file);
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadingFile || isReadingCover) return;
    if (!title.trim() || !description.trim()) return;

    if (activeFilter === 'other') {
      // Others: reports, research papers, case studies, certificates, PDFs
      const otherData: Omit<Project, 'id'> = {
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
        onUpdateProject({
          ...otherData,
          id: editingItem.id
        });
      } else {
        onAddProject(otherData);
      }
    } else {
      // Standard Project / Product record
      const actualTechStack = techStackText.trim()
        ? techStackText.split(',').map(t => t.trim()).filter(Boolean)
        : ['Power BI', 'MySQL', 'Excel'];

      const actualHighlights = highlightsText.trim()
        ? highlightsText.split('\n').map(h => h.trim()).filter(Boolean)
        : ['Interactive KPI trackers built securely', 'Automated scale modeling included'];

      const projectData: Omit<Project, 'id'> = {
        name: title.trim(),
        category: category,
        type: activeFilter, // 'project' or 'product'
        date: date.trim() || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        toDate: toDate.trim() || undefined,
        description: description.trim(),
        techStack: actualTechStack,
        githubUrl: githubUrl.trim() || (url ? url : ''),
        liveUrl: url.trim(),
        highlights: actualHighlights,
        coverUrl: coverUrl || undefined,
        imageUrl: coverUrl || undefined,
        pdfUrl: pdfUrl || undefined,
        pdfName: pdfName || undefined,
        isPublic: isPublic
      };

      if (editingItem) {
        onUpdateProject({
          ...projectData,
          id: editingItem.id
        });
      } else {
        onAddProject(projectData);
      }
    }

    handleResetForm();
  };

  // Helper to get matching icon for document type
  const getDocTypeIcon = (type?: string) => {
    switch ((type || '').toLowerCase()) {
      case 'research paper':
        return <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'report':
        return <BarChart2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'case study':
        return <Layers className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'whitepaper':
        return <FileText className="w-4 h-4 text-cyan-400 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-8" id="projects-pane">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {activeFilter === 'project' && 'Projects'}
            {activeFilter === 'product' && 'Products'}
            {activeFilter === 'other' && 'Other Documents & Files'}
            <Sprout className="w-5.5 h-5.5 text-emerald-400 select-none stroke-[1.5]" />
          </h2>
        </div>
        
        {/* Dynamic Add Button depending on active category */}
        <button
          onClick={handleStartAdd}
          className="bg-[#10b981] hover:bg-[#059669] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition select-none active:scale-[0.98] shadow-md shadow-[#10b981]/15 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeFilter === 'project' && 'Add Project'}
            {activeFilter === 'product' && 'Add Product'}
            {activeFilter === 'other' && 'Add Document'}
          </span>
        </button>
      </div>

      {/* 3 Categories Segmented Switcher: [ Projects ] [ Products ] [ Others ] */}
      <div className="flex flex-wrap items-center bg-[#0b0c10]/95 p-1 rounded-2xl border border-slate-800/80 w-fit select-none gap-1">
        <button
          type="button"
          onClick={() => {
            setActiveFilter('project');
            setShowForm(false);
          }}
          className={`px-5 sm:px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-2 transition select-none cursor-pointer ${
            activeFilter === 'project'
              ? 'bg-[#16171d] text-white shadow-sm border border-slate-800/85'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Folder className="w-4 h-4 text-emerald-400 stroke-[1.75]" />
          <span>Projects</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-gray-400 border border-slate-800">
            {projectItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveFilter('product');
            setShowForm(false);
          }}
          className={`px-5 sm:px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-2 transition select-none cursor-pointer ${
            activeFilter === 'product'
              ? 'bg-[#16171d] text-white shadow-sm border border-slate-800/85'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-400 stroke-[1.75]" />
          <span>Products</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-gray-400 border border-slate-800">
            {productItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveFilter('other');
            setShowForm(false);
          }}
          className={`px-5 sm:px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-2 transition select-none cursor-pointer ${
            activeFilter === 'other'
              ? 'bg-[#16171d] text-white shadow-sm border border-slate-800/85'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400 stroke-[1.75]" />
          <span>Others</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-gray-400 border border-slate-800">
            {otherItems.length}
          </span>
        </button>
      </div>

      {/* Styled Inline Form (Placed at TOP for immediate visibility upon clicking Add Project) */}
      {showForm && (
        <form 
          id="project-form-container"
          onSubmit={handleSubmit} 
          className="bg-slate-900 border-2 border-emerald-500/40 p-6 md:p-8 rounded-2xl space-y-6 mt-2 max-w-4xl shadow-2xl relative"
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {activeFilter === 'other' ? (
                    editingItem ? 'Edit Document / File' : 'Add New Document / File'
                  ) : (
                    editingItem 
                      ? `Edit ${activeFilter === 'product' ? 'Product' : 'Project'}` 
                      : `Add New ${activeFilter === 'product' ? 'Product' : 'Project'}`
                  )}
                </h3>
                {editingItem && (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5 shadow-sm">
                    <Pencil className="w-3 h-3 text-blue-400" />
                    <span>Target: {editingItem.name}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {editingItem 
                  ? `Editing only "${editingItem.name}". Only this record will be updated, leaving other items intact.`
                  : activeFilter === 'other' 
                    ? 'Add reports, research papers, case studies, certificates, or other PDFs/documents.'
                    : `Enter details for your ${activeFilter === 'product' ? 'product release' : 'project showcase'}.`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetForm}
              className="p-1.5 text-gray-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Cancel and close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Title / Name Field */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">
                {activeFilter === 'other' ? 'Document / File Name' : 'Title / Name'} *
              </label>
              <input 
                type="text" 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={
                  activeFilter === 'other'
                    ? "e.g. Q4 Financial Growth Report or AI Safety Research Paper"
                    : "e.g. HR Analytics Dashboard"
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#10b981] outline-none"
              />
            </div>

            {/* Others Category: Document Type Selector */}
            {activeFilter === 'other' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-400">Document Type *</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#10b981] outline-none"
                  >
                    <option value="Report">Report</option>
                    <option value="Research paper">Research paper</option>
                    <option value="Case study">Case study</option>
                    <option value="Whitepaper">Whitepaper</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-400">Date Added *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Sep 2026"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#10b981] outline-none"
                  />
                </div>
              </div>
            )}

            {/* Projects & Products Date & To Date Grid */}
            {activeFilter !== 'other' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-400">From Date / Start Date *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. June 2026"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#10b981] outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-400">To Date / End Date (Optional)</label>
                  <input 
                    type="text" 
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    placeholder="e.g. Aug 2026 or Present"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#10b981] outline-none"
                  />
                </div>
              </div>
            )}

            {/* File Link / URL */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">
                {activeFilter === 'other' ? 'File Link / External URL (Optional)' : 'Live URL (Optional)'}
              </label>
              <input 
                type="url" 
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder={activeFilter === 'other' ? "https://drive.google.com/... or https://..." : "https://..."}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#10b981] outline-none"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Description *</label>
              <textarea 
                rows={4}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={
                  activeFilter === 'other'
                    ? "Brief description of the document, methodology, executive summary, or key conclusions..."
                    : "Describe the project goals, challenges resolved, and architectural results..."
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#10b981] outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Visibility Selector */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Visibility Status</label>
              <div className="flex gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    isPublic 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-950 text-gray-500 border-slate-850 hover:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Public (Visible in public portfolio)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    !isPublic 
                      ? 'bg-red-500/10 text-rose-400 border-red-500/30' 
                      : 'bg-slate-950 text-gray-500 border-slate-850 hover:text-white'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Private (Hidden from public portfolio)</span>
                </button>
              </div>
            </div>

            {/* Hidden File Inputs */}
            <input 
              type="file" 
              ref={coverInputRef}
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
            <input 
              type="file" 
              ref={pdfInputRef}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,image/*"
              onChange={handlePdfChange}
              className="hidden"
            />
            <input 
              type="file" 
              ref={cardFileInputRef}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && pendingCardItem && onUpdateProject) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const url = reader.result as string;
                    const updated: Project = {
                      ...pendingCardItem,
                      pdfUrl: url,
                      pdfName: file.name
                    };
                    onUpdateProject(updated);
                    if (pendingCardAction === 'download') {
                      downloadFileUrl(url, file.name);
                    } else {
                      openPdfInNewTab(url, file.name);
                    }
                    setPendingCardItem(null);
                  };
                  reader.readAsDataURL(file);
                }
                if (cardFileInputRef.current) cardFileInputRef.current.value = '';
              }}
              className="hidden"
            />

            {/* File Upload Dropzones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File / PDF Upload panel */}
              <div className="space-y-1 flex flex-col">
                <label className="text-xs font-mono text-gray-400 select-none">
                  {activeFilter === 'other' ? 'File / Document (PDF, Word, Excel)' : 'Documentation (PDF, Word, Excel)'}
                </label>
                <div 
                  onClick={() => pdfInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) processPdfFile(file);
                  }}
                  className={`border border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition flex-1 min-h-[110px] select-none ${
                    (pdfUrl || pdfName || isReadingFile)
                      ? 'border-[#10b981]/50 bg-slate-950' 
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/45'
                  }`}
                >
                  {isReadingFile ? (
                    <div className="space-y-1.5 w-full flex flex-col items-center">
                      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                      <span className="text-[11px] text-emerald-400 font-bold block truncate max-w-[220px]">
                        Reading {pdfName || 'file'}...
                      </span>
                      <span className="text-[9px] text-gray-400">Processing document content...</span>
                    </div>
                  ) : (pdfUrl || pdfName) ? (
                    <div className="space-y-1.5 w-full flex flex-col items-center">
                      <FileCheck className="w-6 h-6 text-[#10b981]" />
                      <span className="text-[11px] text-[#10b981] font-bold block truncate max-w-[220px]" title={pdfName}>
                        {pdfName || "document.pdf"}
                      </span>
                      <span className="text-[9px] text-emerald-400/80 font-mono">
                        {pdfUrl ? '✓ Document Ready to Save' : '✓ Document Attached'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPdfUrl('');
                          setPdfName('');
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer pt-0.5"
                      >
                        <X className="w-3 h-3" /> Remove / Change file
                      </button>
                    </div>
                  ) : (
                    <>
                      <Paperclip className="w-5.5 h-5.5 text-gray-500 mb-1.5 stroke-[1.5]" />
                      <span className="text-[11px] text-gray-300 font-semibold">
                        Upload Document (PDF, Word, Excel)
                      </span>
                      <span className="text-[9px] text-gray-500 mt-0.5">Click or drop file (PDF, DOCX, XLSX, etc.)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Visual Cover upload panel */}
              <div className="space-y-1 flex flex-col">
                <label className="text-xs font-mono text-gray-400 select-none">
                  Visual Cover Image (Optional)
                </label>
                <div 
                  onClick={() => coverInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) processCoverFile(file);
                  }}
                  className={`border border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition flex-1 min-h-[110px] select-none ${
                    (coverUrl || isReadingCover)
                      ? 'border-emerald-500/50 bg-slate-950' 
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/45'
                  }`}
                >
                  {isReadingCover ? (
                    <div className="space-y-1.5 w-full flex flex-col items-center">
                      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                      <span className="text-[11px] text-emerald-400 font-bold block">
                        Processing image...
                      </span>
                    </div>
                  ) : coverUrl ? (
                    <div className="space-y-1.5 w-full flex flex-col items-center">
                      <img src={coverUrl} className="w-12 h-10 object-cover rounded mx-auto border border-emerald-500/20 shadow-md" alt="Preview" />
                      <span className="text-[10px] text-emerald-400 font-bold block truncate max-w-[120px]">Image Loaded</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverUrl('');
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Remove image
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-5.5 h-5.5 text-gray-500 mb-1.5 stroke-[1.5]" />
                      <span className="text-[11px] text-gray-300 font-semibold">Upload Image Banner</span>
                      <span className="text-[9px] text-gray-500 mt-0.5">JPEG, PNG or WebP</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Section for Projects and Products */}
            {activeFilter !== 'other' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-[10px] font-mono text-gray-400 hover:text-white transition flex items-center gap-1.5 select-none"
                >
                  <span>{showAdvanced ? '[-] Standard Setup Options' : '[+] Optional Technology Metadata'}</span>
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-slide-up">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-gray-400 uppercase">Interactive Type Sub-Category</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value as any)}
                        className="w-full bg-[#1e1e24] border border-slate-800 rounded-lg p-2 text-xs text-white"
                      >
                        <option value="utilities">Technical Utility / Dashboards</option>
                        <option value="enterprise">Enterprise Tooling</option>
                        <option value="frontend">Frontend Platform</option>
                        <option value="fullstack">Fullstack SaaS Application</option>
                        <option value="open-source">Open Source Ecosystem</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-gray-400 uppercase">Tech Stack (comma separated)</label>
                      <input 
                        type="text" 
                        placeholder="Power BI, MySQL, Excel, Python"
                        value={techStackText}
                        onChange={e => setTechStackText(e.target.value)}
                        className="w-full bg-[#1e1e24] border border-[#10b981]/40 rounded-lg p-2 text-xs text-white outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-gray-400 uppercase">GitHub Repository Link</label>
                      <input 
                        type="url" 
                        placeholder="https://github.com/..."
                        value={githubUrl}
                        onChange={e => setGithubUrl(e.target.value)}
                        className="w-full bg-[#1e1e24] border border-[#10b981]/40 rounded-lg p-2 text-xs text-white outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-gray-400 uppercase">Key Milestones (one bullet per line)</label>
                      <textarea 
                        rows={2}
                        placeholder="Identified 3 major key drivers&#10;Helped optimize headcount planning"
                        value={highlightsText}
                        onChange={e => setHighlightsText(e.target.value)}
                        className="w-full bg-[#1e1e24] border border-[#10b981]/40 rounded-lg p-2 text-xs text-white outline-none resize-none leading-normal"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 text-xs font-bold pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl cursor-pointer transition border border-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isReadingFile || isReadingCover}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl cursor-pointer transition shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isReadingFile ? 'Reading file...' : isReadingCover ? 'Processing cover...' : editingItem ? `Update "${editingItem.name}"` : 'Save Record'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Grid: Displays Records for Active Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl">
        {currentItems.map(item => {
          let cardCover = item.coverUrl || item.imageUrl || '';
          if (!cardCover && item.description && item.description.includes('<!--banner:')) {
            const m = item.description.match(/<!--banner:([\s\S]*?)-->/);
            if (m) cardCover = m[1];
          }
          let cardPdfUrl = item.pdfUrl || (item as any).fileUrl || '';
          let cardPdfName = item.pdfName || (item as any).fileName || '';
          if (!cardPdfName && item.description && item.description.includes('<!--filename:')) {
            const m = item.description.match(/<!--filename:([\s\S]*?)-->/);
            if (m) cardPdfName = m[1];
          }
          const cleanDesc = (item.description || '')
            .replace(/<!--banner:[\s\S]*?-->/g, '')
            .replace(/<!--filename:[\s\S]*?-->/g, '')
            .trim();

          return (
            <div 
              key={item.id} 
              className="bg-[#0c0c10] border border-slate-800/65 rounded-[24px] overflow-hidden flex flex-col justify-between group hover:border-slate-800 transition-all duration-300 relative shadow-2xl"
            >
              {/* Top Mockup / Header Banner */}
              {activeFilter === 'other' ? (
                /* Dedicated Others Document Header Banner */
                <div className="h-[180px] relative select-none rounded-t-[24px] overflow-hidden flex flex-col justify-between p-5 border-b border-slate-800/40 bg-gradient-to-tr from-[#0b0c10] via-[#111218] to-[#181a24]">
                  {cardCover ? (
                    <img 
                      src={cardCover} 
                      alt={item.name} 
                      className="absolute inset-0 w-full h-full object-cover opacity-35" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_70%)]" />
                  )}

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono tracking-wider uppercase border border-slate-700 bg-slate-900/90 text-white">
                        {getDocTypeIcon(item.docType)}
                        <span>{item.docType || 'Document'}</span>
                      </span>
                    </div>

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
                      {cardPdfUrl ? (
                        <Paperclip className="w-6 h-6" />
                      ) : item.liveUrl ? (
                        <Link2 className="w-6 h-6" />
                      ) : (
                        <File className="w-6 h-6" />
                      )}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      <span className="text-[10px] font-mono text-gray-400 block truncate">
                        {cardPdfName || (item.liveUrl ? 'Online Link Attached' : 'Document File Record')}
                      </span>
                      <span className="text-xs font-bold text-gray-200 block truncate">
                        {item.date || 'Added Recently'}
                      </span>
                    </div>
                  </div>


                </div>
              ) : (
                /* Projects & Products Mockup / Cover Region */
                <div className="h-[220px] relative select-none rounded-t-[24px] overflow-hidden flex items-center justify-center border-b border-slate-800/40">
                  {cardCover ? (
                    <img 
                      src={cardCover} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#0e0e11] to-[#1a1b24] p-4 flex flex-col justify-between overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.035),transparent_70%)]" />
                      
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                          <span className="text-[9px] font-mono text-slate-500 ml-2 tracking-wide truncate max-w-[120px]">
                            {item.name.toLowerCase().replace(/\s+/g, '-')}.xlsx
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-900/30">
                            {activeFilter === 'product' ? 'PRODUCT RELEASE' : 'ANALYTICS ASSET'}
                          </span>
                        </div>
                      </div>

                      {/* Dashboard Visual Simulator */}
                      <div className="grid grid-cols-4 gap-2.5 my-auto z-10">
                        <div className="col-span-2 bg-[#121217] border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-mono text-gray-500 uppercase whitespace-nowrap">Status</span>
                            <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                          </div>
                          <span className="text-xs font-bold text-white tracking-tight mt-1">Verified</span>
                          <span className="text-[7px] text-emerald-400 font-mono mt-0.5">Production Ready</span>
                        </div>
                        
                        <div className="col-span-2 bg-[#121217] border border-slate-800 p-2 rounded-xl flex items-center justify-center">
                          <div className="relative w-10 h-10 rounded-full border-2 border-emerald-400/20 flex items-center justify-center">
                            <div className="absolute inset-0.5 rounded-full border-t-2 border-r-2 border-emerald-400" />
                            <span className="text-[8px] font-extrabold text-slate-300">CRM</span>
                          </div>
                          <div className="ml-1 px-1 flex flex-col">
                            <span className="text-[7px] font-mono text-slate-400">MySQL</span>
                            <span className="text-[7.5px] font-mono text-emerald-400 font-extrabold">Active</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/40 pt-2 text-[10px]">
                        <div className="flex items-center gap-1 text-slate-500 font-mono">
                          <Grid className="w-3 h-3 text-slate-650" />
                          <span>Interactive Showcase</span>
                        </div>
                        <span className="text-[8.5px] font-mono text-slate-500 uppercase">Production Environment</span>
                      </div>
                    </div>
                  )}


                </div>
              )}

              {/* Content Area */}
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <h3 className="text-white font-bold text-lg md:text-xl tracking-tight leading-snug group-hover:text-emerald-400 transition-colors duration-200">
                    {item.name}
                  </h3>
                  
                  {/* Date and Meta Row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-1.5 text-gray-400 text-xs font-semibold select-none">
                      <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item.date || 'Jan 2026'}{item.toDate ? ` – ${item.toDate}` : ''}</span>
                    </div>

                    {activeFilter === 'other' && item.docType && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold border bg-slate-900 border-slate-800 text-emerald-400">
                        {item.docType}
                      </span>
                    )}

                    {activeFilter !== 'other' && (
                      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold border select-none ${
                        item.isPublic !== false 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' 
                          : 'bg-red-500/10 text-rose-450 border-red-500/10'
                      }`}>
                        {item.isPublic !== false ? 'Public' : 'Private'}
                      </div>
                    )}
                  </div>

                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed font-sans mt-2">
                    {cleanDesc}
                  </p>
                </div>

                {/* Highlights & Tech Tags for Projects & Products */}
                {activeFilter !== 'other' && (
                  <div className="space-y-4 pt-1">
                    {item.highlights && item.highlights.length > 0 && (
                      <div className="space-y-1.5 bg-slate-950/20 p-3 rounded-xl border border-slate-850/60">
                        <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 select-none">
                          <Star className="w-3 h-3 text-emerald-400" />
                          Key Insights / Accomplishments
                        </span>
                        <ul className="text-[11px] text-gray-450 space-y-1 pl-1 font-sans">
                          {item.highlights.slice(0, 3).map((hl, idx) => (
                            <li key={idx} className="flex gap-2 items-start text-xs leading-normal">
                              <span className="text-emerald-450 font-bold font-mono shrink-0">›</span>
                              <span className="line-clamp-2">{hl}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tech stack badges */}
                    {item.techStack && item.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.techStack.map((tech, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-900/80 border border-slate-800 rounded text-[10px] font-mono text-gray-400">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Links & File Downloads */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/40 pt-4 text-xs font-mono">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-950 px-2 py-0.5 border border-slate-850 rounded select-none truncate">
                    {activeFilter === 'other' ? (item.docType || 'DOCUMENT') : (item.category || 'SHOWCASE')}
                  </span>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Open and Download File Buttons - Always visible when file or filename is present */}
                    {(cardPdfUrl || cardPdfName) && (
                      <div className="flex items-center gap-2">
                        {cardPdfName && (
                          <span className="text-gray-400 font-mono text-[10px] hidden sm:flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 select-none" title={`Attached: ${cardPdfName}`}>
                            <Paperclip className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[120px]">{cardPdfName}</span>
                          </span>
                        )}
                        <button 
                          onClick={() => handleCardOpen(item, cardPdfUrl, cardPdfName)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981]/15 border border-[#10b981]/30 hover:bg-[#10b981]/25 text-emerald-400 font-bold rounded-xl transition-colors text-xs cursor-pointer"
                          title={cardPdfName ? `Open ${cardPdfName}` : 'Open file'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </button>
                        <button 
                          onClick={() => handleCardDownload(item, cardPdfUrl, cardPdfName)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-gray-300 hover:text-white font-bold rounded-xl transition-colors text-xs cursor-pointer"
                          title={cardPdfName || "Download file"}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    )}

                    {/* GitHub Repo Link (For projects) */}
                    {activeFilter === 'project' && item.githubUrl && (
                      <a 
                        href={item.githubUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-gray-550 shrink-0" />
                        <span>Code</span>
                      </a>
                    )}

                    {/* Live URL or External Link */}
                    {item.liveUrl && (
                      <a 
                        href={item.liveUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                      >
                        <span>{activeFilter === 'other' ? 'Open Link' : 'Live'}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    )}

                    {/* Explicit Edit & Delete action buttons in the bottom row for 100% clarity and immediate access */}
                    <button 
                      onClick={() => handleStartEdit(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-400 hover:text-blue-300 font-bold rounded-xl transition-colors text-xs cursor-pointer select-none"
                      title={`Edit ${item.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button 
                      onClick={() => {
                        setDeleteId(item.id);
                        setDeleteName(item.name);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/40 text-rose-400 hover:text-rose-300 font-bold rounded-xl transition-colors text-xs cursor-pointer select-none"
                      title={`Delete ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State when no items in current tab */}
        {currentItems.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-16 bg-slate-950/40 border border-slate-850 rounded-[24px] flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-gray-600">
              {activeFilter === 'product' ? (
                <Package className="w-8 h-8" />
              ) : activeFilter === 'other' ? (
                <FileText className="w-8 h-8" />
              ) : (
                <Layers className="w-8 h-8" />
              )}
            </div>
            <div className="space-y-1">
              <h4 className="text-gray-300 font-bold text-sm">
                {activeFilter === 'project' && 'No projects recorded yet'}
                {activeFilter === 'product' && 'No products recorded yet'}
                {activeFilter === 'other' && 'No documents or files in Others yet'}
              </h4>
              <p className="text-gray-500 text-xs max-w-sm">
                {activeFilter === 'project' && 'Click "+ Add Project" to publish technical projects.'}
                {activeFilter === 'product' && 'Click "+ Add Product" to publish product assets.'}
                {activeFilter === 'other' && 'Click "+ Add Document" to add reports, research papers, case studies, certificates, or other PDFs.'}
              </p>
            </div>
          </div>
        )}
      </div>



      {/* Custom Confirmation Modal overlay for deletion */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0e11] border border-slate-800/90 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl p-6 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto text-rose-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-bold text-base font-sans">
                  Delete {activeFilter === 'other' ? 'Document' : activeFilter === 'product' ? 'Product' : 'Project'}?
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans max-w-xs mx-auto">
                  Are you absolutely sure you want to delete <strong className="text-gray-200">"{deleteName}"</strong>? This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteId(null);
                  setDeleteName('');
                }}
                className="flex-grow py-2.5 text-xs font-semibold border border-slate-800 text-gray-400 hover:text-white rounded-xl hover:bg-slate-950 transition cursor-pointer select-none text-center active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProject(deleteId);
                  setDeleteId(null);
                  setDeleteName('');
                }}
                className="flex-grow py-2.5 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg transition cursor-pointer select-none text-center active:scale-95"
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
