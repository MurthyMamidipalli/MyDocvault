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
  ShieldCheck,
  Check,
  Building2,
  Image as ImageIcon
} from 'lucide-react';
import { PersonalProfile, CurrentJob, Experience, getAvatarInitials } from '../types';

interface DigitalVisitingCardTabProps {
  profile: PersonalProfile;
  currentJob?: CurrentJob;
  experience?: Experience[];
  shareUrl: string;
}

export default function DigitalVisitingCardTab({
  profile,
  currentJob,
  experience = [],
  shareUrl
}: DigitalVisitingCardTabProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [logoOption, setLogoOption] = useState<'avatar' | 'badge' | 'custom'>('avatar');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');

  // Extract user details dynamically from existing profile data
  const displayName = profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || '';
  const emailId = profile.email || '';
  const mobileNumber = profile.phone || '';
  const designation = profile.headline || currentJob?.role || '';
  const companyName = currentJob?.employer || currentJob?.company || (experience && experience.length > 0 ? experience[0].company : '');
  const avatarUrl = profile.avatarUrl || '';

  // Use existing MyDocVault public share URL
  const targetShareUrl = shareUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetShareUrl)}&color=0f172a&bgboundary=0`;

  const activeLogo = logoOption === 'custom' && customLogoUrl 
    ? customLogoUrl 
    : logoOption === 'avatar' && avatarUrl 
      ? avatarUrl 
      : '';

  const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(x, y, w, h, r);
    } else {
      ctx.rect(x, y, w, h);
    }
  };

  const drawCardBackground = (ctx: CanvasRenderingContext2D, yOffset: number) => {
    const bgGrad = ctx.createLinearGradient(0, yOffset, 700, yOffset + 420);
    bgGrad.addColorStop(0, '#0a0d14');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    
    ctx.beginPath();
    drawRoundRect(ctx, 0, yOffset, 700, 420, 24);
    ctx.fill();

    ctx.strokeStyle = '#10b98155';
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  const drawFrontContent = (ctx: CanvasRenderingContext2D, yOffset: number) => {
    // Header Tag
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('DIGITAL VISITING CARD', 45, yOffset + 50);

    // Branding Logo Text
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('MYDOCVAULT', 570, yOffset + 50);

    // User Name
    ctx.fillStyle = displayName ? '#ffffff' : '#64748b';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(displayName || 'Name Not Provided', 45, yOffset + 95);

    // Designation
    ctx.fillStyle = designation ? '#34d399' : '#64748b';
    ctx.font = '600 15px sans-serif';
    ctx.fillText(designation || 'Designation Not Provided', 45, yOffset + 122);

    // Company Name
    if (companyName) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 14px sans-serif';
      ctx.fillText(`Company: ${companyName}`, 45, yOffset + 146);
    }

    // Divider
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(45, yOffset + 168);
    ctx.lineTo(655, yOffset + 168);
    ctx.stroke();

    // Contact Section: Email ID
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('EMAIL ID', 45, yOffset + 205);
    ctx.fillStyle = emailId ? '#f8fafc' : '#64748b';
    ctx.font = '500 15px sans-serif';
    ctx.fillText(emailId || 'Email Not Provided', 45, yOffset + 230);

    // Contact Section: Mobile Number
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('MOBILE NUMBER', 45, yOffset + 280);
    ctx.fillStyle = mobileNumber ? '#f8fafc' : '#64748b';
    ctx.font = '500 16px sans-serif';
    ctx.fillText(mobileNumber || 'Mobile Not Provided', 45, yOffset + 305);

    // Footer Badge
    ctx.fillStyle = '#10b981';
    ctx.font = '500 11px sans-serif';
    ctx.fillText('✓ Verified MyDocVault Profile', 45, yOffset + 375);
  };

  const drawBackContent = (ctx: CanvasRenderingContext2D, yOffset: number, onComplete: () => void) => {
    // Brand Header Top
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('MyDocVault', 45, yOffset + 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Personal Document Saver', 45, yOffset + 70);

    // Public Profile Badge
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('PUBLIC PROFILE', 560, yOffset + 50);

    // Load QR image onto canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // White background box for QR Code dead-centered
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      drawRoundRect(ctx, 260, yOffset + 105, 180, 180, 16);
      ctx.fill();

      ctx.drawImage(img, 270, yOffset + 115, 160, 160);

      // Headline Instruction Centered Below QR
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Scan to view my public profile', 350, yOffset + 325);

      // Subtext
      ctx.fillStyle = '#10b981';
      ctx.font = '500 12px sans-serif';
      ctx.fillText('✓ Direct Public Profile Access', 350, yOffset + 385);
      ctx.textAlign = 'left';

      onComplete();
    };
    img.onerror = () => {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Scan to view my public profile', 350, yOffset + 325);

      ctx.fillStyle = '#10b981';
      ctx.font = '500 12px sans-serif';
      ctx.fillText('✓ Direct Public Profile Access', 350, yOffset + 385);
      ctx.textAlign = 'left';

      onComplete();
    };
    img.src = qrApiUrl;
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

      drawCardBackground(ctx, 0);

      if (!isFlipped) {
        // --- FRONT SIDE ---
        drawFrontContent(ctx, 0);
        const link = document.createElement('a');
        link.download = `visiting-card-front.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setDownloading(false);
      } else {
        // --- BACK SIDE ---
        drawBackContent(ctx, 0, () => {
          const link = document.createElement('a');
          link.download = `visiting-card-back.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          setDownloading(false);
        });
      }
    } catch (e) {
      console.error(e);
      setDownloading(false);
    }
  };

  // Download both front and back sides together at a time
  const handleDownloadBothSides = () => {
    setDownloading(true);
    try {
      // 1. Generate composite dual card (Front on top, Back on bottom)
      const canvas = document.createElement('canvas');
      canvas.width = 700;
      canvas.height = 870; // 420 + 30 spacing + 420
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setDownloading(false);
        return;
      }

      // Canvas background fill
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, 700, 870);

      // Draw Front Card at top (y = 0)
      drawCardBackground(ctx, 0);
      drawFrontContent(ctx, 0);

      // Draw Back Card at bottom (y = 450)
      drawCardBackground(ctx, 450);
      drawBackContent(ctx, 450, () => {
        // Download composite image with both sides
        const dualLink = document.createElement('a');
        dualLink.download = `visiting-card-both-sides.png`;
        dualLink.href = canvas.toDataURL('image/png');
        dualLink.click();

        // Also generate individual front and back files for complete convenience
        setTimeout(() => {
          try {
            const frontCanvas = document.createElement('canvas');
            frontCanvas.width = 700;
            frontCanvas.height = 420;
            const fCtx = frontCanvas.getContext('2d');
            if (fCtx) {
              drawCardBackground(fCtx, 0);
              drawFrontContent(fCtx, 0);
              const fLink = document.createElement('a');
              fLink.download = `visiting-card-front.png`;
              fLink.href = frontCanvas.toDataURL('image/png');
              fLink.click();
            }

            const backCanvas = document.createElement('canvas');
            backCanvas.width = 700;
            backCanvas.height = 420;
            const bCtx = backCanvas.getContext('2d');
            if (bCtx) {
              drawCardBackground(bCtx, 0);
              drawBackContent(bCtx, 0, () => {
                const bLink = document.createElement('a');
                bLink.download = `visiting-card-back.png`;
                bLink.href = backCanvas.toDataURL('image/png');
                bLink.click();
              });
            }
          } catch (e) {
            console.warn("[Individual Side Export]", e);
          }
          setDownloading(false);
        }, 300);
      });
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
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 hover:text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition shadow-md active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''}`} />
            <span>Flip ({isFlipped ? 'Back' : 'Front'})</span>
          </button>

          <button
            onClick={handleDownloadCard}
            disabled={downloading}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-gray-200 hover:text-white font-medium px-3.5 py-2 rounded-xl text-xs cursor-pointer transition shadow-md active:scale-95 disabled:opacity-50"
            title={`Download ${isFlipped ? 'Back Side' : 'Front Side'}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Saving...' : `Download ${isFlipped ? 'Back' : 'Front'}`}</span>
          </button>

          <button
            onClick={handleDownloadBothSides}
            disabled={downloading}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            title="Download both Front and Back sides at a time"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Processing...' : 'Download Both Sides'}</span>
          </button>
        </div>
      </div>

      {/* Controls & Logo Selection Panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
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

        {/* Logo / Badge Option Picker */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400 font-mono text-[11px] font-semibold">Card Logo / Avatar:</span>
          <button
            onClick={() => setLogoOption('avatar')}
            className={`px-3 py-1 rounded-lg border text-xs transition cursor-pointer ${
              logoOption === 'avatar'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                : 'bg-slate-950 text-gray-400 border-slate-800 hover:text-white'
            }`}
          >
            Profile Photo
          </button>
          <button
            onClick={() => setLogoOption('badge')}
            className={`px-3 py-1 rounded-lg border text-xs transition cursor-pointer ${
              logoOption === 'badge'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                : 'bg-slate-950 text-gray-400 border-slate-800 hover:text-white'
            }`}
          >
            MyDocVault Badge
          </button>
          <button
            onClick={() => setLogoOption('custom')}
            className={`px-3 py-1 rounded-lg border text-xs transition cursor-pointer ${
              logoOption === 'custom'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                : 'bg-slate-950 text-gray-400 border-slate-800 hover:text-white'
            }`}
          >
            Custom Logo
          </button>
        </div>
      </div>

      {logoOption === 'custom' && (
        <div className="max-w-md mx-auto space-y-2 animate-fade-in">
          <label className="text-[11px] font-mono text-gray-400 block">Custom Logo Image File</label>
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
            {customLogoUrl ? (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-emerald-500/40 shrink-0 bg-slate-900 flex items-center justify-center">
                <img src={customLogoUrl} alt="Custom Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg border border-dashed border-slate-700 shrink-0 bg-slate-900 flex items-center justify-center text-gray-500">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold cursor-pointer transition select-none">
                <span>{customLogoUrl ? 'Change Image File' : 'Upload Image File'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          setCustomLogoUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              {customLogoUrl && (
                <button
                  type="button"
                  onClick={() => setCustomLogoUrl('')}
                  className="ml-2 text-[11px] text-gray-500 hover:text-rose-400 transition cursor-pointer select-none"
                >
                  Remove
                </button>
              )}
              <p className="text-[10px] text-gray-500 mt-1 truncate">Upload any image file (PNG, JPG, SVG, WebP)</p>
            </div>
          </div>
        </div>
      )}

      {/* 3D Flip Card Container */}
      <div className="flex justify-center items-center py-4">
        <div 
          className="w-full max-w-lg h-[340px] md:h-[360px] relative perspective-1000 select-none cursor-pointer"
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

              {/* Top Header Row with Selected Logo / Avatar */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                    DIGITAL VISITING CARD
                  </span>
                </div>

                {/* Logo / Avatar Display */}
                <div className="flex items-center gap-2">
                  {activeLogo ? (
                    <img 
                      src={activeLogo} 
                      alt="Card Logo" 
                      className="w-8 h-8 rounded-full object-cover border border-emerald-500/40 shadow-md bg-slate-950"
                      referrerPolicy="no-referrer"
                    />
                  ) : logoOption === 'avatar' && displayName ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                      {getAvatarInitials(profile)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-mono">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] text-gray-400 font-sans font-semibold">MyDocVault</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Profile Info (User Name, Designation & Company Name) */}
              <div className="space-y-1 relative z-10 my-auto">
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

                {companyName && (
                  <p className="text-gray-300 font-semibold text-xs md:text-sm flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    {companyName}
                  </p>
                )}
              </div>

              {/* Contact Information (Full Email ID & Mobile Number) */}
              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                
                {/* Email ID (Fully Visible, No Truncation) */}
                <div className="space-y-0.5 sm:col-span-1">
                  <span className="text-[9px] font-mono tracking-wider text-gray-500 uppercase flex items-center gap-1">
                    <Mail className="w-3 h-3 text-emerald-400/70" /> Email ID
                  </span>
                  <p className="text-[11px] md:text-xs text-gray-200 font-mono break-all font-medium leading-tight">
                    {emailId || (
                      <span className="text-gray-500 italic font-sans text-xs">Not Provided</span>
                    )}
                  </p>
                </div>

                {/* Mobile Number */}
                <div className="space-y-0.5 sm:col-span-1">
                  <span className="text-[9px] font-mono tracking-wider text-gray-500 uppercase flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400/70" /> Mobile Number
                  </span>
                  <p className="text-xs text-gray-200 font-mono break-all font-medium">
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

            {/* BACK SIDE (Clean Centered QR Code Layout - Public Share Link Removed) */}
            <div 
              className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 p-6 flex flex-col justify-between overflow-hidden shadow-2xl backface-hidden"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              {/* Card Ambient Background Accent */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Branding Header */}
              <div className="flex items-center justify-between relative z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="font-sans font-bold text-sm text-white leading-none">MyDocVault</h1>
                    <span className="text-[9px] text-gray-400 font-mono">Personal Document Saver</span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                  PUBLIC PROFILE
                </div>
              </div>

              {/* CENTERED QR Code & Scan Prompt (Public Share Link Removed) */}
              <div className="flex flex-col items-center justify-center text-center my-auto relative z-10 py-2 space-y-3">
                {/* QR Code Graphic Frame (Dead Center) */}
                <div className="bg-white p-3 rounded-2xl shadow-2xl border-2 border-emerald-400/40 flex items-center justify-center shrink-0">
                  <img 
                    src={qrApiUrl} 
                    alt="MyDocVault QR Code"
                    className="w-28 h-28 md:w-32 md:h-32 object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs md:text-sm font-bold text-white tracking-tight">
                    Scan to view my public profile
                  </h4>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    Scans directly to MyDocVault public profile
                  </p>
                </div>
              </div>

              {/* Footer Note */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-slate-800/80 relative z-10 shrink-0">
                <span>✓ Secure Public QR Code</span>
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
          <li>Displays Name, Email (fully visible), Mobile, and Current Designation directly from your profile data.</li>
          <li>Choose between your Profile Photo, Custom Logo, or MyDocVault Badge.</li>
          <li>QR Code encodes your existing MyDocVault public share URL without exposing raw URLs on the back card.</li>
        </ul>
      </div>

    </div>
  );
}
