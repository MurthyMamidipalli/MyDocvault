import React, { useState, useRef, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Mail, 
  Phone, 
  MapPin, 
  Plus, 
  X, 
  Globe, 
  Lock, 
  Eye, 
  Pencil, 
  Trash2, 
  CloudUpload, 
  Link2, 
  ChevronDown, 
  ExternalLink,
  Check,
  FileCheck,
  Download,
  AlertCircle,
  Files
} from 'lucide-react';
import { 
  PersonalProfile, 
  Skill, 
  Education, 
  Certification, 
  Experience,
  PortfolioLink,
  ResumeItem,
  generateUUID
} from '../types';
import { heavyStorage } from '../lib/heavyStorage';
import { openPdfInNewTab, downloadFileUrl, dataUrlToBlobUrl } from '../lib/pdfUtils';

export interface SelectedUploadFile {
  id: string;
  name: string;
  size: string;
  rawSize: number;
  dataUrl?: string;
  fileObj?: File;
  type?: string;
}

interface ResumeTabProps {
  profile: PersonalProfile;
  skills: Skill[];
  education: Education[];
  certifications: Certification[];
  experience: Experience[];
  links: PortfolioLink[];
  onAddLink: (link: Omit<PortfolioLink, 'id'>) => void;
  onDeleteLink: (id: string) => void;
  onUpdateLink: (link: PortfolioLink) => void;
  resumes: ResumeItem[];
  onUpdateResumes: (resumes: ResumeItem[]) => void;
  onDeleteResume?: (id: string) => void;
  onAddResumes?: (newResumes: ResumeItem[]) => void;
}

export default function ResumeTab({
  profile,
  skills,
  education,
  certifications,
  experience,
  links,
  onAddLink,
  onDeleteLink,
  onUpdateLink,
  resumes,
  onUpdateResumes,
  onDeleteResume,
  onAddResumes
}: ResumeTabProps) {
  // Tabs and State indicators
  const [activeSubTab, setActiveSubTab] = useState<'documents' | 'links'>('documents');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingResume, setViewingResume] = useState<ResumeItem | null>(null);
  const [viewerMode, setViewerMode] = useState<'original' | 'generated'>('original');
  const [editingResume, setEditingResume] = useState<ResumeItem | null>(null);
  const [editingLink, setEditingLink] = useState<PortfolioLink | null>(null);

  // Resolve user email accurately to match App.tsx localStorage & IndexedDB keys
  const resolvedEmail = (profile.email || '').toLowerCase().trim() || (() => {
    try {
      const u = localStorage.getItem('nexus_current_user');
      if (u) {
        const parsed = JSON.parse(u);
        return (parsed.email || '').toLowerCase().trim();
      }
    } catch (_) {}
    return 'global';
  })();
  const storageKey = `${resolvedEmail}_nexus_vault_resumes`;

  // Keep resumes synchronized with storage across all devices & sessions
  const saveResumesToStorage = (updatedResumes: ResumeItem[]) => {
    onUpdateResumes(updatedResumes);

    // Persist to high-capacity IndexedDB database
    heavyStorage.set(storageKey, updatedResumes).catch(dbErr => {
      console.error(`IndexedDB put failed for resumes:`, dbErr);
    });
    if (storageKey !== 'global_nexus_vault_resumes') {
      heavyStorage.set('global_nexus_vault_resumes', updatedResumes).catch(() => {});
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedResumes));
      if (storageKey !== 'global_nexus_vault_resumes') {
        localStorage.setItem('global_nexus_vault_resumes', JSON.stringify(updatedResumes));
      }
    } catch (error) {
      console.error(`Failed to save resumes to localStorage:`, error);
    }
  };

  // Only display genuine user-uploaded documents (excluding AI-generated/simulated placeholders)
  const userUploadedResumes = useMemo(() => {
    return (resumes || []).filter(r => {
      if (!r) return false;
      if (r.fileName === 'Simulated_Document.pdf') return false;
      const cleanName = (r.name || r.fileName || '').toLowerCase();
      if (cleanName.includes('simulated') || cleanName.includes('ai-generated')) return false;
      return true;
    });
  }, [resumes]);

  // State managers for Form Data (Upload Modal)
  const [recordName, setRecordName] = useState('');
  const [documentType, setDocumentType] = useState('Resume');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [isVisibilityDropdownOpen, setIsVisibilityDropdownOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; dataUrl?: string } | null>(null);
  
  // Multi-file upload states with 1GB per-file support & unlimited files
  const [selectedFiles, setSelectedFiles] = useState<SelectedUploadFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [sourceType, setSourceType] = useState<'file' | 'link'>('file');
  const [docLinkUrl, setDocLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maximum allowed file size per document is 1GB (1,073,741,824 bytes)
  const MAX_FILE_SIZE = 1024 * 1024 * 1024;

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  // State managers for Link Form Data
  const [linkPlatform, setLinkPlatform] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Embedded viewer layout settings
  const [layoutStyle, setLayoutStyle] = useState<'slate' | 'classic' | 'mono'>('slate');

  const getLayoutClasses = () => {
    switch (layoutStyle) {
      case 'classic': return 'bg-white text-slate-900 font-serif border border-slate-200';
      case 'mono': return 'bg-gray-50 text-gray-900 font-mono border border-gray-300';
      default: return 'bg-slate-900 text-white font-sans border border-slate-800';
    }
  };

  const getHeaderColor = () => {
    if (layoutStyle === 'classic' || layoutStyle === 'mono') {
      return 'border-b border-gray-300 pb-3';
    }
    return 'border-b border-slate-800 pb-4';
  };

  // Handle Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    if (e.target) e.target.value = '';
  };

  // Process single or multiple files (accepting files up to 1GB each, unlimited files)
  const processFiles = (fileList: FileList | File[]) => {
    setUploadError(null);
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    // Check 1GB size limit
    const oversized = filesArray.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      const names = oversized.map(f => `${f.name} (${formatFileSize(f.size)})`).join(', ');
      setUploadError(`The following file(s) exceed the 1GB limit and were skipped: ${names}. Each file must be under 1GB.`);
    }

    const validFiles = filesArray.filter(f => f.size <= MAX_FILE_SIZE);
    if (validFiles.length === 0) return;

    validFiles.forEach(file => {
      const formattedSize = formatFileSize(file.size);
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;

        setSelectedFiles(prev => {
          if (prev.some(f => f.name === file.name && f.rawSize === file.size)) return prev;
          return [
            ...prev,
            {
              id: fileId,
              name: file.name,
              size: formattedSize,
              rawSize: file.size,
              dataUrl,
              fileObj: file,
              type: documentType
            }
          ];
        });

        // Set single file preview as well for backward compatibility
        setSelectedFile({
          name: file.name,
          size: formattedSize,
          dataUrl
        });

        // Auto record naming for first file if user hasn't typed one
        setRecordName(curr => curr || file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveSelectedFile = (id: string) => {
    setSelectedFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      if (filtered.length === 0) {
        setSelectedFile(null);
      } else {
        setSelectedFile({
          name: filtered[0].name,
          size: filtered[0].size,
          dataUrl: filtered[0].dataUrl
        });
      }
      return filtered;
    });
  };

  // Submit secure uploads (handles single & multiple files, up to 1GB each, unlimited files)
  const handleSaveResume = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (sourceType === 'file') {
      if (editingResume) {
        // Updating existing resume entry
        const activeFile = selectedFiles[0] || selectedFile;
        const finalFileName = activeFile?.name || editingResume.fileName || "Resume.pdf";
        const finalSize = activeFile?.size || editingResume.size || "Document";
        const finalDataUrl = activeFile?.dataUrl || editingResume.fileDataUrl;

        const updatedResume: ResumeItem = {
          ...editingResume,
          name: recordName.trim() || editingResume.name,
          type: documentType,
          visibility: visibility,
          fileName: finalFileName,
          size: finalSize,
          category: documentType,
          fileDataUrl: finalDataUrl,
          fileUrl: finalDataUrl
        };

        saveResumesToStorage(resumes.map(r => r.id === editingResume.id ? updatedResume : r));
      } else {
        // Creating new resume entry or multiple resume entries
        const filesToSave = selectedFiles.length > 0 
          ? selectedFiles 
          : (selectedFile ? [{
              id: generateUUID(),
              name: selectedFile.name,
              size: selectedFile.size,
              rawSize: 0,
              dataUrl: selectedFile.dataUrl,
              type: documentType
            }] : []);

        if (filesToSave.length === 0) {
          setUploadError('Please select at least one document or PDF file to upload.');
          return;
        }

        const newItems: ResumeItem[] = filesToSave.map((sf, index) => {
          const cleanTitle = (filesToSave.length === 1 && recordName.trim())
            ? recordName.trim()
            : sf.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

          return {
            id: generateUUID(),
            name: cleanTitle || `Resume Document ${index + 1}`,
            type: sf.type || documentType,
            visibility: visibility,
            fileName: sf.name,
            size: sf.size,
            uploadDate: new Date().toISOString().split('T')[0],
            category: sf.type || documentType,
            fileDataUrl: sf.dataUrl,
            fileUrl: sf.dataUrl
          };
        });

        if (onAddResumes) {
          onAddResumes(newItems);
        } else {
          saveResumesToStorage([...newItems, ...resumes.filter(r => r.fileName !== 'Simulated_Document.pdf')]);
        }
      }
    } else {
      // Link source type
      if (!docLinkUrl.trim()) {
        setUploadError('Please enter a valid document link URL.');
        return;
      }
      const finalFileName = docLinkUrl ? docLinkUrl.replace(/(^\w+:|^)\/\//, '').substring(0, 30) : "External Link";
      const cleanUrl = docLinkUrl.trim().startsWith('http') ? docLinkUrl.trim() : `https://${docLinkUrl.trim()}`;

      const newResume: ResumeItem = {
        id: editingResume ? editingResume.id : generateUUID(),
        name: recordName.trim() || finalFileName,
        type: documentType,
        visibility: visibility,
        fileName: finalFileName,
        size: "Cloud Link",
        uploadDate: new Date().toISOString().split('T')[0],
        category: documentType,
        linkUrl: cleanUrl,
        fileUrl: cleanUrl
      };

      if (editingResume) {
        saveResumesToStorage(resumes.map(r => r.id === editingResume.id ? newResume : r));
      } else {
        if (onAddResumes) {
          onAddResumes([newResume]);
        } else {
          saveResumesToStorage([newResume, ...resumes.filter(r => r.fileName !== 'Simulated_Document.pdf')]);
        }
      }
    }

    // Reset fields
    setRecordName('');
    setDocumentType('Resume');
    setVisibility('private');
    setSelectedFiles([]);
    setSelectedFile(null);
    setDocLinkUrl('');
    setSourceType('file');
    setEditingResume(null);
    setShowUploadModal(false);
  };

  // Edit action
  const handleStartEdit = (res: ResumeItem) => {
    setEditingResume(res);
    setRecordName(res.name);
    setDocumentType(res.type || 'Resume');
    setVisibility(res.visibility || 'private');
    setSelectedFiles([]);
    setSelectedFile(res.fileName && !res.linkUrl ? { name: res.fileName, size: res.size, dataUrl: res.fileDataUrl } : null);
    setSourceType(res.linkUrl ? 'link' : 'file');
    setDocLinkUrl(res.linkUrl || '');
    setUploadError(null);
    setShowUploadModal(true);
  };

  // Delete action (invokes dedicated onDeleteResume handler to purge from Supabase & prevent resurrection)
  const handleDeleteResume = (id: string) => {
    if (onDeleteResume) {
      onDeleteResume(id);
    } else {
      saveResumesToStorage(resumes.filter(r => r.id !== id));
    }
  };

  // Start Edit Link action
  const handleStartEditLink = (lk: PortfolioLink) => {
    setEditingLink(lk);
    setLinkPlatform(lk.platform);
    setLinkLabel(lk.label);
    setLinkUrl(lk.url);
    setShowLinkModal(true);
  };

  // Submit Link upload modal
  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    const finalPlatform = (linkPlatform || 'Link').trim();
    const finalLabel = linkLabel.trim() || linkUrl.replace(/(^\w+:|^)\/\//, '');
    const finalUrl = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;

    if (editingLink) {
      onUpdateLink({
        id: editingLink.id,
        platform: finalPlatform,
        label: finalLabel,
        url: finalUrl
      });
    } else {
      onAddLink({
        platform: finalPlatform,
        label: finalLabel,
        url: finalUrl
      });
    }

    // Reset link fields
    setLinkPlatform('');
    setLinkLabel('');
    setLinkUrl('');
    setEditingLink(null);
    setShowLinkModal(false);
  };

  // 1. IMMERSIVE VIEWER VIEW: LIVE MULTI-THEMED RESUME IN FULL PAGE
  if (showViewModal && viewingResume) {
    return (
      <div className="space-y-6 animate-fade-in" id="resume-viewer-fullpage">
        {/* Navigation / Toolbar Row */}
        <div className="bg-[#0f1115] border border-slate-900 rounded-3xl p-4 sm:p-5 w-full max-w-4xl mx-auto flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowViewModal(false);
                setViewingResume(null);
              }}
              className="px-3.5 py-2 bg-slate-950/60 hover:bg-slate-900 text-gray-400 hover:text-white transition duration-200 border border-slate-800/80 hover:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>← Back to Resumes & Links</span>
            </button>
            <span className="text-slate-800">|</span>
            <div>
              <h3 className="text-sm font-bold text-white select-none line-clamp-1">
                {viewingResume.name}
              </h3>
              <p className="text-[10px] text-gray-550 font-mono tracking-wider select-none uppercase mt-0.5">
                {viewingResume.type || 'Resume'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {viewingResume.fileDataUrl && !viewingResume.fileDataUrl.includes('example.com') && (
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingResume.fileDataUrl!;
                  link.download = viewingResume.fileName || viewingResume.name;
                  link.click();
                }}
                className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition select-none shadow-md shadow-emerald-500/10"
                style={{ backgroundColor: '#10b981' }}
              >
                <Download className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                <span>Download File</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Display Canvas */}
        <div className="w-full max-w-4xl mx-auto pb-8">
          <div className="bg-[#0f1115] border border-slate-900 rounded-3xl p-4 sm:p-8 md:p-10 space-y-6 shadow-2xl relative">
            {viewingResume.fileDataUrl && !viewingResume.fileDataUrl.includes('example.com') ? (() => {
              const isPdf = viewingResume.fileDataUrl.startsWith('data:application/pdf') || (viewingResume.fileName || '').toLowerCase().endsWith('.pdf');
              const isImage = viewingResume.fileDataUrl.startsWith('data:image/') || (viewingResume.fileName || '').toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/);
              
              return (
                <div className="space-y-6 text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 bg-slate-950/40 border border-slate-900/60 rounded-2xl gap-3">
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-tight break-all">{viewingResume.fileName || viewingResume.name}</h4>
                      <p className="text-[10px] text-gray-550 font-mono uppercase mt-1 tracking-wider">
                        Document Type: {viewingResume.type} • File Size: {viewingResume.size}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button 
                        onClick={() => downloadFileUrl(viewingResume.fileDataUrl!, viewingResume.fileName || viewingResume.name)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition duration-200 text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 select-none"
                        style={{ backgroundColor: '#10b981', color: '#020617' }}
                      >
                        <Download className="w-3.5 h-3.5 text-slate-950" />
                        <span>Download File ({viewingResume.size})</span>
                      </button>
                      {isPdf && (
                        <button 
                          onClick={() => openPdfInNewTab(viewingResume.fileDataUrl!, viewingResume.fileName || viewingResume.name)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-xl transition duration-200 text-xs flex items-center gap-1.5 cursor-pointer select-none"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open PDF</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-900 rounded-2xl p-2 sm:p-4 flex justify-center items-center overflow-auto min-h-[380px]">
                    {isImage ? (
                      <div className="max-w-full max-h-[70vh] overflow-auto flex items-center justify-center p-2">
                        <img 
                          src={viewingResume.fileDataUrl} 
                          alt={viewingResume.name} 
                          className="max-w-full max-h-[65vh] object-contain rounded-xl border border-slate-850 shadow-xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : isPdf ? (
                      <div className="w-full h-full p-1 sm:p-2 flex flex-col space-y-3" style={{ minHeight: '520px' }}>
                        <iframe 
                          src={dataUrlToBlobUrl(viewingResume.fileDataUrl!)} 
                          title={viewingResume.name} 
                          className="w-full h-[55vh] sm:h-[520px] md:h-[650px] rounded-xl border border-zinc-800 bg-[#18181b]" 
                        />
                        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 px-1 gap-2">
                          <span>Interactive PDF Resume View</span>
                          <button 
                            onClick={() => openPdfInNewTab(viewingResume.fileDataUrl!, viewingResume.fileName || viewingResume.name)}
                            className="text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Native Browser Tab</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full py-16 px-6 flex flex-col justify-center items-center text-center space-y-5 bg-[#09090b] rounded-2xl border border-zinc-800/80 max-w-xl mx-auto my-4">
                        <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/15 shadow-inner">
                          <FileText className="w-12 h-12" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-white font-extrabold text-sm sm:text-base font-sans">Uploaded File Document</h4>
                          <p className="text-xs text-gray-400 leading-relaxed font-sans">
                            File Format: <span className="font-mono text-emerald-400 font-bold">{viewingResume.fileName?.split('.').pop()?.toUpperCase() || 'DOCUMENT'}</span> ({viewingResume.size})
                          </p>
                        </div>
                        <a 
                          href={viewingResume.fileDataUrl}
                          download={viewingResume.fileName || viewingResume.name}
                          className="bg-[#10b981] text-slate-950 hover:bg-emerald-600 font-sans font-extrabold px-6 py-3 rounded-xl transition-all duration-150 inline-flex items-center gap-2 cursor-pointer text-xs shadow-lg active:scale-[0.98]"
                          style={{ backgroundColor: '#10b981', color: '#020617' }}
                        >
                          <Download className="w-4 h-4 text-slate-950" />
                          <span>Download File ({viewingResume.size})</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })() : viewingResume.linkUrl && !viewingResume.linkUrl.includes('example.com') ? (
              <div className="p-8 rounded-2xl border text-center my-6 bg-slate-950/80 border-slate-800">
                <Link2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-bold mb-1 text-white">Linked Vault Document URL</p>
                <p className="text-xs text-gray-550 mb-6 max-w-md mx-auto truncate select-all font-mono">{viewingResume.linkUrl}</p>
                <a
                  href={viewingResume.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#10b981] hover:bg-emerald-600 font-bold text-slate-950 px-6 py-3 rounded-xl text-xs transition duration-200 cursor-pointer select-none shadow-lg shadow-emerald-500/10"
                  style={{ backgroundColor: '#10b981', color: '#020617' }}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
                  <span>Open External Link URL</span>
                </a>
              </div>
            ) : (
              <div className="text-center py-12 px-4 space-y-4">
                <div className="p-3 bg-amber-500/10 rounded-full text-amber-400 border border-amber-500/15 w-fit mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm">Original PDF File Needed</h4>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Please upload your original PDF file for this resume record so you can preview and download it natively.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleStartEdit(viewingResume);
                    setShowViewModal(false);
                  }}
                  className="bg-[#10b981] hover:bg-emerald-600 font-bold text-slate-950 px-5 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer transition shadow-lg"
                >
                  <CloudUpload className="w-4 h-4 text-slate-950" />
                  <span>Upload Original PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. SECURE CREATOR / EXCLUSIVE EDIT FORM: FULL PAGE WIZARD
  if (showUploadModal) {
    return (
      <div className="space-y-6 animate-fade-in" id="resume-upload-fullpage">
        {/* Navigation Toolbar */}
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-900/80">
          <button
            type="button"
            onClick={() => {
              setShowUploadModal(false);
              setEditingResume(null);
              setSelectedFile(null);
            }}
            className="px-3.5 py-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-850 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none"
          >
            <span>← Cancel & Return to Vault</span>
          </button>
        </div>

        {/* Spacious, premium form area */}
        <div className="bg-[#0f1115] border border-slate-900 rounded-3xl p-6 sm:p-10 w-full max-w-2xl mx-auto space-y-6 text-left shadow-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Secure Upload</h2>
            <p className="text-xs text-gray-400 mt-1">Host your professional records in the cloud vault.</p>
          </div>

          <form onSubmit={handleSaveResume} className="space-y-5">
            {/* Record Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block select-none">Record Name</label>
              <input 
                type="text"
                required
                value={recordName}
                onChange={e => setRecordName(e.target.value)}
                placeholder="e.g. Senior CV"
                className="w-full bg-[#08090d] border border-slate-800/80 rounded-xl px-4 py-3.5 text-white text-sm focus:border-emerald-500 outline-none placeholder-gray-650 select-text"
              />
            </div>

            {/* Grid for Doc Type & Visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Document Type select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block select-none">Document Type</label>
                <div className="relative">
                  <select
                    value={documentType}
                    onChange={e => setDocumentType(e.target.value)}
                    className="w-full bg-[#08090d] border border-slate-800/80 rounded-xl px-4 py-3.5 text-white text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer pr-10 select-none"
                  >
                    <option value="Resume">Resume</option>
                    <option value="CV">CV</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Secure Visibility selector dropdown */}
              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block select-none">Visibility Status</label>
                <button
                  type="button"
                  onClick={() => setIsVisibilityDropdownOpen(!isVisibilityDropdownOpen)}
                  className="w-full bg-[#08090d] border border-slate-800/80 hover:border-slate-700/85 rounded-xl px-4 py-3.5 text-white text-sm focus:border-emerald-500 outline-none flex items-center justify-between cursor-pointer select-none"
                  style={isVisibilityDropdownOpen ? { borderColor: '#10b981' } : {}}
                >
                  <div className="flex items-center gap-2">
                    {visibility === 'private' ? (
                      <>
                        <Lock className="w-4 h-4 text-amber-500" />
                        <span>Private</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>Public</span>
                      </>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {isVisibilityDropdownOpen && (
                  <div className="absolute left-0 right-0 top-[76px] bg-[#12141c] border border-slate-800 rounded-xl overflow-hidden z-50 shadow-xl py-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setVisibility('private');
                        setIsVisibilityDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-xs text-white hover:bg-slate-900/80 transition flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span className={visibility === 'private' ? 'text-white font-bold' : 'text-gray-400'}>Private</span>
                      </div>
                      {visibility === 'private' && (
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setVisibility('public');
                        setIsVisibilityDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-xs text-white hover:bg-slate-900/80 transition flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        <span className={visibility === 'public' ? 'text-white font-bold' : 'text-gray-400'}>Public</span>
                      </div>
                      {visibility === 'public' && (
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      )}
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Upload error display */}
            {uploadError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Source Method Option Box and Toggle Section */}
            {sourceType === 'file' ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pr-1">
                  <span className="text-[11px] text-gray-400 font-mono">
                    {selectedFiles.length > 0 
                      ? `${selectedFiles.length} ${selectedFiles.length === 1 ? 'file' : 'files'} selected` 
                      : 'Accepts files < 1GB • Unlimited files'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceType('link');
                      setSelectedFile(null);
                      setSelectedFiles([]);
                      setUploadError(null);
                    }}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition duration-155 cursor-pointer select-none"
                  >
                    🔗 Handle via External Link URL instead
                  </button>
                </div>

                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 transition-all flex flex-col items-center justify-center gap-3 bg-[#08090d] cursor-pointer relative ${
                    isDragging 
                      ? 'border-emerald-500 bg-[#080d0d]' 
                      : 'border-slate-800/85 hover:border-slate-700/80 hover:bg-[#0c0e12]'
                  }`}
                  title="Click or drag to select document files (multiple allowed, up to 1GB each)"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                    multiple
                    className="hidden" 
                  />

                  <CloudUpload className="w-10 h-10 text-emerald-400/80 stroke-[1.5]" />
                  <div className="text-center">
                    <p className="text-xs sm:text-sm font-bold text-gray-200 select-none">
                      {selectedFiles.length > 0 ? '+ Click to Add More Files' : 'Select or Drag & Drop Documents'}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-semibold font-mono select-none mt-1">
                      Accepts files &lt; 1GB each • Add unlimited files • Multiple file upload
                    </p>
                    <p className="text-[10px] text-gray-500 select-none mt-0.5">
                      Supports PDF, DOC, DOCX, PNG, JPG, and TXT
                    </p>
                  </div>
                </div>

                {/* Selected Files Queue List (Multiple Documents Display) */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 mt-3 pt-2 border-t border-slate-900">
                    <div className="flex justify-between items-center px-1 text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Files className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ready to Upload ({selectedFiles.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFiles([]);
                          setSelectedFile(null);
                        }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer select-none"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                      {selectedFiles.map((f, idx) => (
                        <div 
                          key={f.id}
                          className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-850 rounded-xl gap-2 hover:border-slate-800 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-white truncate" title={f.name}>
                                {f.name}
                              </p>
                              <p className="text-[10px] text-gray-400 font-mono">
                                {f.size}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleRemoveSelectedFile(f.id);
                            }}
                            className="p-1 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                            title="Remove file from upload queue"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Link URL Input Field */
              <div className="space-y-2 animate-fade-in">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block select-none">Link URL</label>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceType('file');
                      setDocLinkUrl('');
                    }}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition duration-155 cursor-pointer select-none"
                  >
                    📁 Upload Local File instead
                  </button>
                </div>
                <input 
                  type="url"
                  required
                  value={docLinkUrl}
                  onChange={e => setDocLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#08090d] border border-slate-800/80 rounded-xl px-4 py-3.5 text-white text-sm focus:border-emerald-500 outline-none placeholder-gray-650 select-text"
                />
              </div>
            )}

            {/* Custom styled save submit trigger */}
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-4 rounded-2xl transition duration-200 cursor-pointer text-center text-sm shadow-md shadow-emerald-500/10 active:scale-[0.99] block select-none mt-4"
              style={{ backgroundColor: '#10b981' }}
            >
              {editingResume 
                ? 'Update Record Parameters' 
                : (selectedFiles.length > 1 
                    ? `Upload All ${selectedFiles.length} Documents & Resumes` 
                    : 'Save Record in Vault')}
            </button>

          </form>
        </div>
      </div>
    );
  }

  // 3. EDIT DIRECTORY / EXTERNAL WEB LINKS FORM: FULL PAGE WIZARD
  if (showLinkModal) {
    return (
      <div className="space-y-6 animate-fade-in" id="link-upload-fullpage">
        {/* Navigation Toolbar */}
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-900/80">
          <button
            type="button"
            onClick={() => {
              setShowLinkModal(false);
              setEditingLink(null);
            }}
            className="px-3.5 py-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-850 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none"
          >
            <span>← Cancel & Return to Vault</span>
          </button>
        </div>

        {/* Main form card container */}
        <div className="bg-[#0f1115] border border-slate-900 rounded-3xl p-6 sm:p-10 w-full max-w-2xl mx-auto space-y-6 text-left shadow-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {editingLink ? 'Edit Directory Link' : 'Add Directory Link'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Link, showcase, and anchor your external online profile directories.
            </p>
          </div>

          <form onSubmit={handleSaveLink} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block select-none">Name</label>
              <input 
                type="text"
                required
                value={linkLabel}
                onChange={e => {
                  setLinkLabel(e.target.value);
                  if (!linkPlatform) setLinkPlatform('Link');
                }}
                placeholder="Enter link name"
                className="w-full bg-[#08090d] border border-slate-800/80 rounded-xl px-4 py-3.5 text-white text-sm focus:border-emerald-500 outline-none placeholder-gray-600 select-text"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block select-none">Link</label>
              <input 
                type="text"
                required
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="Enter link (e.g. https://...)"
                className="w-full bg-[#08090d] border border-slate-800/80 rounded-xl px-4 py-3.5 text-white text-sm focus:border-emerald-500 outline-none placeholder-gray-650 select-text"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-4 rounded-2xl transition duration-200 cursor-pointer text-center text-sm shadow-md block select-none mt-4"
              style={{ backgroundColor: '#10b981' }}
            >
              {editingLink ? 'Update Portal Entry' : 'Save Portal Entry'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. PRINCIPAL VAULT DASHBOARD BOARD VIEW
  return (
    <div className="space-y-6 animate-fade-in" id="resume-vault-tab">
      
      {/* 1. Header and Add Trigger Buttons */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b border-slate-900/80">
        <div className="flex items-center gap-3">
          <span className="text-3xl select-none">📜</span>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Resume & Links Vault</h1>
            <p className="text-xs text-gray-400 mt-1">High-performance CV intelligence and document vault.</p>
          </div>
        </div>

        {activeSubTab === 'documents' ? (
          <button
            onClick={() => {
              setEditingResume(null);
              setRecordName('');
              setDocumentType('Resume');
              setVisibility('private');
              setSelectedFile(null);
              setDocLinkUrl('');
              setSourceType('file');
              setShowUploadModal(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0 active:scale-98 select-none"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>Add Resumes & CV'S</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setEditingLink(null);
              setLinkPlatform('');
              setLinkLabel('');
              setLinkUrl('');
              setShowLinkModal(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0 active:scale-98 select-none"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>Add Link</span>
          </button>
        )}
      </div>

      {/* 2. Sub-tab select segmented capsule - fully responsive for mobile, tablet, laptop */}
      <div className="flex items-center gap-1 p-1 bg-[#0a0b0f] border border-slate-900 rounded-xl w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('documents')}
          className={`flex items-center justify-center gap-2 flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${
            activeSubTab === 'documents'
              ? 'bg-[#15171e] text-white shadow-sm border border-slate-800'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Resumes & CV'S</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-900 text-gray-400 rounded-full font-mono">{userUploadedResumes.length}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('links')}
          className={`flex items-center justify-center gap-2 flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${
            activeSubTab === 'links'
              ? 'bg-[#15171e] text-white shadow-sm border border-slate-800'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Link2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Links</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-900 text-gray-400 rounded-full font-mono">{links.length}</span>
        </button>
      </div>

      {/* 3. Primary Grid lists */}
      {activeSubTab === 'documents' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userUploadedResumes.length === 0 ? (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-900 rounded-2xl bg-[#0f1115]/30 p-6 space-y-3">
              <FileCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-gray-300 font-bold">No uploaded resumes found</p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">Upload your original PDF resume or CV to store and view it here.</p>
              <button
                type="button"
                onClick={() => {
                  setEditingResume(null);
                  setRecordName('');
                  setDocumentType('Resume');
                  setVisibility('private');
                  setSelectedFile(null);
                  setDocLinkUrl('');
                  setSourceType('file');
                  setShowUploadModal(true);
                }}
                className="mt-2 bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer transition select-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload First Resume PDF</span>
              </button>
            </div>
          ) : userUploadedResumes.map(res => (
            <div 
              key={res.id} 
              className="bg-[#0f1115] border border-slate-900 rounded-2xl p-6 relative group flex flex-col justify-between transition-all duration-300 hover:border-slate-800"
            >
              
              {/* Card Header row with badges and buttons */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-1.5">
                  {res.visibility === 'public' ? (
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 select-none">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span>Public</span>
                    </span>
                  ) : (
                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 select-none">
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Private</span>
                    </span>
                  )}

                  {res.linkUrl && (
                    <span className="bg-blue-500/15 border border-blue-500/20 text-blue-400 text-[10px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 select-none">
                      <Link2 className="w-3 h-3 text-blue-400" />
                      <span>URL</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 sm:gap-3.5 shrink-0">
                  <button 
                    type="button"
                    onClick={() => handleStartEdit(res)}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/50 hover:border-emerald-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-md shadow-emerald-950/30 active:scale-95 select-none"
                    title="Edit record parameters"
                  >
                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 stroke-[2.2]" />
                    <span>Edit</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDeleteResume(res.id)}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-rose-600/20 text-rose-300 hover:text-rose-200 border border-rose-500/50 hover:border-rose-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-md shadow-rose-950/30 active:scale-95 select-none"
                    title="Delete record from vault"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 stroke-[2.2]" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Main Info section */}
              <div className="flex items-center gap-4 mt-1">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-emerald-400 shrink-0 flex items-center justify-center">
                  <FileCheck className="w-7 h-7 text-emerald-400 stroke-[1.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white truncate pr-2 select-text" title={res.name}>
                    {res.name}
                  </h3>
                  <span className="text-[10px] text-emerald-400/80 tracking-widest font-bold font-mono uppercase mt-1 block select-none">
                    {res.type || 'Resume'}
                  </span>
                </div>
              </div>

              {/* Bottom utility info & Viewer Button */}
              <div className="mt-6">
                <button
                  onClick={() => {
                    setViewingResume(res);
                    setViewerMode('original');
                    setShowViewModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-750 text-gray-300 hover:text-white font-semibold py-3 px-4 rounded-xl text-xs transition duration-200 cursor-pointer select-none"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Resume</span>
                </button>
                
                <div className="flex justify-between items-center text-[10px] text-gray-500 mt-3 font-mono px-1">
                  <span>Size: {res.size}</span>
                  <span>Uploaded: {res.uploadDate}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* Links tab content */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {links.map(lk => (
            <div 
              key={lk.id} 
              className="bg-[#0f1115] border border-slate-900 rounded-2xl p-6 relative group flex flex-col justify-between transition-all duration-300 hover:border-slate-800"
            >
              
              {/* Card Header row with badges and buttons */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="bg-[#1a1a24] border border-slate-800 text-slate-400 text-[10px] px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5 select-none">
                  <Link2 className="w-3 h-3 text-emerald-400" />
                  <span>Active Link</span>
                </span>

                <div className="flex flex-wrap items-center gap-3 sm:gap-3.5 shrink-0">
                  <a
                    href={lk.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 hover:text-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm select-none"
                    title="Go to link in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 stroke-[2.2]" />
                    <span>Visit</span>
                  </a>
                  <button 
                    type="button"
                    onClick={() => handleStartEditLink(lk)}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-sky-600/20 text-sky-300 hover:text-sky-200 border border-sky-500/50 hover:border-sky-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm select-none"
                    title="Edit portal link"
                  >
                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 stroke-[2.2]" />
                    <span>Edit</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => onDeleteLink(lk.id)}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-rose-600/20 text-rose-300 hover:text-rose-200 border border-rose-500/50 hover:border-rose-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm select-none"
                    title="Remove Link"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 stroke-[2.2]" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Main Info section */}
              <div className="flex items-center gap-4 mt-1">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-emerald-400 shrink-0 flex items-center justify-center">
                  <Link2 className="w-6 h-6 text-emerald-400 stroke-[1.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white truncate pr-2 select-text" title={lk.platform}>
                    {lk.platform}
                  </h3>
                  <span className="text-[10px] text-gray-400 truncate mt-1 block select-text font-mono">
                    {lk.label}
                  </span>
                </div>
              </div>

              {/* Bottom Viewer Link Button */}
              <div className="mt-6">
                <a
                  href={lk.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-750 text-gray-300 hover:text-white font-semibold py-3 px-4 rounded-xl text-xs transition duration-200 cursor-pointer select-none text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open URL</span>
                </a>
                
                <div className="text-center text-[10px] text-gray-500 mt-3 font-mono truncate px-1">
                  {lk.url}
                </div>
              </div>

            </div>
          ))}

          {links.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-900 rounded-2xl bg-[#0f1115]/30 p-6 space-y-3">
              <Link2 className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-gray-300 font-bold">No active links found</p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">Add links to your portfolio networks to share and sync them with Supabase.</p>
              <button
                type="button"
                onClick={() => {
                  setEditingLink(null);
                  setLinkPlatform('');
                  setLinkLabel('');
                  setLinkUrl('');
                  setShowLinkModal(true);
                }}
                className="mt-2 bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer transition select-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Your First Link</span>
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
