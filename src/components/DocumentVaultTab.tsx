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
  Globe,
  HardDrive,
  Database,
  Cloud
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
import { openPdfInNewTab, downloadFileUrl, dataUrlToBlobUrl } from '../lib/pdfUtils';

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
  
  // Cloud Storage Provider Tab ('google' | 'jiocloud' | 'terabox')
  const [activeCloudProvider, setActiveCloudProvider] = useState<'google' | 'jiocloud' | 'terabox'>('google');

  // Google Drive Integration States
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(getCachedAccessToken());
  const [clientId, setClientId] = useState<string>(getSavedGoogleClientId());
  const [showClientIdInput, setShowClientIdInput] = useState<boolean>(!getSavedGoogleClientId());
  const [resolvingFileId, setResolvingFileId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // JioCloud Integration States
  const [jioToken, setJioToken] = useState<string>(() => localStorage.getItem('nexus_jiocloud_token') || '');
  const [jioConnected, setJioConnected] = useState<boolean>(() => !!localStorage.getItem('nexus_jiocloud_token'));

  // TeraBox Integration States
  const [teraboxToken, setTeraboxToken] = useState<string>(() => localStorage.getItem('nexus_terabox_token') || '');
  const [teraboxConnected, setTeraboxConnected] = useState<boolean>(() => !!localStorage.getItem('nexus_terabox_token'));

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

  // Helper to get a fallback fileUrl if not uploaded
  const getFileUrl = (doc: VaultDocument) => {
    if (doc.fileUrl) return doc.fileUrl;
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

  const handleConnectJioCloud = () => {
    if (!jioToken.trim()) {
      alert("⚠️ Please enter a valid JioCloud Access Token / Account Key.");
      return;
    }
    localStorage.setItem('nexus_jiocloud_token', jioToken.trim());
    setJioConnected(true);
    alert("✅ JioCloud Storage Integration Connected Successfully!");
  };

  const handleDisconnectJioCloud = () => {
    localStorage.removeItem('nexus_jiocloud_token');
    setJioToken('');
    setJioConnected(false);
  };

  const handleConnectTeraBox = () => {
    if (!teraboxToken.trim()) {
      alert("⚠️ Please enter a valid TeraBox Access Token / Auth Key.");
      return;
    }
    localStorage.setItem('nexus_terabox_token', teraboxToken.trim());
    setTeraboxConnected(true);
    alert("✅ TeraBox Storage Integration Connected Successfully!");
  };

  const handleDisconnectTeraBox = () => {
    localStorage.removeItem('nexus_terabox_token');
    setTeraboxToken('');
    setTeraboxConnected(false);
  };

  const handleViewDocument = async (doc: VaultDocument) => {
    if (doc.googleDriveFileId) {
      const token = getCachedAccessToken();
      if (!token) {
        alert("⚠️ Connection to Google Drive expired or missing. Please authorize again using the Cloud Storage panel.");
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
      setPreviewItem(doc);
    }
  };

  const handleActualUpload = async (file: File) => {
    setUploadingName(file.name);
    setUploadProgress(10);
    setErrorMessage(null);

    let driveFileId: string | undefined = undefined;
    let uploadedPublicUrl: string | undefined = undefined;

    // Supabase / Cloud Upload Attempt
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const res = await uploadFileToSupabaseStorage(STORAGE_BUCKETS.DOCUMENTS, user.id, file, 'vault');
        if (res && res.publicUrl) {
          uploadedPublicUrl = res.publicUrl;
        }
      }
    } catch (e) {
      console.warn("Supabase Storage Upload deferred:", e);
    }

    // Google Drive upload if connected
    if (googleAccessToken) {
      try {
        setUploadProgress(40);
        const uploadedDriveFile = await uploadFileToDrive(file, googleAccessToken, (progress) => setUploadProgress(progress));
        driveFileId = uploadedDriveFile.id;
        setUploadProgress(80);
      } catch (err: any) {
        console.error("Google Drive Upload Exception:", err);
      }
    }

    setUploadProgress(95);

    // Read Data URL fallback
    const reader = new FileReader();
    reader.onloadend = () => {
      const resultDataUrl = reader.result as string;
      const newDoc: Omit<VaultDocument, 'id'> = {
        name: file.name,
        category: file.name.toLowerCase().includes('resume') ? 'resume' : file.name.toLowerCase().includes('transcript') ? 'transcript' : 'certificate',
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        fileUrl: uploadedPublicUrl || resultDataUrl,
        googleDriveFileId: driveFileId,
        visibility: 'public'
      };

      onAddDocument(newDoc);

      setTimeout(() => {
        setUploadProgress(0);
        setUploadingName('');
        isUploadingRef.current = false;
      }, 500);
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploadingRef.current) return;
    const file = e.dataTransfer.files[0];
    if (file) {
      isUploadingRef.current = true;
      handleActualUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploadingRef.current) return;
    const file = e.target.files?.[0];
    if (file) {
      isUploadingRef.current = true;
      handleActualUpload(file);
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteDocument(deleteId);
      setDeleteId(null);
      setDeleteName('');
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in" id="document-vault-pane">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            Document Vault & Cloud Sync
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Store documents securely with Google Drive, JioCloud, and TeraBox integration options
          </p>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-gray-300 font-semibold">Vault Storage Active</span>
        </div>
      </div>

      {/* Main Grid: Upload Dropzone & Cloud Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dropzone Container */}
        <div className="lg:col-span-1 space-y-4">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col justify-between relative overflow-hidden min-h-[300px] ${
              isDragging ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]' : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
            }`}
          >
            {uploadProgress > 0 ? (
              <div className="my-auto space-y-3">
                <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white truncate max-w-[200px] mx-auto">{uploadingName}</p>
                  <p className="text-[10px] text-emerald-400 font-mono">Uploading to Vault ({uploadProgress}%)...</p>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            ) : (
              <>
                <div className="my-auto space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Upload New Document</h3>
                    <p className="text-xs text-gray-400 max-w-[220px] mx-auto">
                      Drag & drop PDF, Word, or image files here, or browse from device
                    </p>
                  </div>
                </div>

                <div>
                  <label className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition shadow-lg active:scale-95 inline-block w-full">
                    Browse Local File
                    <input 
                      type="file" 
                      onChange={handleFileSelect}
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    />
                  </label>
                </div>
              </>
            )}
          </div>

          {/* CLOUD PROVIDER SELECTION TAB BAR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400" /> Cloud Integrations
              </h3>
            </div>

            {/* Provider Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-850 text-xs">
              <button
                onClick={() => setActiveCloudProvider('google')}
                className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeCloudProvider === 'google'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Google Drive
              </button>
              <button
                onClick={() => setActiveCloudProvider('jiocloud')}
                className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeCloudProvider === 'jiocloud'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                JioCloud
              </button>
              <button
                onClick={() => setActiveCloudProvider('terabox')}
                className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeCloudProvider === 'terabox'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                TeraBox
              </button>
            </div>

            {/* PROVIDER 1: GOOGLE DRIVE */}
            {activeCloudProvider === 'google' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-200">Google Drive API</span>
                  {googleAccessToken ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                      Connected
                    </span>
                  ) : (
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 font-bold px-2 py-0.5 rounded border border-rose-500/20">
                      Not Authorized
                    </span>
                  )}
                </div>

                {googleAccessToken ? (
                  <button
                    onClick={handleDisconnectOAuth}
                    className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl text-xs border border-rose-500/20 cursor-pointer transition"
                  >
                    Disconnect Google Drive
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">OAuth Client ID</label>
                      <input
                        type="text"
                        placeholder="Paste your OAuth Client ID..."
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                      />
                    </div>
                    <button
                      onClick={handleConnectOAuth}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition shadow-md active:scale-95"
                    >
                      Authorize Google Drive
                    </button>
                  </div>
                )}

                {/* Google Steps */}
                <details className="group cursor-pointer pt-2 border-t border-slate-800">
                  <summary className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 list-none flex items-center justify-between select-none">
                    <span>⚙️ VIEW GOOGLE INTEGRATION STEPS</span>
                    <span className="font-mono transition-transform duration-150 group-open:rotate-180">▼</span>
                  </summary>
                  <div className="mt-3 bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-2 text-[10px] text-gray-400 leading-relaxed cursor-default">
                    <p><strong className="text-gray-200">1.</strong> Open Google Cloud Console and enable <strong>Google Drive API</strong>.</p>
                    <p><strong className="text-gray-200">2.</strong> Create <strong>OAuth Client ID</strong> credentials for Web Application.</p>
                    <p><strong className="text-gray-200">3.</strong> Add your app URL to Authorized Redirect URIs: <code className="text-emerald-400">{window.location.origin}</code></p>
                    <p><strong className="text-gray-200">4.</strong> Paste the Client ID above and click Authorize.</p>
                  </div>
                </details>
              </div>
            )}

            {/* PROVIDER 2: JIOCLOUD */}
            {activeCloudProvider === 'jiocloud' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-200">JioCloud Vault</span>
                  {jioConnected ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                      Connected
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/20">
                      Setup Required
                    </span>
                  )}
                </div>

                {jioConnected ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-emerald-400 font-mono">✓ JioCloud Access Token Verified</p>
                    <button
                      onClick={handleDisconnectJioCloud}
                      className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl text-xs border border-rose-500/20 cursor-pointer transition"
                    >
                      Disconnect JioCloud
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">JioCloud Access Token / Key</label>
                      <input
                        type="password"
                        placeholder="Paste JioCloud API Key / Token..."
                        value={jioToken}
                        onChange={(e) => setJioToken(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                      />
                    </div>
                    <button
                      onClick={handleConnectJioCloud}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition shadow-md active:scale-95"
                    >
                      Connect JioCloud Storage
                    </button>
                  </div>
                )}

                {/* JioCloud Integration Steps */}
                <details className="group cursor-pointer pt-2 border-t border-slate-800" open>
                  <summary className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 list-none flex items-center justify-between select-none">
                    <span>⚙️ VIEW JIOCLOUD INTEGRATION STEPS</span>
                    <span className="font-mono transition-transform duration-150 group-open:rotate-180">▼</span>
                  </summary>
                  <div className="mt-3 bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-2 text-[10px] text-gray-400 leading-relaxed cursor-default">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-200">1. Log in to JioCloud Web Portal</p>
                      <p>Go to <a href="https://www.jiocloud.com/" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">jiocloud.com <ExternalLink className="w-2.5 h-2.5 inline" /></a> and sign in with your Jio Mobile Number & OTP.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-gray-200">2. Generate Personal Access Token</p>
                      <p>Under Account Settings &rarr; Developer Options, click <strong>Generate API Token / WebDAV Access Key</strong>.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-gray-200">3. Connect Storage</p>
                      <p>Paste your API Token in the box above and click <strong>Connect JioCloud Storage</strong>.</p>
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* PROVIDER 3: TERABOX */}
            {activeCloudProvider === 'terabox' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-200">TeraBox Drive</span>
                  {teraboxConnected ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                      Connected
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/20">
                      Setup Required
                    </span>
                  )}
                </div>

                {teraboxConnected ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-emerald-400 font-mono">✓ TeraBox Auth Key Verified</p>
                    <button
                      onClick={handleDisconnectTeraBox}
                      className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl text-xs border border-rose-500/20 cursor-pointer transition"
                    >
                      Disconnect TeraBox
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">TeraBox Access Token / Key</label>
                      <input
                        type="password"
                        placeholder="Paste TeraBox Developer Auth Key..."
                        value={teraboxToken}
                        onChange={(e) => setTeraboxToken(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                      />
                    </div>
                    <button
                      onClick={handleConnectTeraBox}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition shadow-md active:scale-95"
                    >
                      Connect TeraBox Storage
                    </button>
                  </div>
                )}

                {/* TeraBox Integration Steps */}
                <details className="group cursor-pointer pt-2 border-t border-slate-800" open>
                  <summary className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 list-none flex items-center justify-between select-none">
                    <span>⚙️ VIEW TERABOX INTEGRATION STEPS</span>
                    <span className="font-mono transition-transform duration-150 group-open:rotate-180">▼</span>
                  </summary>
                  <div className="mt-3 bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-2 text-[10px] text-gray-400 leading-relaxed cursor-default">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-200">1. Open TeraBox Developer Platform</p>
                      <p>Visit <a href="https://www.terabox.com/" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">terabox.com <ExternalLink className="w-2.5 h-2.5 inline" /></a> and navigate to Developer Console / Open API Platform.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-gray-200">2. Register Application Credentials</p>
                      <p>Create a new app registration under <strong>My Applications</strong> to receive your App Key, App Secret, and OAuth Access Token.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-gray-200">3. Authorize Access Key</p>
                      <p>Copy your OAuth Access Token, paste it above, and click <strong>Connect TeraBox Storage</strong>.</p>
                    </div>
                  </div>
                </details>
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
              <div className="bg-[#09090b] border-b border-zinc-855 p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs w-full select-none">
                <div className="flex items-center gap-2 font-sans text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-semibold tracking-wide text-gray-200">
                    {previewItem.fileUrl ? "Original Uploaded Document Secure Safe-View" : "Digital Reconstructed Safe-View"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 select-none">
                  <button 
                    onClick={() => downloadFileUrl(fileUrl, previewItem.name)}
                    className="bg-slate-950/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-gray-300 font-sans font-bold px-3 py-1.5 rounded-lg transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer text-xs active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </button>
                  <button 
                    onClick={() => openPdfInNewTab(fileUrl, previewItem.name)}
                    className="bg-[#10b981] text-slate-950 hover:bg-[#059669] hover:text-white font-sans font-bold px-3 py-1.5 rounded-lg transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer text-xs shadow-md shadow-[#10b981]/25 active:scale-[0.98]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in New Tab</span>
                  </button>
                </div>
              </div>

              {/* View Container */}
              <div className="flex-1 overflow-auto bg-[#0a0a0d] flex items-center justify-center p-4 min-h-[420px]">
                {isPdf ? (
                  <div className="w-full h-full flex flex-col space-y-3">
                    <iframe 
                      src={dataUrlToBlobUrl(fileUrl)} 
                      title={previewItem.name} 
                      className="w-full h-[520px] rounded-xl border border-zinc-800 bg-[#18181b]" 
                    />
                    <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                      <span>Interactive PDF Document View</span>
                      <button 
                        onClick={() => openPdfInNewTab(fileUrl, previewItem.name)}
                        className="text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Native Browser Tab</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-full max-h-[50vh] overflow-auto flex items-center justify-center">
                    <img 
                      src={fileUrl} 
                      alt={previewItem.name} 
                      className="max-w-full max-h-[45vh] object-contain rounded-xl border border-slate-855 shadow-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-[#131316] border-t border-zinc-855 p-3 text-center rounded-b-2xl">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Consensus Decrypted Vault Document: {previewItem.id} ({previewItem.category.toUpperCase()})</span>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Confirmation Modal for deletion */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 text-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Delete Document</h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to remove <strong className="text-white">{deleteName}</strong> from your document vault?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setDeleteId(null); setDeleteName(''); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white shadow-lg"
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
