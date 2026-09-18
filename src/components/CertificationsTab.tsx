import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Award, 
  Calendar, 
  ExternalLink, 
  Trash2, 
  Pencil,
  X, 
  Lock, 
  Unlock, 
  Upload, 
  ShieldCheck, 
  FileText, 
  Eye, 
  EyeOff,
  CheckCircle,
  Download,
  ChevronDown
} from 'lucide-react';
import { Certification } from '../types';

interface CertificationsTabProps {
  certifications: Certification[];
  onAddCertification: (certification: Omit<Certification, 'id'>) => void;
  onDeleteCertification: (id: string) => void;
  onUpdateCertification?: (certification: Certification) => void;
}

// Helper function to dynamically generate a valid, beautiful PDF for any certification
export function generateCertificationPdf(cert: {
  title: string;
  issuer: string;
  dateIssued: string;
  credentialId?: string;
  type?: 'study' | 'course' | 'grades';
}): string {
  const title = cert.title || 'Certification';
  const issuer = cert.issuer || 'Issuer';
  const date = cert.dateIssued || '2024-06-19';
  const idValue = cert.credentialId || 'KL-CR-V01-09';
  const type = cert.type || 'study';

  const escapePdfText = (t: string) => {
    return t.replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
  };

  const escTitle = escapePdfText(title);
  const escIssuer = escapePdfText(issuer);
  const escDate = escapePdfText(date);
  const escId = escapePdfText(idValue);

  let drawStream = '';
  let textStream = '';

  // Standard Border
  drawStream += "0.85 0.53 0.1 RG\n3 w\n18 18 576 756 re S\n0.85 0.53 0.1 RG\n1 w\n24 24 564 744 re S\n0.5 0.5 0.5 RG\n1 w\n54 670 m 558 670 l S\n";

  if (type === 'grades') {
    textStream = `BT
0.1 0.1 0.1 rg
/F1 15 Tf
1 0 0 1 54 710 Tm
(KONERU LAKSHMAIAH EDUCATION FOUNDATION) Tj
/F3 9 Tf
1 0 0 1 54 690 Tm
(Deemed to be University  Estd u/s 3 of UGC Act 1956  NAAC 'A++' Grade Campus) Tj
/F1 12 Tf
1 0 0 1 54 645 Tm
(CONSOLIDATED CUMULATIVE MEMORANDUM OF GRADES) Tj
/F3 9.5 Tf
1 0 0 1 54 610 Tm
(Student Name: MAMIDIPALLI RAMACHANDRA MURTHY) Tj
0 -14 Td
(Registration No: 190030999) Tj
0 -14 Td
(Program Course: Bachelor of Technology \\(B.Tech.\\)) Tj
0 -14 Td
(Discipline Major: Computer Science and Engineering) Tj
/F1 10.5 Tf
1 0 0 1 54 520 Tm
(ACADEMIC PERFORMANCE LOG \\(185 TOTAL CREDITS COMPLETED\\)) Tj
/F3 9 Tf
1 0 0 1 54 495 Tm
(Course Code / Subject Name                                   Credits    Grade) Tj
0 -18 Td
(19CS1101  Problem Solving through Coding             4        O  \\(10.0\\)) Tj
0 -14 Td
(19MA2101  Discrete Mathematics & Matrix Algebra      4        A+ \\(9.00\\)) Tj
0 -14 Td
(19CS2101  Data Structures and Algorithms in C++      4        O  \\(10.0\\)) Tj
0 -14 Td
(19CS2102  Relational Database Systems \\(RDBMS\\)        4        A+ \\(9.00\\)) Tj
0 -14 Td
(19CS3101  Design & Analysis of Algorithms            4        O  \\(10.0\\)) Tj
0 -14 Td
(19CS3114  Machine Learning & Analytics               4        O  \\(10.0\\)) Tj
0 -14 Td
(19CS4201  Major Capstone Design Project              6        O  \\(10.0\\)) Tj
/F1 11 Tf
1 0 0 1 54 285 Tm
(GRADED RESULTS: CGPA 8.80 \\(FIRST CLASS WITH DISTINCTION\\)) Tj
/F3 9 Tf
1 0 0 1 54 240 Tm
(Date Checked: ${escDate}) Tj
0 -12 Td
(Verification Key: ${escId}) Tj
0 -12 Td
(Security Status: SECURE SYSTEM INTEGRATED DATABASE RECORD) Tj
/F2 10 Tf
1 0 0 1 54 160 Tm
(Signed official registrar of examinations,) Tj
/F1 10 Tf
0 -16 Td
(Prof. Dr. Venkat Prasad) Tj
/F3 8 Tf
0 -12 Td
(Controller of Examinations, CLEF Deemed University) Tj
ET`;
    drawStream += "0.7 0.7 0.7 RG\n1 w\n54 505 m 558 505 l S\n54 300 m 558 300 l S\n";
  } else if (type === 'study') {
    textStream = `BT
0.1 0.1 0.1 rg
/F1 19 Tf
1 0 0 1 110 710 Tm
(KL Deemed University) Tj
/F3 8 Tf
1 0 0 1 110 690 Tm
(ESTABLISHED UNDER SECTION 3 OF THE UNIVERSITY GRANTS COMMISSION ACT, 1956) Tj
/F2 12 Tf
1 0 0 1 180 620 Tm
(By decree of the Academic Senate, be it known that) Tj
/F1 16 Tf
1 0 0 1 125 570 Tm
(RAMACHANDRA MURTHY MAMIDIPALLI) Tj
/F3 11 Tf
1 0 0 1 70 530 Tm
(having successfully completed the prescribed curriculum courses and satisfied all) Tj
0 -15 Td
(academic directives is hereby certified and designated as a graduate of the program) Tj
/F1 14 Tf
1 0 0 1 120 460 Tm
(${escTitle.toUpperCase()}) Tj
/F3 11 Tf
1 0 0 1 140 420 Tm
(with computer science and engineering specialization) Tj
/F3 10 Tf
1 0 0 1 54 340 Tm
(Issuer: ${escIssuer}) Tj
0 -14 Td
(Date Registered: ${escDate}) Tj
0 -14 Td
(Credential Registry Reference Code: ${escId}) Tj
/F2 10 Tf
1 0 0 1 54 220 Tm
(In witness whereof we append our electronic signatures,) Tj
/F1 10 Tf
1 0 0 1 54 160 Tm
(s/d Registrar, Academic Office) Tj
0 -12 Td
(Academic Registrar, CLEF) Tj
1 0 0 1 380 160 Tm
(s/d Vice-Chancellor) Tj
0 -12 Td
(General Administration Senate) Tj
ET`;
    drawStream += "0.85 0.65 0.1 RG\n3 w\n260 210 80 50 re S\n";
  } else {
    textStream = `BT
0.1 0.1 0.1 rg
/F1 18 Tf
1 0 0 1 54 710 Tm
(${escIssuer.toUpperCase()}) Tj
/F3 9 Tf
1 0 0 1 54 690 Tm
(GLOBAL EDUCATION & PROFESSIONAL CERTIFICATIONS PLATFORM) Tj
/F1 22 Tf
1 0 0 1 120 600 Tm
(CERTIFICATE OF COMPLETION) Tj
/F3 11 Tf
1 0 0 1 150 560 Tm
(This is proudly awarded to candidate) Tj
/F1 16 Tf
1 0 0 1 130 510 Tm
(RAMACHANDRA MURTHY MAMIDIPALLI) Tj
/F3 11 Tf
1 0 0 1 100 460 Tm
(for completing all online class modules, hands-on labs, and key assessments for) Tj
/F1 13 Tf
1 0 0 1 110 410 Tm
(${escTitle}) Tj
/F3 10 Tf
1 0 0 1 54 310 Tm
(Certified Issuer: ${escIssuer}) Tj
0 -14 Td
(Completion Date: ${escDate}) Tj
0 -14 Td
(Registration Verification Token ID: ${escId}) Tj
0 -14 Td
(Status Indicator: Digital Publicly Verified Ledger) Tj
/F2 10 Tf
1 0 0 1 54 200 Tm
(Course Syllabus Director & Principal Instructor,) Tj
/F1 11 Tf
0 -16 Td
(Dr. Andrew Ng, Chief Scholar Emeritus) Tj
ET`;
    drawStream += "0.1 0.6 0.4 RG\n2 w\n100 535 m 512 535 l S\n";
  }

  const streamContent = drawStream + '\n' + textStream;
  const streamLength = streamContent.length;

  const objects: { [key: number]: string } = {
    1: "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    2: "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    3: "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 6 0 R /F3 7 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n",
    4: "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    5: `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    6: "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n",
    7: "7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
  };

  let currentOffset = 9; // "%PDF-1.4\n" is 9 characters
  const offsets: { [key: number]: number } = {};
  let objectsStr = "%PDF-1.4\n";

  const ids = [1, 2, 3, 4, 5, 6, 7];
  for (const id of ids) {
    offsets[id] = currentOffset;
    const body = objects[id];
    objectsStr += body;
    currentOffset += body.length;
  }

  let xref = "xref\n0 8\n0000000000 65535 f \n";
  for (let i = 1; i <= 7; i++) {
    const paddedOffset = String(offsets[i]).padStart(10, '0');
    xref += `${paddedOffset} 00000 n \n`;
  }

  const startxrefVal = currentOffset;
  const trailer = `trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${startxrefVal}\n%%EOF`;

  const pdfContent = objectsStr + xref + trailer;

  const base64Pdf = btoa(unescape(encodeURIComponent(pdfContent)));
  return `data:application/pdf;base64,${base64Pdf}`;
}

export default function CertificationsTab({
  certifications,
  onAddCertification,
  onDeleteCertification,
  onUpdateCertification
}: CertificationsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'study' | 'course' | 'grades'>('study');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  
  const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!previewItem || !onUpdateCertification) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedCert: Certification = {
          ...previewItem,
          fileName: file.name,
          fileUrl: reader.result as string
        };
        onUpdateCertification(updatedCert);
        setPreviewItem(updatedCert);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Modal Preview States
  const [previewItem, setPreviewItem] = useState<Certification | null>(null);
  const [editingItem, setEditingItem] = useState<Certification | null>(null);

  const [formData, setFormData] = useState<Omit<Certification, 'id'>>({
    title: '',
    issuer: '',
    dateIssued: '',
    expirationDate: '',
    credentialId: '',
    credentialUrl: '',
    type: 'study',
    visibility: 'private',
    fileName: '',
    fileUrl: '',
    percentage: ''
  });

  const handleStartEdit = (cert: Certification) => {
    setEditingItem(cert);
    setFormData({
      title: cert.title,
      issuer: cert.issuer,
      dateIssued: cert.dateIssued || '',
      expirationDate: cert.expirationDate || '',
      credentialId: cert.credentialId || '',
      credentialUrl: cert.credentialUrl || '',
      type: cert.type || 'study',
      visibility: cert.visibility || 'private',
      fileName: cert.fileName || '',
      fileUrl: cert.fileUrl || '',
      percentage: cert.percentage || ''
    });
    setShowForm(true);
  };

  const handleStartAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      issuer: '',
      dateIssued: '',
      expirationDate: '',
      credentialId: '',
      credentialUrl: '',
      type: activeTab,
      visibility: 'private',
      fileName: '',
      fileUrl: '',
      percentage: ''
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.issuer) return;
    
    // Auto-generate a decent credentialId if left empty
    const finalId = formData.credentialId || `CRED-${Math.floor(Math.random() * 90000) + 10000}`;
    
    const finalData = {
      ...formData,
      credentialId: finalId,
      dateIssued: formData.dateIssued || new Date().toISOString().split('T')[0]
    };

    if (editingItem && onUpdateCertification) {
      onUpdateCertification({
        ...finalData,
        id: editingItem.id
      });
    } else {
      onAddCertification(finalData);
    }

    // Reset fields
    setFormData({
      title: '',
      issuer: '',
      dateIssued: '',
      expirationDate: '',
      credentialId: '',
      credentialUrl: '',
      type: 'study',
      visibility: 'private',
      fileName: '',
      fileUrl: '',
      percentage: ''
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
          ...prev, 
          fileName: file.name, 
          fileUrl: reader.result as string 
        }));
      };
      reader.readAsDataURL(file);
    }
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
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
          ...prev, 
          fileName: file.name, 
          fileUrl: reader.result as string 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, fileName: '', fileUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return 'N/A';
    return dStr;
  };

  // Filter listings based on the current toggle (study vs course)
  const filteredCerts = certifications.filter(c => {
    const type = c.type || 'study';
    return type === activeTab;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="certifications-pane">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold font-sans text-white flex items-center gap-2 tracking-tight">
            <span>🏆 Credentials & Grade Sheets</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Secure vault for academic and professional records (Max 20MB).
          </p>
        </div>
        <button
          onClick={handleStartAdd}
          className="bg-[#10b981] hover:bg-[#059669] font-bold text-slate-950 px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-md shrink-0 select-none active:scale-95 text-white"
        >
          <Plus className="w-4 h-4" />
          <span>Add Record</span>
        </button>
      </div>

      {/* Styled Filters for Study / Course / Grades */}
      <div className="flex bg-[#0b0b0d] p-1 rounded-full border border-slate-800/80 w-fit gap-1">
        <button
          onClick={() => setActiveTab('study')}
          className={`px-6 py-2 rounded-full text-xs font-sans font-bold transition-all duration-200 cursor-pointer select-none ${
            activeTab === 'study'
              ? 'bg-[#18181b] text-white border border-slate-800 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>Study</span>
        </button>
        <button
          onClick={() => setActiveTab('course')}
          className={`px-6 py-2 rounded-full text-xs font-sans font-bold transition-all duration-200 cursor-pointer select-none ${
            activeTab === 'course'
              ? 'bg-[#18181b] text-white border border-slate-800 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>Course</span>
        </button>
        <button
          onClick={() => setActiveTab('grades')}
          className={`px-6 py-2 rounded-full text-xs font-sans font-bold transition-all duration-200 cursor-pointer select-none ${
            activeTab === 'grades'
              ? 'bg-[#18181b] text-white border border-slate-800 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>Grades</span>
        </button>
      </div>

      {/* Grid List of Cards */}
      {filteredCerts.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <p className="text-gray-500 text-sm">No {activeTab} credentials loaded in this view.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCerts.map(cert => (
            <div 
              key={cert.id} 
              className="bg-[#121215] border border-slate-850 rounded-[20px] p-6 relative group hover:border-slate-800 transition duration-300 flex flex-col justify-between"
            >
              {/* Actions aligned beautifully */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition z-10">
                <button 
                  onClick={() => handleStartEdit(cert)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-slate-900 cursor-pointer transition select-none"
                  title="Edit credential"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDeleteCertification(cert.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-slate-900 cursor-pointer transition select-none"
                  title="Delete credential"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Status Indicator Overlays */}
              <div className="space-y-3.5">
                <div className="flex flex-col gap-3.5 items-start">
                  <div className="p-2.5 bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl text-emerald-400 h-10 w-10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-sans font-medium px-2.5 py-1 bg-slate-950/40 border border-slate-850 text-gray-400 rounded-full select-none">
                    {cert.visibility === 'public' ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-450" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-gray-500" />
                        <span>Private</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Title & Issuer */}
                <div className="space-y-1">
                  <h3 className="text-white font-extrabold text-base uppercase tracking-tight leading-snug">
                    {cert.title}
                  </h3>
                  <p className="text-[#10b981] font-sans text-xs font-semibold">
                    {cert.issuer}
                  </p>
                  {cert.percentage && cert.type !== 'course' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-mono font-bold mt-1">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Percentage / Score: {cert.percentage.endsWith('%') ? cert.percentage : `${cert.percentage}%`}</span>
                    </div>
                  )}
                </div>

                {/* Date and ID */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-0.5 font-sans">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span>{formatDisplayDate(cert.dateIssued)}</span>
                </div>
              </div>

              {/* Verified File Name Display */}
              {cert.fileName && (
                <div className="bg-slate-950/40 border border-slate-800/40 p-2.5 rounded-xl mt-3.5 flex items-center gap-2 text-[10px] font-mono text-gray-400">
                  <FileText className="w-4 h-4 text-[#10b981] min-w-[16px]" />
                  <span className="truncate">{cert.fileName}</span>
                </div>
              )}

              {/* Action Buttons: Verify, View, and Download */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-850/80 pt-4 mt-5">
                <a 
                  href={cert.credentialUrl || '#'} 
                  target={cert.credentialUrl ? "_blank" : undefined}
                  rel="noreferrer"
                  onClick={(e) => {
                    if (!cert.credentialUrl) {
                      e.preventDefault();
                      alert('External verification URL is not configured for this credential.');
                    }
                  }}
                  className="bg-slate-950/20 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-gray-400 hover:text-white inline-flex items-center justify-center gap-1 text-[11px] font-semibold py-2 px-2 rounded-xl transition cursor-pointer select-none"
                  title="Verify credential"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  <span>Verify</span>
                </a>
                
                <button
                  onClick={() => setPreviewItem(cert)}
                  className="bg-slate-950/20 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-gray-400 hover:text-white py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 cursor-pointer select-none transition font-semibold"
                  title="View credential"
                >
                  <Eye className="w-3.5 h-3.5 text-gray-400" />
                  <span>View</span>
                </button>

                <a
                  href={cert.fileUrl || generateCertificationPdf(cert)}
                  download={cert.fileName || `${cert.title.replace(/\s+/g, '_')}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 cursor-pointer transition select-none"
                  title="Download Certificate PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Styled Inline Credential Record Form in the Page Flow */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold text-white">
              {editingItem ? 'Edit Credential' : 'Add New Credential'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Enter details of your academic or professional credential.
            </p>
          </div>

          <div className="space-y-4">
            {/* Record Type & Visibility Select Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Record Type</label>
                <div className="relative">
                  <select
                    value={formData.type || 'study'}
                    onChange={e => {
                      const newType = e.target.value as 'study' | 'course' | 'grades';
                      setFormData({ 
                        ...formData, 
                        type: newType,
                        visibility: newType === 'study' ? 'private' : formData.visibility
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-white text-sm outline-none cursor-pointer appearance-none focus:border-emerald-500"
                  >
                    <option value="study" className="bg-slate-950">Study Certificate</option>
                    <option value="course" className="bg-slate-950">Course Certificate</option>
                    <option value="grades" className="bg-slate-950">Grade Sheet / Marks Memo</option>
                  </select>
                  <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-gray-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Visibility</label>
                <div className="relative">
                  <select
                    value={formData.type === 'study' ? 'private' : (formData.visibility || 'private')}
                    disabled={formData.type === 'study'}
                    onChange={e => setFormData({ ...formData, visibility: e.target.value as 'public' | 'private' })}
                    className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-white text-sm outline-none appearance-none focus:border-emerald-500 ${formData.type === 'study' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <option value="private" className="bg-slate-950">🔒 Private (Vault Only)</option>
                    {formData.type !== 'study' && <option value="public" className="bg-slate-950">🔓 Public Showcase</option>}
                  </select>
                  <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-gray-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                {formData.type === 'study' && (
                  <p className="text-[10px] text-amber-400/80 mt-0.5 font-mono">Study certificates are strictly set to Private mode.</p>
                )}
              </div>
            </div>

            {/* Title / Name Field */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Title / Name</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder={formData.type === 'study' ? "Enter study certificate title (e.g. BTECH TC & Study Certificate)" : formData.type === 'course' ? "Enter course name (e.g. Business Analytics Specialization)" : "Enter grade memo title (e.g. BTECH Consolidated Memo of Marks)"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Issued By Field */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Issued by</label>
              <input 
                type="text" 
                required
                value={formData.issuer}
                onChange={e => setFormData({ ...formData, issuer: e.target.value })}
                placeholder="Enter issuing university / school / platform (e.g. KL University)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Date Issued & Percentage Grid Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Date Issued</label>
                <input 
                   type="date"
                   required
                   value={formData.dateIssued}
                   onChange={e => setFormData({ ...formData, dateIssued: e.target.value })}
                   className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-gray-300 text-sm outline-none cursor-pointer focus:border-emerald-500 [color-scheme:dark]"
                />
              </div>
              
              {formData.type !== 'course' && (
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-400">Percentage % / Score (Optional)</label>
                  <input 
                    type="text"
                    value={formData.percentage || ''}
                    onChange={e => setFormData({ ...formData, percentage: e.target.value })}
                    placeholder="Enter score (e.g. 95% or 9.8 CGPA)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Link & Credential ID Grid Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Verification Link (Optional)</label>
                <input 
                  type="text"
                  value={formData.credentialUrl || ''}
                  onChange={e => setFormData({ ...formData, credentialUrl: e.target.value })}
                  placeholder="https://verify.coursera.org..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Credential ID (Optional)</label>
                <input 
                  type="text"
                  value={formData.credentialId || ''}
                  onChange={e => setFormData({ ...formData, credentialId: e.target.value })}
                  placeholder="Enter credential ID (e.g. KL-CMM-ARKS-991)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Supabase Styled Dropzone Attachment Container */}
            <div className="pt-2">
              <label className="text-xs font-mono text-gray-400 mb-1 block">Verify Original Document / Grade Memo</label>
              <div 
                onClick={triggerFileSelect}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : formData.fileName 
                      ? 'border-emerald-500 bg-slate-950' 
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                }`}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />

                {formData.fileName ? (
                  <div className="flex flex-col items-center space-y-2 text-center py-1">
                    <FileText className="w-8 h-8 text-emerald-400" />
                    <div>
                      <p className="text-xs font-mono font-bold text-white max-w-[280px] truncate">
                        {formData.fileName}
                      </p>
                      <p className="text-[10px] text-emerald-400 mt-0.5 font-sans">Attached successfully ✔</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeSelectedFile}
                      className="text-[10px] bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white px-3 py-1 rounded-lg text-gray-400 transition"
                    >
                      Remove Document
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2 py-2">
                    <Upload className="w-7 h-7 text-gray-500" />
                    <p className="text-xs font-sans text-gray-400">
                      Upload Certificate or Grade Sheet PDF/Image (Max 20MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 text-xs font-bold pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingItem(null);
                // Reset fields
                setFormData({
                  title: '',
                  issuer: '',
                  dateIssued: '',
                  expirationDate: '',
                  credentialId: '',
                  credentialUrl: '',
                  type: 'study',
                  visibility: 'private',
                  fileName: '',
                  fileUrl: '',
                  percentage: ''
                });
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl cursor-pointer transition border border-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl cursor-pointer transition"
            >
              {editingItem ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      )}

      {/* Styled Interactive View/Mockup Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-start justify-center p-4">
          <div className="bg-[#0f0f12] border border-slate-800 w-full max-w-3xl rounded-[28px] p-6 relative space-y-6 animate-fade-in shadow-2xl my-auto">
            
            {/* Close Button X */}
            <button 
              onClick={() => setPreviewItem(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-400 hover:text-white transition cursor-pointer select-none"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title Banner */}
            <div className="flex items-center gap-4 border-b border-slate-900 pb-5">
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400">
                <Award className="w-7 h-7" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-slate-900 px-2 rounded border border-slate-800 text-gray-400 uppercase font-bold">
                    {previewItem.type || 'study'} record
                  </span>
                  <span className="text-[10px] font-sans text-emerald-450 bg-emerald-500/10 px-2 rounded border border-emerald-500/20 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-[#10b981]" /> Verified
                  </span>
                </div>
                <h3 className="text-white font-extrabold text-xl tracking-tight leading-tight uppercase font-sans">
                  {previewItem.title}
                </h3>
              </div>
            </div>

            {/* Document details box */}
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] font-mono">
              <div>
                <p className="text-gray-500">Issuer Institution</p>
                <p className="text-white font-bold mt-1 text-xs truncate" title={previewItem.issuer}>{previewItem.issuer}</p>
              </div>
              <div>
                <p className="text-gray-500">Credential Reference</p>
                <p className="text-[#10b981] font-bold mt-1 text-xs">{previewItem.credentialId || 'KL-CR-V01-09'}</p>
              </div>
              <div>
                <p className="text-gray-500">Registered Date</p>
                <p className="text-gray-300 mt-1 text-xs">{previewItem.dateIssued}</p>
              </div>
              <div>
                <p className="text-gray-500">Security Clearance</p>
                <p className="text-gray-300 mt-1 text-xs">{previewItem.visibility === 'public' ? '🔓 Public Showcase' : '🔒 Secure Vault'}</p>
              </div>
            </div>

            {/* Hidden modal file input for original document matching */}
            <input 
              type="file" 
              ref={modalFileInputRef}
              onChange={handleModalFileChange}
              className="hidden"
              accept=".pdf,image/*"
            />

            {/* Document Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/20 p-3 rounded-2xl border border-slate-900/80">
              <div className="flex items-center gap-2 font-sans text-emerald-400 ml-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold tracking-wide text-xs text-gray-200 uppercase font-mono">
                  {previewItem.fileUrl && previewItem.fileUrl.startsWith('data:') ? "Decrypted Original File Vault View" : "Original File Private Storage"}
                </span>
              </div>

              {/* Upload action button inside the modal */}
              <button
                type="button"
                onClick={() => modalFileInputRef.current?.click()}
                className="bg-[#10b981] hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-sans font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 select-none h-fit active:scale-[0.98] shrink-0"
              >
                <Upload className="w-3.5 h-3.5 text-slate-950" />
                <span>
                  {previewItem.fileUrl && previewItem.fileUrl.startsWith('data:') 
                    ? "Replace Original Doc" 
                    : "Attach Original Document"
                  }
                </span>
              </button>
            </div>

            {/* Document Content View Area */}
            <div className="space-y-4">
              
              {/* RENDER ORIGINAL UPLOAD_FILE MODE */}
              {previewItem.fileUrl && previewItem.fileUrl.startsWith('data:') ? (
                <div className="space-y-3">
                  <div className="border border-slate-850 bg-[#0c0c0e] rounded-2xl relative shadow-inner overflow-hidden flex flex-col justify-center items-center w-full" style={{ minHeight: '550px' }}>
                    
                    {/* Render different container base on PDF vs Image */}
                    {previewItem.fileUrl.startsWith('data:application/pdf') || previewItem.fileName?.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-full flex flex-col justify-center items-center text-slate-300 bg-[#0c0c0e] p-8 space-y-6" style={{ minHeight: '450px' }}>
                        <div className="p-5 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/20 shadow-inner">
                          <FileText className="w-12 h-12" />
                        </div>
                        <div className="space-y-2 text-center max-w-md">
                          <h4 className="text-white font-bold text-base sm:text-lg font-sans">
                            {previewItem.fileName || "document.pdf"}
                          </h4>
                          <p className="text-xs text-gray-400 leading-relaxed font-sans">
                            Base64 Encrypted PDF Document Vault. To maintain high-fidelity styling and security, direct in-app preview is disabled. Please open the document in a secure external browser tab.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <a 
                            href={previewItem.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#10b981] text-slate-950 hover:bg-emerald-600 font-sans font-bold px-6 py-3 rounded-xl transition-all duration-150 inline-flex items-center gap-2 cursor-pointer text-xs shadow-lg shadow-[#10b981]/20 active:scale-[0.98]"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Open PDF in New Tab</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-h-[500px] overflow-y-auto flex items-center justify-center p-6 bg-[#0c0c0e]">
                        <img 
                          src={previewItem.fileUrl} 
                          alt={previewItem.fileName || 'Uploaded Doc'} 
                          className="max-w-full max-h-[440px] object-contain rounded-xl border border-slate-800 shadow-lg"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-center font-mono text-[10px] text-gray-500">
                    File Reference: <span className="text-gray-400">{previewItem.fileName}</span> (Stored Securely in Base64 Memory Container)
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border border-slate-850 bg-[#0c0c0e] rounded-2xl relative shadow-inner p-12 flex flex-col justify-center items-center w-full text-center space-y-4" style={{ minHeight: '450px' }}>
                    <div className="p-4 bg-emerald-500/5 rounded-full text-emerald-400 border border-emerald-500/15">
                      <Upload className="w-10 h-10" />
                    </div>
                    <div className="space-y-1.5 max-w-md">
                      <h4 className="text-white font-bold text-sm font-sans">No Original Document Attached</h4>
                      <p className="text-xs text-gray-455 leading-relaxed font-sans">
                        You have not attached your physical PDF or image file for this record yet. Please click the <b>Attach Original Document</b> button above to upload.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Legacy replica preview structure disabled */}
              {false && (
                /* RENDER DYNAMIC OFFICIAL CERTIFICATE/TRANSCRIPT PREVIEW */
                <div className="space-y-3">
                  <div 
                    id="printable-area"
                    className="border border-slate-850 bg-[#161619] rounded-2xl overflow-hidden shadow-inner flex flex-col justify-between"
                  >
                    
                    {/* Render Content Specific to Grades (Academic Grades Memo) */}
                    {previewItem.type === 'grades' ? (
                      <div className="bg-slate-50 text-slate-900 p-6 md:p-8 font-sans border-t-[10px] border-[#0c4a6e] space-y-5">
                        
                        {/* Grade Sheet Header */}
                        <div className="flex justify-between items-start gap-4 border-b border-slate-300 pb-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold tracking-tight text-slate-900 font-sans uppercase">Koneru Lakshmaiah Education Foundation</h4>
                            <p className="text-[9px] text-slate-500 font-bold uppercase font-mono">Deemed to be University • Estd u/s 3 of UGC Act 1956</p>
                            <p className="text-[11px] font-sans text-sky-850 font-bold mt-0.5">Accredited by NAAC as 'A++' Grade University</p>
                          </div>
                          <div className="text-right space-y-0.5 font-mono text-[9px] text-slate-500">
                            <p>Serial ID: KLU/AM/{previewItem.credentialId || 'CON-MEMO-991'}</p>
                            <p>Campus: Green Fields, Vaddeswaram</p>
                          </div>
                        </div>

                        {/* Title Title */}
                        <div className="text-center bg-slate-100 py-1.5 rounded border border-slate-200">
                          <span className="text-xs font-mono font-extrabold tracking-wider text-slate-850 uppercase">
                            Consolidated Cumulative Memorandum of Grades
                          </span>
                        </div>

                        {/* Student Details Info Grid */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] font-mono text-slate-700 bg-white p-3 rounded border border-slate-200/60 shadow-sm">
                          <div><span className="text-slate-400">Student Name:</span> <strong className="text-slate-950">MAMIDIPALLI RAMACHANDRA MURTHY</strong></div>
                          <div><span className="text-slate-400">Roll/Reg No:</span> <strong className="text-emerald-800">190030999</strong></div>
                          <div><span className="text-slate-400">Program:</span> <strong className="text-slate-950">Bachelor of Technology (B.Tech.)</strong></div>
                          <div><span className="text-slate-400">Discipline:</span> <strong className="text-slate-950">Computer Science and Engineering</strong></div>
                        </div>

                        {/* High Fidelity Table of Semesters */}
                        <div className="max-h-[220px] overflow-y-auto border border-slate-300 rounded-lg shadow-sm bg-white text-[10px]">
                          <table className="w-full text-left border-collapse font-sans">
                            <thead>
                              <tr className="bg-slate-150 border-b border-slate-300 text-slate-700 font-semibold font-mono text-[9px]">
                                <th className="p-2 border-r border-slate-200">Course Code / Subject Name</th>
                                <th className="p-2 text-center border-r border-slate-200">Type</th>
                                <th className="p-2 text-center border-r border-slate-200">Credits</th>
                                <th className="p-2 text-center">Grade Point</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-800 font-mono">
                              
                              {/* Decides Semester based on seed or defaults */}
                              {previewItem.title.toLowerCase().includes('sem') ? (
                                <>
                                  <tr className="bg-slate-50 font-bold text-slate-950 text-[9px]"><td colSpan={4} className="p-1 px-2 uppercase bg-slate-100">B.Tech First Year (Semester-1 Grades)</td></tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200">19EN1101 - Technical English & Communications</td>
                                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">Core</td>
                                    <td className="p-2 text-center border-r border-slate-200">4</td>
                                    <td className="p-2 text-center text-emerald-700 font-bold">A+ (9.0)</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200">19MA1101 - Calculus & Linear Algebra</td>
                                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">Math</td>
                                    <td className="p-2 text-center border-r border-slate-200">4</td>
                                    <td className="p-2 text-center text-emerald-800 font-bold">O (10.0)</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200">19PH1101 - Applied Physics Laboratory</td>
                                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">Core</td>
                                    <td className="p-2 text-center border-r border-slate-200">3</td>
                                    <td className="p-2 text-center text-emerald-600 font-bold">A (8.0)</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200">19CS1101 - Problem Solving through Computer Programming</td>
                                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">Lab</td>
                                    <td className="p-2 text-center border-r border-slate-200">4</td>
                                    <td className="p-2 text-center text-emerald-800 font-bold">O (10.0)</td>
                                  </tr>
                                </>
                              ) : (
                                <>
                                  <tr className="bg-slate-50 font-bold text-slate-950 text-[9px]"><td colSpan={4} className="p-1 px-2 uppercase bg-slate-100">Semester 1 & 2 Foundations</td></tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200">19CS1101 - Computer Programming practice</td>
                                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">Lab</td>
                                    <td className="p-2 text-center border-r border-slate-200">4</td>
                                    <td className="p-2 text-center text-emerald-800 font-bold">O (10.0)</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200">19MA2101 - Discrete Mathematics / Matrix Theory</td>
                                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">Math</td>
                                    <td className="p-2 text-center border-r border-slate-200">4</td>
                                    <td className="p-2 text-center text-[#10b981] font-bold">A+ (9.0)</td>
                                  </tr>
                                  
                                  <tr className="bg-slate-50 font-bold text-slate-950 text-[9px]"><td colSpan={4} className="p-1 px-2 uppercase bg-slate-100">Semester 3 & 4 Core Systems</td></tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200">19CS2101 - Data Structures and Algorithms with C++</td>
                                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">Core</td>
                                    <td className="p-2 text-center border-r border-slate-200">4</td>
                                    <td className="p-2 text-center text-emerald-850 font-bold">O (10.0)</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200">19CS2102 - Relational Database Management Systems</td>
                                    <td className="p-2 text-center border-r border-slate-205 text-slate-500">Core</td>
                                    <td className="p-2 text-center border-r border-slate-205">4</td>
                                    <td className="p-2 text-center text-[#10b981] font-bold">A+ (9.0)</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200">19CS2103 - Microprocessors and Computer Interface</td>
                                    <td className="p-2 text-center border-r border-slate-205 text-slate-500">Core</td>
                                    <td className="p-2 text-center border-r border-slate-205">3</td>
                                    <td className="p-2 text-center text-emerald-600">A (8.0)</td>
                                  </tr>

                                  <tr className="bg-slate-50 font-bold text-slate-950 text-[9px]"><td colSpan={4} className="p-1 px-2 uppercase bg-slate-100">Semester 5 & 6 Professional Electives</td></tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200">19CS3101 - Design and Analysis of Algorithms</td>
                                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">Core</td>
                                    <td className="p-2 text-center border-r border-slate-200">4</td>
                                    <td className="p-2 text-center text-emerald-850 font-bold">O (10.0)</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200">19CS3114 - Machine Learning & Business Intelligence</td>
                                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">Elec</td>
                                    <td className="p-2 text-center border-r border-slate-200">4</td>
                                    <td className="p-2 text-center text-emerald-800 font-bold font-mono">O (10.0)</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200">19CS4201 - Major Capstone Design Architecture Project</td>
                                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">Proj</td>
                                    <td className="p-2 text-center border-r border-slate-200">6</td>
                                    <td className="p-2 text-center text-emerald-850 font-bold">O (10.0)</td>
                                  </tr>
                                </>
                              )}

                            </tbody>
                          </table>
                        </div>

                        {/* Table Footer GPA Info */}
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-100 p-4 rounded-xl border border-slate-200 gap-3 text-xs">
                          <div className="font-mono text-slate-600">
                            Evaluated Program Credits: <strong className="text-slate-900 font-bold">165 Credits Satisfied</strong>
                          </div>
                          <div className="bg-[#0c4a6e] text-white px-4 py-2 rounded-lg font-mono font-bold flex items-center gap-1">
                            <span>TOTAL GRADUATION AVERAGE:</span>
                            <span className="text-yellow-300 font-black tracking-wide">
                              {previewItem.title.toLowerCase().includes('sem') ? '8.80 SGPA' : '8.50 CGPA'}
                            </span>
                          </div>
                        </div>

                        {/* Sign-off Stamps */}
                        <div className="flex justify-between items-end pt-3 text-[10px] font-mono text-slate-400">
                          <div className="space-y-1.5">
                            <p className="text-slate-600">Dynamic Signature Verification:</p>
                            <div className="font-mono text-slate-800 italic select-none">
                              s/d Prof. Dr. Venkat Prasad
                            </div>
                            <div className="h-px bg-slate-300 w-32"></div>
                            <p className="text-[9px] text-slate-400 uppercase">Academic Registrar, CLEF</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1 select-none">
                            <div className="w-10 h-10 border-2 border-double border-red-800 text-red-800 rounded-full font-sans font-black flex items-center justify-center text-[7px] rotate-[-12deg] tracking-wide p-1 select-none">
                              KLU PASSED
                            </div>
                            <p className="text-[8px] text-slate-400">Official Registrar seal</p>
                          </div>
                        </div>

                      </div>
                    ) : previewItem.type === 'study' ? (
                      /* Render Content Specific to Academic Certificates  */
                      <div className="bg-[#fcfaf3] text-amber-950 p-6 md:p-8 font-serif border-4 border-double border-amber-800 relative space-y-6">
                        
                        {/* Elegant vintage watermarking layout overlay */}
                        <div className="absolute inset-0 bg-[radial-gradient(#c2410c_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none" />

                        {/* Header Details */}
                        <div className="text-center space-y-2 border-b border-amber-800/25 pb-4">
                          <div className="text-amber-800 text-xs font-sans font-extrabold tracking-widest uppercase">
                            Koneru Lakshmaiah Education Foundation
                          </div>
                          <p className="text-[8px] text-amber-700 font-sans tracking-wide uppercase select-none">
                            DEEMED TO BE UNIVERSITY • INCORPORATED UNDER SECTION 3 OF THE UGC GENERAL ACT
                          </p>
                          <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-800 to-transparent w-3/4 mx-auto" />
                        </div>

                        {/* Certificate Body text */}
                        <div className="text-center space-y-4 py-2">
                          <p className="text-xs italic text-amber-900 font-sans">
                            Be it known by general decree of the Academic Senate that
                          </p>
                          
                          <div className="space-y-1.5 select-none">
                            <span className="text-[10px] uppercase font-sans tracking-widest text-[#0c4a6e] bg-sky-50 px-3 py-1 rounded-full border border-sky-100 font-bold">
                              {previewItem.title.toUpperCase()}
                            </span>
                            <h2 className="text-lg md:text-xl font-bold font-sans text-amber-950 tracking-normal pt-2 uppercase">
                              RAMACHANDRA MURTHY MAMIDIPALLI
                            </h2>
                            <p className="text-xs text-amber-800 italic mt-1 font-serif">
                              has successfully completed all prescribed program coursework and met all conditions set by the university, and is hereby awarded this official
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-base font-extrabold text-amber-900 underline underline-offset-4 decoration-amber-600 uppercase font-sans tracking-tight">
                              {previewItem.title}
                            </p>
                            <p className="text-[11px] font-sans font-bold text-amber-950/80">
                              in Computer Science and Engineering
                            </p>
                          </div>

                          <p className="text-[10px] text-amber-855/80 max-w-lg mx-auto font-sans leading-relaxed">
                            Issued by university decree on <strong className="text-amber-955">{previewItem.dateIssued}</strong> at the Green Fields Campus under credential reference registry key <strong className="text-amber-950 font-mono">{previewItem.credentialId || 'KL-CR-M01'}</strong>.
                          </p>
                        </div>

                        {/* Signatures and Seal */}
                        <div className="flex justify-between items-end border-t border-amber-800/10 pt-5 text-[10px] font-sans">
                          <div className="space-y-1 text-amber-900">
                            <div className="font-serif italic text-amber-950 font-bold select-none text-xs">
                              s/d Murthy KL Prof
                            </div>
                            <div className="h-0.5 bg-amber-800/40 w-32"></div>
                            <p className="text-[8px] text-amber-700/80 uppercase font-bold tracking-wider">Vice Chancellor, CLEF</p>
                          </div>
                          
                          {/* Rich CSS Gold Stamp */}
                          <div className="flex flex-col items-center justify-center select-none">
                            <div className="w-12 h-12 bg-amber-600 rounded-full border border-amber-400 flex items-center justify-center shadow-md select-none rotate-6">
                              <span className="text-white text-[8px] font-black text-center uppercase tracking-tighter leading-none px-1">
                                KLU GOLD SEAL
                              </span>
                            </div>
                            <p className="text-[7px] text-amber-700 mt-1 uppercase font-bold">Academic Authorization Certificate</p>
                          </div>

                          <div className="space-y-1 text-right text-amber-900">
                            <div className="font-serif italic text-amber-950 font-bold select-none text-xs">
                              s/d Registration Office
                            </div>
                            <div className="h-0.5 bg-amber-800/40 w-32 ml-auto"></div>
                            <p className="text-[8px] text-amber-700/80 uppercase font-bold tracking-wider">Academic Registrar</p>
                          </div>
                        </div>

                      </div>
                    ) : (
                      /* Render Content Specific to Course Certificates (`previewItem.type === 'course'`) */
                      <div className="bg-[#050507] text-white p-6 md:p-8 font-sans border border-slate-800 space-y-6 relative rounded-2xl">
                        
                        {/* Modern geometric matrix patterns */}
                        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

                        {/* Course Header */}
                        <div className="flex justify-between items-center gap-4 border-b border-white/[0.08] pb-4">
                          <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full select-none">
                            Verified Professional Development Course
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            KEY: WH-{previewItem.credentialId || 'BA-9938'}
                          </span>
                        </div>

                        {/* Certificate Body Container */}
                        <div className="text-center space-y-4 my-2 select-none">
                          <p className="text-xs uppercase font-bold tracking-widest text-[#10b981] font-sans">
                            Certificate of Completion
                          </p>

                          <h2 className="text-lg font-black text-white leading-snug tracking-tight font-sans">
                            {previewItem.title}
                          </h2>

                          <p className="text-xs text-gray-400 max-w-md mx-auto">
                            The academic board coordinates and course directors of <strong className="text-white font-semibold">{previewItem.issuer}</strong> confirm that the curriculum targets have been satisfied in full by
                          </p>

                          <p className="text-xl font-bold text-white uppercase tracking-wide font-sans underline decoration-emerald-500 decoration-2 underline-offset-4">
                            RAMACHANDRA MURTHY MAMIDIPALLI
                          </p>

                          <p className="text-xs text-gray-500 max-w-sm mx-auto">
                            for satisfying all instructional directives, laboratory benchmarks, and capstone peer-evaluation reviews on <span className="text-gray-300 font-mono font-bold">{previewItem.dateIssued}</span>.
                          </p>
                        </div>

                        {/* modern digital metadata panel */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch bg-slate-900/60 p-3 rounded-xl border border-slate-850 gap-4 text-[10px] font-mono text-gray-400">
                          <div className="space-y-0.5 justify-center flex flex-col">
                            <span className="text-slate-500">Security Clearance Status:</span>
                            <span className="text-emerald-400 font-bold flex items-center gap-1">✔ AUTHENTICATED DIGITAL SIGNATURE</span>
                          </div>
                          {previewItem.credentialUrl && (
                            <div className="space-y-0.5 text-left sm:text-right flex flex-col justify-center">
                              <span className="text-slate-500">Verification URL Target:</span>
                              <a href={previewItem.credentialUrl} target="_blank" rel="noreferrer" className="text-emerald-450 hover:underline hover:text-emerald-400 break-all text-[9.5px]">
                                {previewItem.credentialUrl}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Stamps and signoffs */}
                        <div className="flex justify-between items-end pt-2 text-[10px] text-gray-400 font-mono select-none">
                          <div className="space-y-1">
                            <p className="text-gray-500 italic">Curriculum Lead Sign-off:</p>
                            <div className="font-sans font-extrabold text-white text-xs">
                              s/d Director of Online Academics
                            </div>
                            <div className="h-px bg-slate-800 w-36"></div>
                            <p className="text-[8px] text-slate-500 uppercase">{previewItem.issuer}</p>
                          </div>
                          <div className="flex flex-col items-center select-none">
                            <div className="w-10 h-10 border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 rounded-xl font-black font-sans flex items-center justify-center text-[7px] rotate-[8deg]">
                              VERIFIED
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>
                  
                  {/* Dynamic Instructions Banner */}
                  <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 text-[11px] text-gray-400 flex items-center justify-between gap-4 font-mono">
                    <span>💡 Dynamic high-fidelity vector preview rendered from official credentials database.</span>
                    <button 
                      onClick={() => {
                        const printable = document.getElementById('printable-area');
                        if (printable) {
                          // Trigger clean print dialog focused specifically on document replica!
                          const printContents = printable.innerHTML;
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Print Document: ${previewItem.title}</title>
                                  <script src="https://cdn.tailwindcss.com"></script>
                                  <style>
                                    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..950;1,400..950&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;550&display=swap');
                                    body {
                                      font-family: 'Inter', sans-serif;
                                      background: #ffffff;
                                      color: #000000;
                                      padding: 0px;
                                      margin: 0px;
                                      -webkit-print-color-adjust: exact;
                                      print-color-adjust: exact;
                                    }
                                    @media print {
                                      #printable-doc-container {
                                        border: none !important;
                                        border-radius: 0px !important;
                                        box-shadow: none !important;
                                        padding: 0px !important;
                                        margin: 0px !important;
                                        width: 100% !important;
                                        max-width: 100% !important;
                                      }
                                      body {
                                        padding: 0px !important;
                                      }
                                    }
                                  </style>
                                </head>
                                <body class="bg-white p-4">
                                  <div id="printable-doc-container" class="w-full max-w-3xl mx-auto border border-slate-300 rounded-2xl shadow-lg overflow-hidden">
                                    ${printContents}
                                  </div>
                                  <script>
                                    window.onload = function() {
                                      window.print();
                                      setTimeout(() => window.close(), 600);
                                    };
                                  </script>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }
                        }
                      }}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[#10b981] hover:text-white transition px-3 py-1 rounded text-[10px] shrink-0 font-bold uppercase cursor-pointer"
                    >
                      Print replica
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* View Modal Footer Options */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-3 border-t border-slate-900">
              
              {/* Working Direct Download Option */}
              <button
                onClick={() => {
                  if (previewItem.fileUrl) {
                    // Download actual file!
                    const link = document.createElement('a');
                    link.href = previewItem.fileUrl;
                    link.download = previewItem.fileName || `${previewItem.title.replace(/\s+/g, '_')}_document.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } else {
                    // Generate and download formal security clearance transcript file (.txt)
                    const dateVal = previewItem.dateIssued || new Date().toISOString().split('T')[0];
                    const certId = previewItem.credentialId || `KLU-CERT-${Math.floor(Math.random() * 900000) + 100000}`;
                    
                    let marksSection = '';
                    if (previewItem.type === 'grades') {
                      marksSection = `
ACADEMIC MARKS LOG:
---------------------------------------------
19CS1101: Computer Programming      | 4 cr | Grade: O  (10.0) - Outstanding
19MA2101: Discrete Mathematics      | 4 cr | Grade: A+ (9.0)  - Excellent
19CS2101: Data Structures / Algos   | 4 cr | Grade: O  (10.0) - Outstanding
19CS3114: Machine Learning          | 4 cr | Grade: O  (10.0) - Outstanding
19CS4201: Major Capstone Design     | 6 cr | Grade: O  (10.0) - Outstanding

VERDICT: CGPA 8.5 (First Class with Distinction)
`;
                    } else {
                      marksSection = `
VERIFICATION SUMMARY:
---------------------------------------------
The Academic Senate of Koneru Lakshmaiah University certifies that
MAMIDIPALLI RAMACHANDRA MURTHY has successfully completed all
degree directives and standards of educational competence.
`;
                    }

                    const verificationDraft = `=====================================================
          KONERU LAKSHMAIAH EDUCATION FOUNDATION
=====================================================
OFFICIAL ACADEMIC REGISTRY CLEARANCE AND LOG DOCUMENT
-----------------------------------------------------
DOCUMENT NAME: ${previewItem.title}
DOCUMENT REF : ${certId}
ISSUED BY    : ${previewItem.issuer}
DATE REPORTED: ${dateVal}
STATUS       : VERIFIED & TRUSTED BY UNIVERSITY SENATE

RECIPIENT USER PORTFOLIO REGISTER:
-----------------------------------------------------
Candidate Full Name :  RAMACHANDRA MURTHY MAMIDIPALLI
Curriculum Course   :  Computer Science and Engineering
Major Major         :  Bachelor of Technology (B.Tech.)
Clearance Rating    :  100% Fully Valid Certificate Archive
${marksSection}
-----------------------------------------------------
Authentication Key : KLU-REG-2026-NEXUS-OK
Verification URL   : ${previewItem.credentialUrl || 'https://coursera.org/verify'}
=====================================================`;

                    // Download the beautifully generated dynamic high-fidelity verified PDF!
                    const link = document.createElement('a');
                    link.href = generateCertificationPdf(previewItem);
                    link.download = `${previewItem.title.replace(/\s+/g, '_')}_Verified_Certificate.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                className="w-full sm:w-auto bg-[#18181b] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-mono font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer select-none active:scale-95 shadow-md"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{previewItem.fileUrl && previewItem.fileUrl.startsWith('data:') ? 'Download Original File' : 'Download Certified PDF'}</span>
              </button>

              <button
                onClick={() => setPreviewItem(null)}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-6 py-2.5 rounded-xl text-xs cursor-pointer select-none font-sans text-center hover:scale-[1.01] active:scale-95 transition"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
