import React, { useState, useRef, useEffect } from 'react';
import { supabase, STORAGE_BUCKETS, uploadFileToSupabaseStorage } from '../lib/supabase';
import { 
  UploadCloud, 
  File, 
  Search, 
  Trash2, 
  ShieldAlert, 
  CheckCircle,
  Eye,
  Download,
  ExternalLink,
  X,
  ShieldCheck,
  FileText,
  Key,
  RefreshCw,
  Lock,
  Globe
} from 'lucide-react';
import { VaultDocument } from '../types';
import { generateCertificationPdf } from './CertificationsTab';
import { 
  getSavedGoogleClientId, 
  saveGoogleClientId, 
  getCachedAccessToken, 
  clearCachedAccessToken, 
  initiateGoogleDriveOAuth, 
  uploadFileToDrive, 
  downloadFileFromDrive 
} from '../lib/googleDrive';

interface DocumentVaultTabProps {
  documents: VaultDocument[];
  onAddDocument: (doc: Omit<VaultDocument, 'id'>) => void;
  onDeleteDocument: (id: string) => void;
  onUpdateDocument?: (doc: VaultDocument) => void;
}

export default function DocumentVaultTab({
  documents,
  onAddDocument,
  onDeleteDocument,
  onUpdateDocument
}: DocumentVaultTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Google Drive Integration States
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(getCachedAccessToken());
  const [clientId, setClientId] = useState<string>(getSavedGoogleClientId());
  const [showClientIdInput, setShowClientIdInput] = useState<boolean>(!getSavedGoogleClientId());
  const [resolvingFileId, setResolvingFileId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync token from memory cache
  useEffect(() => {
    const checkToken = () => {
      setGoogleAccessToken(getCachedAccessToken());
    };
    const interval = setInterval(checkToken, 3050);
    return () => clearInterval(interval);
  }, []);

  // Upload progress states
  const [uploadingName, setUploadingName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewItem, setPreviewItem] = useState<VaultDocument | null>(null);

  // Deletion modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');

  // Ref to track if an upload is actively occurring
  const isUploadingRef = useRef(false);

  // Helper to get a beautiful fallback fileUrl if not uploaded
  const getFileUrl = (doc: VaultDocument) => {
    if (doc.fileUrl) return doc.fileUrl;
    // Generate a fallback PDF for testing if they didn't upload theirs yet
    return generateCertificationPdf({
      title: doc.name.replace('.pdf', '').replace(/_/g, ' '),
      issuer: doc.category === 'resume' ? 'Ramachandra Murthy Mamidipalli' : 'KL University / Authorized Issuer',
      dateIssued: doc.uploadDate,
      credentialId: 'VLT-AUTH-' + doc.id.toUpperCase(),
      type: doc.category === 'transcript' ? 'grades' : 'study'
    });
  };

  const handleConnectOAuth = () => {
    if (!clientId) {
      alert("⚠️ Client ID cannot be empty. Please configure a valid Google Cloud Developer OAuth Client ID first.");
      return;
    }
    const cleanId = clientId.trim().replace(/^https?:\/\//, '');
    setClientId(cleanId);
    saveGoogleClientId(cleanId);
    initiateGoogleDriveOAuth(cleanId);
  };

  const handleDisconnectOAuth = () => {
    clearCachedAccessToken();
    setGoogleAccessToken(null);
  };

  const handleViewDocument = async (doc: VaultDocument) => {
    if (doc.googleDriveFileId) {
      const token = getCachedAccessToken();
      if (!token) {
        alert("⚠️ Connection to Google Drive expired or missing. Please authorize again using the Google Drive settings panel.");
        return;
      }
      setResolvingFileId(doc.id);
      try {
        const { objectUrl } = await downloadFileFromDrive(doc.googleDriveFileId, token);
        const resolvedCopy: VaultDocument = {
          ...doc,
          fileUrl: objectUrl
        };
        setPreviewItem(resolvedCopy);
      } catch (err: any) {
        console.error("Failed to fetch document from Google Drive:", err);
        alert(`❌ Error downloading file from Google Drive: ${err.message || 'Check your permissions.'}`);
      } finally {
        setResolvingFileId(null);
      }
    } else {
      // Legacy document - view directly
      setPreviewItem(doc);
    }
  };

  const handleActualUpload = async (file: File) => {
    const activeClientId = (clientId || getSavedGoogleClientId() || '').trim();
    if (!activeClientId) {
      alert("⚠️ OAuth Client ID Required! Please enter and save your Google Cloud OAuth Client ID in the OAuth Configuration panel below before adding files to the Document Vault.");
      isUploadingRef.current = false;
      return;
    }

    const token = getCachedAccessToken();
    if (!token) {
      alert("⚠️ Google Drive Authentication Required! Please click 'Connect Google Drive' in the OAuth Configuration panel below to authorize access before uploading files to the Document Vault.");
      isUploadingRef.current = false;
      return;
    }

    setUploadingName(file.name);
    setUploadProgress(10);
    setErrorMessage(null);

    // Auto-detect category based on file suffix or name keywords
    let category: 'resume' | 'transcript' | 'certificate' | 'reference' | 'other' = 'other';
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('cv') || lowerName.includes('resume')) {
      category = 'resume';
    } else if (lowerName.includes('transcript') || lowerName.includes('grades') || lowerName.includes('marks')) {
      category = 'transcript';
    } else if (lowerName.includes('cert') || lowerName.includes('award') || lowerName.includes('license') || lowerName.includes('degree') || lowerName.includes('badge')) {
      category = 'certificate';
    } else if (lowerName.includes('ref') || lowerName.includes('recommend') || lowerName.includes('letter')) {
      category = 'reference';
    }

    const calcSize = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;

    try {
      setUploadProgress(20);
      const driveRes = await uploadFileToDrive(file, token, (percent) => {
        setUploadProgress(percent);
      });

      onAddDocument({
        name: file.name,
        title: file.name,
        category: category,
        size: calcSize,
        fileSize: String(file.size),
        fileType: file.type || 'application/pdf',
        uploadDate: new Date().toISOString().substring(0, 10),
        uploadedAt: new Date().toISOString(),
        googleDriveFileId: driveRes.id,
        webViewLink: driveRes.webViewLink,
        webContentLink: driveRes.webContentLink,
        visibility: 'private',
        tags: [category, 'vault', 'gdrive']
      });

      setUploadProgress(100);
      setTimeout(() => {
        setUploadingName('');
        setUploadProgress(0);
        isUploadingRef.current = false;
      }, 1200);
    } catch (err: any) {
      console.error("Google Drive Upload failed:", err);
      setErrorMessage(err.message || "An error occurred during Google Drive upload.");
      setTimeout(() => {
        setUploadingName('');
        setUploadProgress(0);
        isUploadingRef.current = false;
        setErrorMessage(null);
      }, 4000);
    }
  };

  const handleManualFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;
    const file = e.target.files[0];
    handleActualUpload(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;
    const file = e.dataTransfer.files[0];
    handleActualUpload(file);
  };

  const filteredDocs = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" id="vault-pane">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">Secure Document Vault</h2>
          <p className="text-xs text-gray-400 mt-1">Review authenticated document backups, resumes, GPA transcripts, and credentials data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Panel */}
        <div className="space-y-4">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 py-10 transition-colors flex flex-col items-center justify-center text-center space-y-4 relative ${
              isDragging 
                ? 'border-emerald-400 bg-emerald-500/5' 
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
            }`}
          >
            <input 
              type="file"
              id="vaultManualSelect"
              onChange={handleManualFileInput}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 text-emerald-400">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-white text-xs font-semibold">Drag & drop files here</p>
              <p className="text-[10px] text-gray-500">or click to browse local folders</p>
            </div>

            <p className="text-[9px] font-mono text-gray-600">Supports PDF, DOCX, ZIP, PNG (max 10MB)</p>
          </div>

          {/* Progressive uploading simulator overlay */}
          {uploadingName && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-semibold truncate max-w-[180px]">{uploadingName}</span>
                <span className="text-emerald-400 font-mono font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              
              {uploadProgress >= 100 && (
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Success – Secure backup established</span>
                </div>
              )}
            </div>
          )}

          {/* Google Drive Credentials & Connection Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-white text-xs font-extrabold tracking-wide uppercase flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                Google Drive Storage API
              </span>
              {googleAccessToken ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold select-none">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-500 font-extrabold select-none">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  Disconnected
                </span>
              )}
            </div>

            {googleAccessToken ? (
              <div className="space-y-3.5">
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1">
                  <p className="text-emerald-400 font-bold text-xs">Drive Authorization Active</p>
                  <p className="text-[10px] text-gray-400">Your documents are uploaded directly to and retrieved from your Google Drive account.</p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase font-mono">Active Client ID</span>
                  <p className="text-xs text-gray-200 font-mono truncate bg-slate-950 p-2 rounded-lg border border-slate-800" title={clientId}>
                    {clientId}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnectOAuth}
                  className="w-full py-2 bg-slate-950 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900 text-gray-400 hover:text-rose-400 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer active:scale-95"
                >
                  Disconnect Account
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[11px] text-gray-450 leading-relaxed font-sans">
                  Connect your Google Account to authorize direct document state uploads using Google Drive API.
                </p>

                {errorMessage && (
                  <div className="p-2.5 bg-rose-500/15 border border-rose-500/20 rounded-xl flex items-start gap-2 text-[10px] text-rose-400 leading-normal">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">GCP OAuth Client ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Paste your OAuth Client ID..."
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectOAuth}
                    className="w-full py-2 bg-[#10b981] hover:bg-emerald-600 text-slate-950 hover:text-white font-bold rounded-xl text-xs tracking-wide transition-all duration-150 shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
                  >
                    Authorize Google Drive
                  </button>
                </div>

                {/* Setup Instructions Toggle Card */}
                <div className="border-t border-slate-800/80 pt-3">
                  <details className="group cursor-pointer">
                    <summary className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 list-none flex items-center justify-between select-none">
                      <span>⚙️ VIEW GOOGLE ACCOUNT INTEGRATION STEPS</span>
                      <span className="font-mono transition-transform duration-150 group-open:rotate-180">▼</span>
                    </summary>
                    <div className="mt-3 bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-3 text-[10px] text-gray-400 leading-relaxed cursor-default">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-200">1. Setup Google Drive API</p>
                        <p>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="w-2.5 h-2.5 inline" /></a>, search for <strong className="text-gray-350">Google Drive API</strong>, and click <strong className="text-gray-350">Enable</strong>.</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-bold text-gray-200">2. Configure OAuth Consent Screen</p>
                        <p>Choose User Type <strong className="text-gray-300">External/Internal</strong>. Set up App Name and emails. Under scopes, ensure you request the <code className="bg-slate-900 px-1 rounded text-emerald-400">.../auth/drive.file</code> scope. Click Save.</p>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold text-gray-200">3. Register Test Users</p>
                        <p>In "Test users" panel, add your Google login email addressing (e.g. your Gmail) so your dev client can authorize.</p>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold text-gray-200">4. Create Client ID Credentials</p>
                        <p>Under <strong className="text-gray-200">Credentials</strong>, click <strong className="text-gray-200">Create Credentials</strong> &rarr; <strong className="text-gray-200">OAuth Client ID</strong>. Select application type: <strong className="text-gray-300">Web application</strong>.</p>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold text-gray-200">5. Authorize Redirect URIs</p>
                        <p>Add your environment URL to <strong className="text-gray-300">Authorized Redirect URIs</strong>:</p>
                        <div className="bg-slate-900 p-1.5 rounded font-mono text-[9px] text-white overflow-x-auto border border-zinc-850 select-all">
                          {window.location.origin}
                        </div>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-800">
                        <p>Copy the generated Client ID string, paste it back inside the console above, and grant permission.</p>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search & Vault Directory list */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search container */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
            <input 
              type="text"
              placeholder="Search secure backups inventory..."
              value={searchTerm}
              onChange={e=>setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Directory list items */}
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between group hover:border-emerald-500/10 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-950 text-emerald-400 border border-slate-800 rounded-xl relative">
                    <File className="w-5 h-5" />
                    {doc.googleDriveFileId && (
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 rounded-full text-[7px] px-1 font-extrabold" title="Stored on Google Drive">
                        GD
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs flex items-center gap-2">
                      <span>{doc.name}</span>
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 mt-0.5">
                      <span className="uppercase text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-gray-400">{doc.category}</span>
                      <span>{doc.size}</span>
                      {doc.googleDriveFileId ? (
                        <span className="text-emerald-400 font-bold">Google Drive Security Backup</span>
                      ) : (
                        <span>Uploaded: {doc.uploadDate}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newVis = doc.visibility === 'public' ? 'private' : 'public';
                      if (onUpdateDocument) {
                        onUpdateDocument({ ...doc, visibility: newVis });
                      }
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono uppercase font-bold border transition cursor-pointer flex items-center gap-1 ${
                      doc.visibility === 'public'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-red-500/10 text-rose-400 border-red-500/30 hover:bg-red-500/20'
                    }`}
                    title={doc.visibility === 'public' ? "Publicly visible on your profile. Click to make private." : "Private. Hidden from public profile. Click to make public."}
                  >
                    {doc.visibility === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>{doc.visibility === 'public' ? 'Public' : 'Private'}</span>
                  </button>
                  <button 
                    onClick={() => handleViewDocument(doc)}
                    disabled={resolvingFileId !== null}
                    className="p-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-[#10b981] hover:text-slate-950 text-emerald-400 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold select-none disabled:opacity-50 disabled:cursor-not-allowed"
                    title="View Document"
                  >
                    {resolvingFileId === doc.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Resolving...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      setDeleteId(doc.id);
                      setDeleteName(doc.name);
                    }}
                    className="p-1.5 bg-[#0e0e11]/90 hover:bg-rose-950 border border-slate-800 text-gray-400 hover:text-rose-400 rounded-lg cursor-pointer transition select-none"
                    title="Delete files"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Document Safe-View Modal */}
      {previewItem && (() => {
        const fileUrl = getFileUrl(previewItem);
        const isPdf = fileUrl.startsWith('data:application/pdf') || previewItem.name.toLowerCase().endsWith('.pdf');
        
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#121214] border border-zinc-800 text-white w-full max-w-4xl rounded-2xl relative shadow-2xl flex flex-col max-h-[90vh]" style={{ minHeight: '520px' }}>
              
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-zinc-800/85 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold text-sm sm:text-base tracking-tight leading-snug truncate max-w-[280px] sm:max-w-md" title={previewItem.name}>
                      {previewItem.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5 uppercase font-mono">
                      {previewItem.googleDriveFileId ? (
                        <span className="text-emerald-400 font-bold">Google Drive Storage • ID: {previewItem.googleDriveFileId} • Size: {previewItem.size}</span>
                      ) : (
                        <span>Offline Sandbox Asset • Size: {previewItem.size} • Uploaded: {previewItem.uploadDate}</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    if (previewItem.fileUrl?.startsWith('blob:')) {
                      try {
                        URL.revokeObjectURL(previewItem.fileUrl);
                      } catch (err) {
                        console.error("Failed to revoke object URL:", err);
                      }
                    }
                    setPreviewItem(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-900 text-gray-400 hover:text-white transition cursor-pointer"
                  title="Close viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toolbar */}
              <div className="bg-[#09090b] border-b border-zinc-850 p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs w-full select-none">
                <div className="flex items-center gap-2 font-sans text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-semibold tracking-wide text-gray-200">
                    {previewItem.fileUrl ? "Original Uploaded Document Secure Safe-View" : "Digital Reconstructed Safe-View"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 select-none">
                  <a 
                    href={fileUrl}
                    download={previewItem.name}
                    className="bg-slate-950/40 hover:bg-slate-900 border border-slate-850 hover:border-slate-805 text-gray-300 font-sans font-bold px-3 py-1.5 rounded-lg transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer text-xs active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </a>
                  <a 
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#10b981] text-slate-950 hover:bg-[#059669] hover:text-white font-sans font-bold px-3 py-1.5 rounded-lg transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer text-xs shadow-md shadow-[#10b981]/25 active:scale-[0.98]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in New Tab</span>
                  </a>
                </div>
              </div>

              {/* View Container */}
              <div className="flex-1 overflow-auto bg-[#0a0a0d] flex items-center justify-center p-4 min-h-[420px]">
                {isPdf ? (
                  <div className="w-full py-16 px-6 flex flex-col justify-center items-center text-center space-y-5 bg-[#09090b] rounded-2xl border border-zinc-800">
                    <div className="p-4 bg-[#10b981]/10 rounded-full text-emerald-400 border border-emerald-500/20 shadow-inner">
                      <FileText className="w-12 h-12" />
                    </div>
                    <div className="space-y-1.5 max-w-sm">
                      <h4 className="text-white font-bold text-sm sm:text-base font-sans">{previewItem.name}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed font-sans">
                        Base64 Decrypted PDF Document storage. Direct in-app preview has been disabled. Please open the document in a secure external browser tab.
                      </p>
                    </div>
                    <a 
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#10b981] text-slate-950 hover:bg-emerald-600 font-sans font-bold px-5 py-2.5 rounded-xl transition-all duration-150 inline-flex items-center gap-2 cursor-pointer text-xs shadow-lg shadow-[#10b981]/20 active:scale-[0.98]"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open PDF in New Tab</span>
                    </a>
                  </div>
                ) : (
                  <div className="max-w-full max-h-[50vh] overflow-auto flex items-center justify-center">
                    <img 
                      src={fileUrl} 
                      alt={previewItem.name} 
                      className="max-w-full max-h-[45vh] object-contain rounded-xl border border-slate-850 shadow-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-[#131316] border-t border-zinc-850 p-3 text-center rounded-b-2xl">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Consensus Decrypted Vault Document: {previewItem.id} ({previewItem.category.toUpperCase()})</span>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Custom Confirmation Modal overlay for deletion */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0e11] border border-slate-800/90 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl p-6 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto text-rose-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-bold text-base font-sans">Delete Document Backup?</h3>
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
                  onDeleteDocument(deleteId);
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
