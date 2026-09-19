import React, { useState, useRef } from 'react';
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
  Download
} from 'lucide-react';
import { 
  PersonalProfile, 
  Skill, 
  Education, 
  Certification, 
  Experience,
  PortfolioLink,
  ResumeItem
} from '../types';
import { heavyStorage } from '../lib/heavyStorage';

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
  onUpdateResumes
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

  const emailLower = (profile.email || '').toLowerCase().trim();
  const storageKey = `${emailLower || 'global'}_nexus_vault_resumes`;

  // Keep resumes synchronized with storage
  const saveResumesToStorage = (updatedResumes: ResumeItem[]) => {
    onUpdateResumes(updatedResumes);

    // Persist to high-capacity IndexedDB database
    heavyStorage.set(storageKey, updatedResumes).catch(dbErr => {
      console.error(`IndexedDB put failed for resumes:`, dbErr);
    });

    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedResumes));
    } catch (error) {
      console.error(`Failed to save resumes to localStorage:`, error);
    }
  };

  // State managers for Form Data (Upload Modal)
  const [recordName, setRecordName] = useState('');
  const [documentType, setDocumentType] = useState('Resume & CV');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [isVisibilityDropdownOpen, setIsVisibilityDropdownOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; dataUrl?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sourceType, setSourceType] = useState<'file' | 'link'>('file');
  const [docLinkUrl, setDocLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State managers for Link Form Data
  const [linkPlatform, setLinkPlatform] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Embedded viewer layout settings
  const [layoutStyle, setLayoutStyle] = useState<'slate' | 'classic' | 'mono'>('slate');

  const getLayoutClasses = () => {
    switch (layoutStyle) {
      case 'classic': return 'bg-white text-slate-900 font-serif border border-slate-250';
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const sizeKB = Math.round(file.size / 1024);
    const sizeDisplay = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile({
        name: file.name,
        size: sizeDisplay,
        dataUrl: event.target?.result as string
      });
      // Fast record auto-naming if user hasn't specified one yet
      if (!recordName) {
        setRecordName(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit secure uploads
  const handleSaveResume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordName.trim()) return;

    let finalFileName = "Simulated_Document.pdf";
    let finalSize = "120 KB";

    if (sourceType === 'file' && selectedFile) {
      finalFileName = selectedFile.name;
      finalSize = selectedFile.size;
    } else if (sourceType === 'link') {
      finalFileName = docLinkUrl ? docLinkUrl.replace(/(^\w+:|^)\/\//, '').substring(0, 30) : "External Link";
      finalSize = "Cloud Link";
    }

    const newResume: ResumeItem = {
      id: editingResume ? editingResume.id : `res-${Date.now()}`,
      name: recordName.trim(),
      type: documentType,
      visibility: visibility,
      fileName: finalFileName,
      size: finalSize,
      uploadDate: new Date().toISOString().split('T')[0],
      category: "SUPABASE",
      fileDataUrl: sourceType === 'file' ? selectedFile?.dataUrl : undefined,
      linkUrl: sourceType === 'link' ? docLinkUrl : undefined
    };

    if (editingResume) {
      saveResumesToStorage(resumes.map(r => r.id === editingResume.id ? newResume : r));
    } else {
      saveResumesToStorage([newResume, ...resumes]);
    }

    // Reset fields
    setRecordName('');
    setDocumentType('Resume & CV');
    setVisibility('private');
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
    setDocumentType(res.type);
    setVisibility(res.visibility);
    setSelectedFile(res.fileName && !res.linkUrl ? { name: res.fileName, size: res.size, dataUrl: res.fileDataUrl } : null);
    setSourceType(res.linkUrl ? 'link' : 'file');
    setDocLinkUrl(res.linkUrl || '');
    setShowUploadModal(true);
  };

  // Delete action
  const handleDeleteResume = (id: string) => {
    saveResumesToStorage(resumes.filter(r => r.id !== id));
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
    if (!linkPlatform.trim() || !linkUrl.trim()) return;

    const finalPlatform = linkPlatform.trim();
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
        <div className="bg-[#0f1115] border border-slate-900 rounded-3xl p-5 w-full max-w-4xl mx-auto flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowViewModal(false);
                setViewingResume(null);
              }}
              className="px-3.5 py-2 bg-slate-950/60 hover:bg-slate-900 text-gray-400 hover:text-white transition duration-200 border border-slate-800/80 hover:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>← Back to Vault</span>
            </button>
            <span className="text-slate-800">|</span>
            <div>
              <h3 className="text-sm font-bold text-white select-none line-clamp-1">
                {viewingResume.name}
              </h3>
              <p className="text-[10px] text-gray-500 font-mono tracking-wider select-none uppercase mt-0.5">
                {viewingResume.category} // {viewingResume.type}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {viewerMode === 'generated' && (
              /* Style Selector */
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800/80 flex gap-1">
                {([
                  { id: 'slate', label: 'Tech Slate' },
                  { id: 'classic', label: 'Classic' },
                  { id: 'mono', label: 'Mono Dev' }
                ] as const).map(style => (
                  <button
                    key={style.id}
                    onClick={() => setLayoutStyle(style.id)}
                    className={`px-3 py-1.5 text-[10px] font-mono rounded-lg transition cursor-pointer select-none ${
                      layoutStyle === style.id 
                        ? 'bg-slate-800 text-white font-bold' 
                        : 'text-gray-500 hover:text-gray-400'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                if (viewerMode === 'original' && viewingResume.fileDataUrl) {
                  // Direct download file
                  const link = document.createElement('a');
                  link.href = viewingResume.fileDataUrl;
                  link.download = viewingResume.fileName || viewingResume.name;
                  link.click();
                } else {
                  window.print();
                }
              }}
              className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition select-none shadow-md shadow-emerald-500/10"
              style={{ backgroundColor: '#10b981' }}
            >
              {viewerMode === 'original' && viewingResume.fileDataUrl ? (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  <span>Download File</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  <span>Print / PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Display Canvas */}
        <div className="w-full max-w-4xl mx-auto pb-8">
          {viewerMode === 'original' ? (
            <div className="bg-[#0f1115] border border-slate-900 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl relative">
              {viewingResume.fileDataUrl ? (() => {
                const isPdf = viewingResume.fileDataUrl.startsWith('data:application/pdf') || (viewingResume.fileName || '').toLowerCase().endsWith('.pdf');
                const isImage = viewingResume.fileDataUrl.startsWith('data:image/') || (viewingResume.fileName || '').toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/);
                
                return (
                  <div className="space-y-6 text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-950/40 border border-slate-900/60 rounded-2xl gap-3">
                      <div>
                        <h4 className="text-white font-bold text-sm tracking-tight">{viewingResume.fileName || viewingResume.name}</h4>
                        <p className="text-[10px] text-gray-550 font-mono uppercase mt-1 tracking-wider">
                          Document Type: {viewingResume.type} • File Size: {viewingResume.size}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <a 
                          href={viewingResume.fileDataUrl}
                          download={viewingResume.fileName || viewingResume.name}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition duration-200 text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 select-none"
                          style={{ backgroundColor: '#10b981', color: '#020617' }}
                        >
                          <Download className="w-3.5 h-3.5 text-slate-950" />
                          <span>Download File ({viewingResume.size})</span>
                        </a>
                        {isPdf && (
                          <a 
                            href={viewingResume.fileDataUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-xl transition duration-200 text-xs flex items-center gap-1.5 cursor-pointer select-none"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open PDF</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 flex justify-center items-center overflow-auto min-h-[380px]">
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
                        <div className="w-full py-16 px-6 flex flex-col justify-center items-center text-center space-y-5 bg-[#09090b] rounded-2xl border border-zinc-800/80 max-w-xl mx-auto my-4">
                          <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/15 shadow-inner">
                            <FileText className="w-12 h-12" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-white font-extrabold text-sm sm:text-base font-sans">Uploaded PDF Resume</h4>
                            <p className="text-xs text-gray-400 leading-relaxed font-sans max-w-sm">
                              Browser policies restrict previewing raw Base64 PDFs directly inside iFrame sandboxes. Open in a secure external tab or download the file directly to view.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3 justify-center">
                            <a 
                              href={viewingResume.fileDataUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-[#10b981] text-slate-950 hover:bg-[#059669] font-sans font-extrabold px-5 py-2.5 rounded-xl transition-all duration-150 inline-flex items-center gap-2 cursor-pointer text-xs shadow-lg shadow-[#10b981]/20 active:scale-[0.98]"
                              style={{ backgroundColor: '#10b981', color: '#020617' }}
                            >
                              <ExternalLink className="w-4 h-4 text-slate-950" />
                              <span>Open PDF in New Tab</span>
                            </a>
                            <a 
                              href={viewingResume.fileDataUrl}
                              download={viewingResume.fileName || viewingResume.name}
                              className="bg-slate-900 border border-slate-800 text-white hover:bg-slate-850 font-sans font-semibold px-5 py-2.5 rounded-xl transition-all duration-150 inline-flex items-center gap-2 cursor-pointer text-xs active:scale-[0.98]"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download PDF File</span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full py-16 px-6 flex flex-col justify-center items-center text-center space-y-5 bg-[#09090b] rounded-2xl border border-zinc-800/80 max-w-xl mx-auto my-4">
                          <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/15 shadow-inner">
                            <FileText className="w-12 h-12" />
                          </div>
                          <div className="space-y-1.5">
                            <h4 className="text-white font-extrabold text-sm sm:text-base font-sans">Safe File Attachment</h4>
                            <p className="text-xs text-gray-400 leading-relaxed font-sans">
                              Uploaded File Format: <span className="font-mono text-emerald-400 font-bold">{viewingResume.fileName?.split('.').pop()?.toUpperCase() || 'DOCUMENT'}</span> ({viewingResume.size})
                            </p>
                          </div>
                          <a 
                            href={viewingResume.fileDataUrl}
                            download={viewingResume.fileName || viewingResume.name}
                            className="bg-[#10b981] text-slate-950 hover:bg-emerald-600 font-sans font-extrabold px-6 py-3 rounded-xl transition-all duration-150 inline-flex items-center gap-2 cursor-pointer text-xs shadow-lg active:scale-[0.98]"
                            style={{ backgroundColor: '#10b981', color: '#020617' }}
                          >
                            <Download className="w-4 h-4 text-slate-950" />
                            <span>Download Resume Attachment ({viewingResume.size})</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : viewingResume.linkUrl ? (
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
                <div className="text-center py-12 text-gray-400 text-xs">
                  No original uploaded document file or link exists for this record.
                </div>
              )}
            </div>
          ) : (
            <div className={`p-8 md:p-12 text-left rounded-3xl shadow-xl space-y-6 transition-all duration-300 print:shadow-none print:p-0 ${getLayoutClasses()}`} id="resume-print-area">
              
              {/* Profile Block */}
              <div className={getHeaderColor()}>
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight select-text">{profile.name}</h1>
                    <p className={`text-sm font-semibold tracking-wide uppercase mt-1 ${layoutStyle === 'slate' ? 'text-emerald-400 font-bold' : 'text-blue-705'}`}>
                      {profile.headline}
                    </p>
                  </div>

                  <div className={`text-xs space-y-1.5 md:text-right font-mono ${layoutStyle === 'slate' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="flex items-center md:justify-end gap-1.5 select-text">
                      <Mail className="w-3.5 h-3.5 opacity-60" />
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex items-center md:justify-end gap-1.5 select-text">
                      <Phone className="w-3.5 h-3.5 opacity-60" />
                      <span>{profile.phone}</span>
                    </div>
                    <div className="flex items-center md:justify-end gap-1.5 select-text">
                      <MapPin className="w-3.5 h-3.5 opacity-60" />
                      <span>{profile.location}</span>
                    </div>
                  </div>
                </div>

                {profile.bio && (
                  <p className={`text-xs md:text-sm mt-4 leading-relaxed italic select-text ${layoutStyle === 'slate' ? 'text-gray-400' : 'text-gray-600'}`}>
                    "{profile.bio}"
                  </p>
                )}
              </div>

              {viewingResume.linkUrl && (
                <div className={`p-6 rounded-2xl border text-center my-4 print:hidden transition-all duration-300 ${
                  layoutStyle === 'slate' 
                    ? 'bg-slate-950/80 border-slate-800' 
                    : 'bg-gray-100 border-gray-300 font-sans'
                }`}>
                  <Link2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className={`text-sm font-bold mb-1 ${layoutStyle === 'slate' ? 'text-white' : 'text-slate-900'}`}>Linked Vault Document</p>
                  <p className="text-xs text-gray-550 mb-4 max-w-md mx-auto truncate select-all">{viewingResume.linkUrl}</p>
                  <a
                    href={viewingResume.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#10b981] hover:bg-emerald-600 font-bold text-slate-950 px-5 py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer select-none"
                    style={{ backgroundColor: '#10b981', color: '#020617' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
                    <span>Open External Link URL</span>
                  </a>
                </div>
              )}

              {/* Work Experience */}
              <div className="space-y-4">
                <h3 className={`text-xs md:text-sm font-mono font-bold uppercase tracking-wider ${layoutStyle === 'slate' ? 'text-gray-400 border-b border-slate-800/80 pb-1.5' : 'text-gray-700 border-b border-gray-300 pb-1'}`}>
                  Professional Experience Timeline
                </h3>
                
                <div className="space-y-5">
                  {experience.map(exp => (
                    <div key={exp.id} className="space-y-1.5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 text-xs font-mono">
                        <div className="select-text">
                          <strong className="text-sm font-bold block md:inline">{exp.role}</strong>
                          <span className="hidden md:inline text-gray-500"> — </span>
                          <span className={`${layoutStyle === 'slate' ? 'text-emerald-400 font-semibold' : 'text-slate-800 font-bold'}`}>{exp.company}</span>
                        </div>
                        <span className="text-gray-500 text-[11px] font-semibold select-none">{exp.startDate} – {exp.endDate}</span>
                      </div>
                      
                      <ul className="list-disc pl-4 space-y-1 text-xs leading-relaxed opacity-85 select-text">
                        {exp.description.map((bullet, index) => (
                          <li key={index}>{bullet}</li>
                        ))}
                      </ul>

                      {exp.skillsUsed && exp.skillsUsed.length > 0 && (
                        <div className="text-[10px] font-mono text-gray-505 flex items-center flex-wrap gap-1 mt-1 select-none">
                          <span className="font-bold">Featured stacks:</span>
                          <span>{exp.skillsUsed.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Education & Certs split column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Academic Ledger */}
                <div className="space-y-3">
                  <h3 className={`text-xs md:text-sm font-mono font-bold uppercase tracking-wider ${layoutStyle === 'slate' ? 'text-gray-400 border-b border-slate-800/80 pb-1.5' : 'text-gray-700 border-b border-gray-300 pb-1'}`}>
                    Academic Ledger
                  </h3>
                  <div className="space-y-3">
                    {education.map(edu => (
                      <div key={edu.id} className="text-xs">
                        <strong className="block text-sm font-bold select-text">{edu.degree}</strong>
                        <p className="opacity-80 font-medium select-text">{edu.institution}</p>
                        <div className="flex justify-between text-[11px] font-mono text-gray-500 mt-1 select-none">
                          <span>
                            {edu.startDate && edu.endDate
                              ? `${edu.startDate} – ${edu.endDate}`
                              : `${edu.startYear} – ${edu.endYear}`}
                          </span>
                          {edu.grade && <span>{edu.grade}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Certifications */}
                <div className="space-y-3">
                  <h3 className={`text-xs md:text-sm font-mono font-bold uppercase tracking-wider ${layoutStyle === 'slate' ? 'text-gray-400 border-b border-slate-800/80 pb-1.5' : 'text-gray-700 border-b border-gray-300 pb-1'}`}>
                    Active Credentials
                  </h3>
                  <div className="space-y-2.5">
                    {certifications.map(cert => (
                      <div key={cert.id} className="text-xs">
                        <strong className="block font-bold select-text">{cert.title}</strong>
                        <div className="flex justify-between text-[10px] font-mono text-gray-500 select-none">
                          <span>{cert.issuer}</span>
                          <span>Issued {cert.dateIssued}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Skills Showcase block */}
              <div className="space-y-3">
                <h3 className={`text-xs md:text-sm font-mono font-bold uppercase tracking-wider ${layoutStyle === 'slate' ? 'text-gray-400 border-b border-slate-800/80 pb-1.5' : 'text-gray-700 border-b border-gray-300 pb-1'}`}>
                  Skill Showcase
                </h3>
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  {skills.map(s => (
                    <span 
                      key={s.id} 
                      className={`px-2.5 py-0.5 border rounded-full inline-flex items-center gap-1.5 select-none ${
                        layoutStyle === 'slate' 
                          ? 'bg-[#06070a]/80 border-slate-800 text-gray-300' 
                          : 'bg-gray-100 border-gray-300 text-slate-800'
                      }`}
                    >
                      <span>{s.name}</span>
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}
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
                    <option value="Resume & CV">Resume & CV</option>
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

            {/* Source Method Option Box and Toggle Section */}
            {sourceType === 'file' ? (
              <div className="space-y-2">
                <div className="flex justify-end pr-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSourceType('link');
                      setSelectedFile(null);
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
                  className={`border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 bg-[#08090d] cursor-pointer relative ${
                    isDragging 
                      ? 'border-emerald-500 bg-[#080d0d]' 
                      : 'border-slate-800/85 hover:border-slate-700/80 hover:bg-[#0c0e12]'
                  }`}
                  title="Click or drag to select document files"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept=".pdf,.doc,.docx,.png,.txt"
                    className="hidden" 
                  />

                  {selectedFile ? (
                    <>
                      <FileCheck className="w-10 h-10 text-emerald-400 animate-pulse stroke-[1.5]" />
                      <div className="text-center">
                        <p className="text-xs font-bold text-white max-w-[280px] truncate select-none">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-emerald-400 font-bold font-mono mt-0.5 select-none">
                          Ready to Upload ({selectedFile.size})
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-10 h-10 text-slate-500 stroke-[1.5]" />
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-300 font-mono select-none">
                          Select Files (Max 20MB)
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium select-none mt-1">
                          Supports PDF, PNG and DOCX files.
                        </p>
                      </div>
                    </>
                  )}
                </div>
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
              {editingResume ? 'Update Record Parameters' : 'Save Record in Vault'}
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
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block select-none">Resume Name</label>
              <input 
                type="text"
                required
                value={linkLabel}
                onChange={e => {
                  setLinkLabel(e.target.value);
                  if (!linkPlatform) setLinkPlatform('Resume Link');
                }}
                placeholder="Enter resume name"
                className="w-full bg-[#08090d] border border-slate-800/80 rounded-xl px-4 py-3.5 text-white text-sm focus:border-emerald-500 outline-none placeholder-gray-600 select-text"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block select-none">Resume Link</label>
              <input 
                type="text"
                required
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="Enter resume link (e.g. https://drive.google.com/...)"
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
            <p className="text-xs text-gray-400 mt-1">High-performance CV intelligence powered by Supabase Storage.</p>
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

      {/* 2. Sub-tab select segmented capsule */}
      <div className="flex items-center gap-1 p-1 bg-[#0a0b0f] border border-slate-900 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('documents')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${
            activeSubTab === 'documents'
              ? 'bg-[#15171e] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Resumes & CV'S</span>
        </button>
        <button
          onClick={() => setActiveSubTab('links')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${
            activeSubTab === 'links'
              ? 'bg-[#15171e] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Links</span>
        </button>
      </div>

      {/* 3. Primary Grid lists */}
      {activeSubTab === 'documents' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map(res => (
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

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition duration-200">
                  <button 
                    onClick={() => handleStartEdit(res)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-slate-950 cursor-pointer transition select-none"
                    title="Edit record parameters"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteResume(res.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-slate-950 cursor-pointer transition select-none"
                    title="Delete record from vault"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
                  <span className="text-[10px] text-gray-500 tracking-widest font-bold font-mono uppercase mt-1 block select-none">
                    {res.category}
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

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition duration-200">
                  <button 
                    onClick={() => handleStartEditLink(lk)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-slate-950 cursor-pointer transition select-none"
                    title="Edit portal link"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => onDeleteLink(lk.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-slate-950 cursor-pointer transition select-none"
                    title="Remove Link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-900 rounded-2xl bg-[#0f1115]/20">
              <Link2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-bold">No active links found</p>
              <p className="text-xs text-gray-650 mt-1">Add links to your portfolio networks to share them.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
