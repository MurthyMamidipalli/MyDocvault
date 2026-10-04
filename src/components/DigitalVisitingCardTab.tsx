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

      const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(x, y, w, h, r);
        } else {
          ctx.rect(x, y, w, h);
        }
      };

      // Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 700, 420);
      bgGrad.addColorStop(0, '#0a0d14');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      
      // Draw rounded rectangle card background
      ctx.beginPath();
      drawRoundRect(0, 0, 700, 420, 24);
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
        ctx.fillText(displayName || 'Name Not Provided', 45, 95);

        // Designation
        ctx.fillStyle = designation ? '#34d399' : '#64748b';
        ctx.font = '600 15px sans-serif';
        ctx.fillText(designation || 'Designation Not Provided', 45, 122);

        // Company Name
        if (companyName) {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '600 14px sans-serif';
          ctx.fillText(`Company: ${companyName}`, 45, 146);
        }

        // Divider
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(45, 168);
        ctx.lineTo(655, 168);
        ctx.stroke();

        // Contact Section: Email ID
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('EMAIL ID', 45, 205);
        ctx.fillStyle = emailId ? '#f8fafc' : '#64748b';
        ctx.font = '500 15px sans-serif';
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
        // --- BACK SIDE (Centered Layout without public share link text) ---
        // Brand Header Top
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('MyDocVault', 45, 50);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText('Personal Document Saver', 45, 70);

        // Public Profile Badge
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('PUBLIC PROFILE', 560, 50);

        // Centered QR Code & Texts
        ctx.textAlign = 'center';

        // Load QR image onto canvas
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // White background box for QR Code dead-centered
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          drawRoundRect(260, 105, 180, 180, 16);
          ctx.fill();

          ctx.drawImage(img, 270, 115, 160, 160);

          // Headline Instruction Centered Below QR
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('Scan to view my public profile', 350, 325);

          // Subtext
          ctx.fillStyle = '#10b981';
          ctx.font = '500 12px sans-serif';
          ctx.fillText('✓ Direct Public Profile Access', 350, 385);

          ctx.textAlign = 'left';

          const link = document.createElement('a');
          link.download = `visiting-card-back.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          setDownloading(false);
        };
        img.onerror = () => {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('Scan to view my public profile', 350, 325);

          ctx.fillStyle = '#10b981';
          ctx.font = '500 12px sans-serif';
          ctx.fillText('✓ Direct Public Profile Access', 350, 385);
          ctx.textAlign = 'left';

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
            Custom Logo URL
          </button>
        </div>
      </div>

      {logoOption === 'custom' && (
        <div className="max-w-md mx-auto space-y-1.5 animate-fade-in">
          <label className="text-[11px] font-mono text-gray-400">Custom Logo Image URL</label>
          <input
            type="url"
            placeholder="https://example.com/logo.png"
            value={customLogoUrl}
            onChange={(e) => setCustomLogoUrl(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
          />
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
          <li>Choose between your Profile Photo, Custom Logo URL, or MyDocVault Badge.</li>
          <li>QR Code encodes your existing MyDocVault public share URL without exposing raw URLs on the back card.</li>
        </ul>
      </div>

    </div>
  );
}
