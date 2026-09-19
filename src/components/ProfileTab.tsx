import React, { useState } from 'react';
import { supabase, STORAGE_BUCKETS, uploadFileToSupabaseStorage } from '../lib/supabase';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Camera, 
  Trash2, 
  Briefcase,
  Globe,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { PersonalProfile } from '../types';

interface ProfileTabProps {
  profile: PersonalProfile;
  onUpdateProfile: (profile: PersonalProfile) => void;
  shareUrl?: string;
}

export default function ProfileTab({ profile, onUpdateProfile, shareUrl: passedShareUrl }: ProfileTabProps) {
  const [formData, setFormData] = useState<PersonalProfile>({ ...profile });
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Sync state if profile prop changes externally
  React.useEffect(() => {
    setFormData({ ...profile });
  }, [profile]);

  const getOrigin = () => {
    if (typeof window !== 'undefined') {
      return (import.meta as any).env?.VITE_PUBLIC_URL || window.location.origin;
    }
    return '';
  };

  const shareSlug = formData.shareSlug || (formData.name ? formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'user');
  const shareUrl = passedShareUrl || `${getOrigin()}/${shareSlug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${formData.name || 'User'} - MyDocVault Profile`,
          text: `Check out my MyDocVault public profile: ${shareUrl}`,
          url: shareUrl
        });
      } catch (e) {}
    } else {
      handleCopy();
    }
  };

  const checkUsernameAvailability = async (slugToCheck: string): Promise<boolean> => {
    const cleanSlug = slugToCheck.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (!cleanSlug) return true;
    setIsCheckingUsername(true);
    setUsernameError(null);
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('share_slug', cleanSlug);

      if (error) {
        setIsCheckingUsername(false);
        return true;
      }

      const isTaken = data && data.some(row => row.user_id !== currentUser?.id);
      setIsCheckingUsername(false);
      if (isTaken) {
        setUsernameError("Username already taken. Please choose another username.");
        return false;
      }
      return true;
    } catch (err) {
      setIsCheckingUsername(false);
      return true;
    }
  };

  const handleUsernameChange = async (newVal: string) => {
    const cleanSlug = newVal.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const updated = { ...formData, shareSlug: cleanSlug };
    setFormData(updated);
    onUpdateProfile(updated);
    if (cleanSlug.length >= 2) {
      await checkUsernameAvailability(cleanSlug);
    } else {
      setUsernameError(null);
    }
  };

  const handleChange = (field: keyof PersonalProfile, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdateProfile(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.shareSlug) {
      const isAvailable = await checkUsernameAvailability(formData.shareSlug);
      if (!isAvailable) return;
    }
    onUpdateProfile(formData);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const result = await uploadFileToSupabaseStorage(STORAGE_BUCKETS.PROFILE_IMAGES, user.id, file, 'avatar');
        if (result?.publicUrl) {
          const updated = { ...formData, avatarUrl: result.publicUrl };
          setFormData(updated);
          onUpdateProfile(updated);
          return;
        }
      }
      
      // Fallback local canvas compression if storage upload deferred
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const rawResult = reader.result;
          const img = new Image();
          img.src = rawResult;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_AXIS = 300;

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
              const compressed = canvas.toDataURL('image/jpeg', 0.85);
              const updated = { ...formData, avatarUrl: compressed };
              setFormData(updated);
              onUpdateProfile(updated);
            } else {
              const updated = { ...formData, avatarUrl: rawResult };
              setFormData(updated);
              onUpdateProfile(updated);
            }
          };
          img.onerror = () => {
            const updated = { ...formData, avatarUrl: rawResult };
            setFormData(updated);
            onUpdateProfile(updated);
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    const updated = { ...formData, avatarUrl: "" };
    setFormData(updated);
    onUpdateProfile(updated);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="profile-pane">
      {/* Tab Page Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">Personal Profile Hub</h2>
          <p className="text-xs text-gray-400 mt-1">Manage corporate identity, biography summary, and public coordinates</p>
        </div>
      </div>

      {/* Hero Profile Photo & Header Section (Exact matching screenshot layout) */}
      <div className="bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-radial-at-t from-emerald-500/5 via-transparent to-transparent opacity-60 pointer-events-none" />
        
        {/* Profile Avatar Frame */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 to-cyan-400 shadow-xl overflow-hidden flex items-center justify-center">
            {formData.avatarUrl ? (
              <img 
                src={formData.avatarUrl} 
                alt={formData.name || "User Avatar"} 
                className="w-full h-full rounded-full object-cover bg-slate-950"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center font-bold text-3xl select-none">
                {(() => {
                  const currentName = formData.name || '';
                  if (currentName) {
                    const parts = currentName.trim().split(/\s+/).filter(Boolean);
                    if (parts.length >= 2) {
                      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                    }
                    return currentName.slice(0, 2).toUpperCase();
                  }
                  return 'US';
                })()}
              </div>
            )}
          </div>
        </div>

        {/* User Branding & Avatar Controls */}
        <div className="flex-1 text-center md:text-left space-y-4 relative z-10">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white tracking-tight leading-none animate-fade-in">
              {formData.name || ''}
            </h3>
            <p className="text-emerald-400 text-sm font-medium tracking-wide">
              {formData.headline || ''}
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <label className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-gray-200 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md active:scale-95">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              Change Photo
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </label>
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 hover:text-rose-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form Fields */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Identity & Naming */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/60">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <User className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white tracking-wide uppercase font-mono">Identity & Naming</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Full Name / Display Name */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                  Full Name / Display Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* First Name */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                  First Name
                </label>
                <input 
                  type="text" 
                  value={formData.firstName || ''}
                  onChange={e => handleChange('firstName', e.target.value)}
                  placeholder="First name or initials"
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                  Last Name
                </label>
                <input 
                  type="text" 
                  value={formData.lastName || ''}
                  onChange={e => handleChange('lastName', e.target.value)}
                  placeholder="Last name / Surname"
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                />
              </div>

              {/* Professional Tagline */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                  Professional Tagline
                </label>
                <div className="relative flex items-center">
                  <Briefcase className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input 
                    type="text" 
                    required
                    value={formData.headline}
                    onChange={e => handleChange('headline', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Professional Bio */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                  Professional Bio
                </label>
                <textarea 
                  rows={4}
                  value={formData.bio}
                  onChange={e => handleChange('bio', e.target.value)}
                  placeholder="Write a powerful summary of your career expertise..."
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl p-4 text-white text-sm outline-none resize-none transition-all shadow-inner font-sans leading-relaxed"
                />
              </div>

            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/60">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <Mail className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white tracking-wide uppercase font-mono">Contact Information</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Primary Email */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                  Primary Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Secondary Email */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                  Secondary Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input 
                    type="email" 
                    value={formData.secondaryEmail || ''}
                    onChange={e => handleChange('secondaryEmail', e.target.value)}
                    placeholder="Optional secondary email address"
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Primary Phone */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                  Primary Phone
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input 
                    type="text" 
                    required
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Secondary Phone */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                  Secondary Phone
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input 
                    type="text" 
                    value={formData.secondaryPhone || ''}
                    onChange={e => handleChange('secondaryPhone', e.target.value)}
                    placeholder="Optional secondary phone coordinates"
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Geography Location / Workspace Base */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                  Geography Location / Workspace Base
                </label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input 
                    type="text" 
                    required
                    value={formData.location}
                    onChange={e => handleChange('location', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Public Sharing Settings */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/60">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <Globe className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white tracking-wide uppercase font-mono">Public Sharing Settings</h4>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-4">
                
                {/* Public Username / Slug Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase flex items-center justify-between">
                    <span>Public Username / Slug Identifier</span>
                    {isCheckingUsername && <span className="text-emerald-400 text-[10px]">Checking availability...</span>}
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30 overflow-hidden shadow-inner font-mono text-sm">
                    <span className="bg-slate-900 border-r border-slate-800 px-3.5 py-2.5 text-xs text-gray-400 font-semibold select-none shrink-0">
                      {getOrigin()}/
                    </span>
                    <input 
                      type="text" 
                      value={formData.shareSlug || ''}
                      onChange={e => handleUsernameChange(e.target.value)}
                      placeholder="e.g. ram or ramachandra-murthy"
                      className="w-full bg-transparent px-3.5 py-2.5 text-white text-sm outline-none font-mono"
                    />
                  </div>
                  {usernameError ? (
                    <p className="text-xs font-semibold text-rose-400 font-sans bg-rose-500/10 p-2.5 border border-rose-500/20 rounded-xl">
                      ⚠️ {usernameError}
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-500">
                      Your unique URL slug identifier. Lowercase letters, numbers, and hyphens allowed.
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                    Public Profile Status
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() => handleChange('publicProfile', true)}
                      className={`flex-1 min-w-[180px] max-w-[280px] py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                        formData.publicProfile === true 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 font-bold' 
                          : 'bg-slate-950 text-gray-400 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Yes, Enable Public Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChange('publicProfile', false)}
                      className={`flex-1 min-w-[180px] max-w-[280px] py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                        formData.publicProfile !== true 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 font-bold' 
                          : 'bg-slate-950 text-gray-400 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>No, Disable Public Profile</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    When enabled, visitors can see your designated public data at your unique shareable profile link. When disabled, the public link displays that your profile is not publicly available.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                    Your Dedicated Public Profile Link
                  </label>
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="text-[11px] font-mono text-gray-300 truncate select-all">{shareUrl}</span>
                    <div className="flex items-center gap-2 shrink-0 font-sans">
                      <button
                        type="button"
                        onClick={handleCopy}
                        title="Copy public link"
                        className="bg-slate-900 hover:bg-slate-850 text-gray-300 hover:text-white px-3 py-2 rounded-lg border border-slate-800 transition active:scale-95 cursor-pointer text-xs font-bold flex items-center gap-1.5"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-gray-400" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open public live link"
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-lg transition inline-flex items-center gap-1.5 text-xs font-bold active:scale-95 cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open Profile</span>
                      </a>
                    </div>
                  </div>
                  {copied && (
                    <p className="text-xs text-emerald-400 font-semibold font-mono animate-fade-in">
                      ✓ Public profile link copied.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-800/60">
            <button 
              type="submit" 
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] font-bold text-slate-950 px-6 py-3 rounded-xl cursor-pointer text-xs transition-all shadow-lg shadow-emerald-500/10"
            >
              Save Profile Changes
            </button>
            
            {success && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile updated successfully!</span>
              </div>
            )}
          </div>

        </form>
      </div>

    </div>
  );
}
