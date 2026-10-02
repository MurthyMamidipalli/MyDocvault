import React, { useState } from 'react';
import { 
  CreditCard, 
  RotateCw, 
  Download, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Sparkles, 
  QrCode, 
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { PersonalProfile, CurrentJob } from '../types';

interface DigitalVisitingCardTabProps {
  profile: PersonalProfile;
  currentJob?: CurrentJob;
  shareUrl: string;
}

export default function DigitalVisitingCardTab({
  profile,
  currentJob,
  shareUrl
}: DigitalVisitingCardTabProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extract user details dynamically from existing profile data
  const displayName = profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || '';
  const emailId = profile.email || '';
  const mobileNumber = profile.phone || '';
  const designation = profile.headline || currentJob?.role || '';

  // Use existing MyDocVault public share URL
  const targetShareUrl = shareUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetShareUrl)}&color=0f172a&bgboundary=0`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadCard = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 700;
      canvas.height = 420;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setDownloading(false);
        return;
      }

      // Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 700, 420);
      bgGrad.addColorStop(0, '#0a0d14');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      
      // Draw rounded rectangle card background
      ctx.beginPath();
      ctx.roundRect(0, 0, 700, 420, 24);
      ctx.fill();

      // Border outline
      ctx.strokeStyle = '#10b98155';
      ctx.lineWidth = 4;
      ctx.stroke();

      if (!isFlipped) {
        // --- FRONT SIDE ---
        // Header Tag
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('DIGITAL VISITING CARD', 45, 50);

        // Branding Logo Text
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('MYDOCVAULT', 570, 50);

        // User Name
        ctx.fillStyle = displayName ? '#ffffff' : '#64748b';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(displayName || 'Name Not Provided', 45, 105);

        // Designation
        ctx.fillStyle = designation ? '#34d399' : '#64748b';
        ctx.font = '600 16px sans-serif';
        ctx.fillText(designation || 'Designation Not Provided', 45, 138);

        // Divider
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(45, 165);
        ctx.lineTo(655, 165);
        ctx.stroke();

        // Contact Section: Email ID
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('EMAIL ID', 45, 205);
        ctx.fillStyle = emailId ? '#f8fafc' : '#64748b';
        ctx.font = '500 16px sans-serif';
        ctx.fillText(emailId || 'Email Not Provided', 45, 230);

        // Contact Section: Mobile Number
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('MOBILE NUMBER', 45, 280);
        ctx.fillStyle = mobileNumber ? '#f8fafc' : '#64748b';
        ctx.font = '500 16px sans-serif';
        ctx.fillText(mobileNumber || 'Mobile Not Provided', 45, 305);

        // Footer Badge
        ctx.fillStyle = '#10b981';
        ctx.font = '500 11px sans-serif';
        ctx.fillText('✓ Verified MyDocVault Profile', 45, 375);

        const link = document.createElement('a');
        link.download = `visiting-card-front.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setDownloading(false);
      } else {
        // --- BACK SIDE ---
        // Brand Header
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('MyDocVault', 45, 65);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px sans-serif';
        ctx.fillText('Personal Document Saver', 45, 90);

        // Headline Instruction
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('Scan to view my public profile', 45, 160);

        ctx.fillStyle = '#64748b';
        ctx.font = '12px monospace';
        const displayUrl = targetShareUrl.length > 40 ? targetShareUrl.substring(0, 37) + '...' : targetShareUrl;
        ctx.fillText(displayUrl, 45, 190);

        // Subtext
        ctx.fillStyle = '#10b981';
        ctx.font = '500 12px sans-serif';
        ctx.fillText('✓ Direct Public Profile Access', 45, 360);

        // Load QR image onto canvas
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // White background box for QR Code
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(440, 100, 215, 215, 16);
          ctx.fill();

          ctx.drawImage(img, 452, 112, 191, 191);

          const link = document.createElement('a');
          link.download = `visiting-card-back.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          setDownloading(false);
        };
        img.onerror = () => {
          const link = document.createElement('a');
          link.download = `visiting-card-back.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          setDownloading(false);
        };
        img.src = qrApiUrl;
      }
    } catch (e) {
      console.error(e);
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="digital-visiting-card-pane">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            Digital Visiting Card
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Two-sided business card reading directly from your profile data
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 hover:text-emerald-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition shadow-md active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''}`} />
            Flip Card ({isFlipped ? 'Back' : 'Front'})
          </button>

          <button
            onClick={handleDownloadCard}
            disabled={downloading}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Saving...' : 'Download Card'}
          </button>
        </div>
      </div>

      {/* Side selector buttons */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setIsFlipped(false)}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            !isFlipped 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold' 
              : 'text-gray-400 hover:text-gray-200 border border-transparent'
          }`}
        >
          Front Side
        </button>
        <button
          onClick={() => setIsFlipped(true)}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            isFlipped 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold' 
              : 'text-gray-400 hover:text-gray-200 border border-transparent'
          }`}
        >
          Back Side (QR Code)
        </button>
      </div>

      {/* 3D Flip Card Container */}
      <div className="flex justify-center items-center py-4">
        <div 
          className="w-full max-w-lg h-[320px] md:h-[340px] relative perspective-1000 select-none cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
          title="Click to flip card"
        >
          <div 
            className={`w-full h-full duration-700 transition-all transform-style-3d relative rounded-3xl shadow-2xl ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* FRONT SIDE */}
            <div 
              className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/30 p-6 md:p-8 flex flex-col justify-between overflow-hidden shadow-2xl backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {/* Card Ambient Background Accent */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Top Header Row */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                    DIGITAL VISITING CARD
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 text-xs font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-gray-400 font-sans font-semibold">MyDocVault</span>
                </div>
              </div>

              {/* Main Profile Info (User Name & Current Designation) */}
              <div className="space-y-1.5 relative z-10 my-auto">
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">
                  {displayName || (
                    <span className="text-gray-500 italic text-base">User Name Not Provided</span>
                  )}
                </h3>

                <p className="text-emerald-400 font-medium text-xs md:text-sm flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 shrink-0 text-emerald-400/80" />
                  {designation || (
                    <span className="text-gray-500 italic font-normal">Current Designation Not Provided</span>
                  )}
                </p>
              </div>

              {/* Contact Information (Email ID & Mobile Number) */}
              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                
                {/* Email ID */}
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono tracking-wider text-gray-500 uppercase flex items-center gap-1">
                    <Mail className="w-3 h-3 text-emerald-400/70" /> Email ID
                  </span>
                  <p className="text-xs text-gray-200 font-mono truncate">
                    {emailId || (
                      <span className="text-gray-500 italic font-sans text-xs">Not Provided</span>
                    )}
                  </p>
                </div>

                {/* Mobile Number */}
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono tracking-wider text-gray-500 uppercase flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400/70" /> Mobile Number
                  </span>
                  <p className="text-xs text-gray-200 font-mono truncate">
                    {mobileNumber || (
                      <span className="text-gray-500 italic font-sans text-xs">Not Provided</span>
                    )}
                  </p>
                </div>

              </div>

              {/* Bottom Flip hint */}
              <div className="absolute bottom-2 right-4 text-[9px] text-gray-500 font-mono flex items-center gap-1 opacity-70">
                <RotateCw className="w-2.5 h-2.5" /> Click to view QR Code
              </div>
            </div>

            {/* BACK SIDE */}
            <div 
              className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 p-6 md:p-8 flex flex-col justify-between overflow-hidden shadow-2xl backface-hidden"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              {/* Card Ambient Background Accent */}
              <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Branding Header */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="font-sans font-bold text-sm text-white leading-none">MyDocVault</h1>
                    <span className="text-[9px] text-gray-400 font-mono">Personal Document Saver</span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  PUBLIC PROFILE
                </div>
              </div>

              {/* QR Code & Scan Prompt */}
              <div className="flex items-center justify-between gap-4 my-auto relative z-10">
                <div className="space-y-2 flex-1">
                  <h4 className="text-sm md:text-base font-bold text-white tracking-tight leading-snug">
                    Scan to view my public profile
                  </h4>
                  <p className="text-xs text-emerald-400 font-medium">
                    Scans directly to MyDocVault public profile
                  </p>
                  
                  {/* Public Link Box */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink();
                    }}
                    className="flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/40 p-2 rounded-xl text-[10px] font-mono text-gray-300 transition cursor-pointer group mt-2"
                  >
                    <ExternalLink className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate flex-1">{targetShareUrl}</span>
                    {copied ? (
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="text-[9px] text-gray-500 group-hover:text-emerald-400 shrink-0 font-sans">
                        Copy
                      </span>
                    )}
                  </div>
                </div>

                {/* QR Code Graphic Frame */}
                <div className="bg-white p-2.5 rounded-2xl shadow-xl shrink-0 border-2 border-emerald-400/30 flex items-center justify-center">
                  <img 
                    src={qrApiUrl} 
                    alt="MyDocVault QR Code"
                    className="w-24 h-24 md:w-28 md:h-28 object-contain"
                  />
                </div>
              </div>

              {/* Footer Note */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-slate-800/80 relative z-10">
                <span>✓ Secure Public Link</span>
                <span className="font-mono text-emerald-400 flex items-center gap-1">
                  <RotateCw className="w-2.5 h-2.5" /> Click to flip
                </span>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 max-w-2xl mx-auto space-y-2">
        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Visiting Card Features & Security
        </h4>
        <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
          <li>Displays Name, Email, Mobile, and Current Designation directly from your profile data.</li>
          <li>QR Code encodes your existing MyDocVault public share URL without requiring login to view public info.</li>
          <li>Updating your MyDocVault profile automatically updates your visiting card details in real time.</li>
        </ul>
      </div>

    </div>
  );
}
