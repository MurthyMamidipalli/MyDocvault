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
  ExternalLink,
  Lock,
  X,
  Building2
} from 'lucide-react';
import { PersonalProfile, getAvatarInitials } from '../types';

interface ProfileTabProps {
  profile: PersonalProfile;
  onUpdateProfile: (profile: PersonalProfile) => void;
  shareUrl?: string;
}

export default function ProfileTab({ profile, onUpdateProfile, shareUrl: passedShareUrl }: ProfileTabProps) {
  const [formData, setFormData] = useState<PersonalProfile>({ ...profile });
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Sync state if profile prop changes externally
  React.useEffect(() => {
    setFormData(prev => {
      // Preserve active local edits so background fetches don't wipe out freshly selected photos or publicProfile toggle
      const incomingAvatar = profile.avatarUrl;
      const effectiveAvatar = incomingAvatar !== undefined && incomingAvatar !== '' ? incomingAvatar : (prev.avatarUrl || '');
      const incomingPublic = profile.publicProfile;
      const effectivePublic = incomingPublic !== undefined ? incomingPublic : (prev.publicProfile !== undefined ? prev.publicProfile : true);

      return {
        ...profile,
        company: profile.company || prev.company || '',
        avatarUrl: effectiveAvatar,
        publicProfile: effectivePublic
      };
    });
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
    let updated = { ...formData, [field]: value };
    if (field === 'name') {
      const parts = String(value || '').trim().split(/\s+/);
      if (parts.length > 0 && parts[0]) {
        updated.firstName = parts[0];
        updated.lastName = parts.slice(1).join(' ');
      } else {
        updated.firstName = '';
        updated.lastName = '';
      }
    } else if (field === 'firstName' || field === 'lastName') {
      const first = field === 'firstName' ? String(value || '') : String(updated.firstName || '');
      const last = field === 'lastName' ? String(value || '') : String(updated.lastName || '');
      updated.name = [first, last].filter(Boolean).join(' ').trim();
    }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const rawResult = reader.result;
      if (typeof rawResult !== 'string') return;

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_AXIS = 360;

          if (width > height) {
            if (width > MAX_AXIS) {
              height = Math.round((height * MAX_AXIS) / width);
              width = MAX_AXIS;
            }
          } else {
            if (height > MAX_AXIS) {
              width = Math.round((width * MAX_AXIS) / height);
              height = MAX_AXIS;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          let finalAvatar = rawResult;
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            finalAvatar = canvas.toDataURL('image/jpeg', 0.85);
          }
          const updated = { ...formData, avatarUrl: finalAvatar };
          setFormData(updated);
          onUpdateProfile(updated);
        } catch (err) {
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
      img.src = rawResult;
    };
    reader.readAsDataURL(file);

    // Reset input value so selecting the same file again triggers onChange
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    const updated = { ...formData, avatarUrl: "" };
    setFormData(updated);
    onUpdateProfile(updated);
  };

  const handleClearProfileDetails = () => {
    const updated: PersonalProfile = {
      ...formData,
      company: '',
      headline: '',
      bio: '',
      phone: '',
      secondaryEmail: '',
      secondaryPhone: '',
      location: '',
      avatarUrl: ''
    };
    setFormData(updated);
    onUpdateProfile(updated);
    setShowClearConfirm(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
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
                {getAvatarInitials(formData)}
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
            <p className="text-emerald-400 text-sm font-medium tracking-wide flex items-center justify-center md:justify-start flex-wrap gap-2">
              <span>{formData.headline || ''}</span>
              {formData.company && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-300 font-normal flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400/80" />
                    {formData.company}
                  </span>
                </>
              )}
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                    Professional Tagline
                  </label>
                  {formData.headline && (
                    <button
                      type="button"
                      onClick={() => handleChange('headline', '')}
                      className="text-[11px] text-gray-500 hover:text-rose-400 font-mono transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Briefcase className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input 
                    type="text" 
                    value={formData.headline || ''}
                    placeholder="e.g. Senior Business Analyst / Full Stack Engineer"
                    onChange={e => handleChange('headline', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-10 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                  {formData.headline && (
                    <button
                      type="button"
                      onClick={() => handleChange('headline', '')}
                      className="absolute right-3 text-gray-500 hover:text-rose-400 p-1"
                      title="Clear headline"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Company Name / Organization */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                    Company Name / Organization
                  </label>
                  {formData.company && (
                    <button
                      type="button"
                      onClick={() => handleChange('company', '')}
                      className="text-[11px] text-gray-500 hover:text-rose-400 font-mono transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Building2 className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input 
                    type="text" 
                    value={formData.company || ''}
                    placeholder="e.g. Photonx Technologies, Google, Freelance"
                    onChange={e => handleChange('company', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-10 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                  {formData.company && (
                    <button
                      type="button"
                      onClick={() => handleChange('company', '')}
                      className="absolute right-3 text-gray-500 hover:text-rose-400 p-1"
                      title="Clear company"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Professional Bio */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                    Professional Bio
                  </label>
                  {formData.bio && (
                    <button
                      type="button"
                      onClick={() => handleChange('bio', '')}
                      className="text-[11px] text-gray-500 hover:text-rose-400 font-mono transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Clear Bio
                    </button>
                  )}
                </div>
                <div className="relative">
                  <textarea 
                    rows={4}
                    value={formData.bio || ''}
                    onChange={e => handleChange('bio', e.target.value)}
                    placeholder="Write a powerful summary of your career expertise..."
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl p-4 text-white text-sm outline-none resize-none transition-all shadow-inner font-sans leading-relaxed"
                  />
                </div>
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
                    value={formData.email || ''}
                    onChange={e => handleChange('email', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Secondary Email */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                    Secondary Email
                  </label>
                  {formData.secondaryEmail && (
                    <button
                      type="button"
                      onClick={() => handleChange('secondaryEmail', '')}
                      className="text-[11px] text-gray-500 hover:text-rose-400 font-mono transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input 
                    type="email" 
                    value={formData.secondaryEmail || ''}
                    onChange={e => handleChange('secondaryEmail', e.target.value)}
                    placeholder="Optional secondary email address"
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-10 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                  {formData.secondaryEmail && (
                    <button
                      type="button"
                      onClick={() => handleChange('secondaryEmail', '')}
                      className="absolute right-3 text-gray-500 hover:text-rose-400 p-1"
                      title="Clear secondary email"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Primary Phone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                    Primary Phone
                  </label>
                  {formData.phone && (
                    <button
                      type="button"
                      onClick={() => handleChange('phone', '')}
                      className="text-[11px] text-gray-500 hover:text-rose-400 font-mono transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Phone className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input 
                    type="text" 
                    value={formData.phone || ''}
                    placeholder="e.g. +1 (555) 000-0000"
                    onChange={e => handleChange('phone', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-10 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                  {formData.phone && (
                    <button
                      type="button"
                      onClick={() => handleChange('phone', '')}
                      className="absolute right-3 text-gray-500 hover:text-rose-400 p-1"
                      title="Clear phone"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Secondary Phone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                    Secondary Phone
                  </label>
                  {formData.secondaryPhone && (
                    <button
                      type="button"
                      onClick={() => handleChange('secondaryPhone', '')}
                      className="text-[11px] text-gray-500 hover:text-rose-400 font-mono transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Phone className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input 
                    type="text" 
                    value={formData.secondaryPhone || ''}
                    onChange={e => handleChange('secondaryPhone', e.target.value)}
                    placeholder="Optional secondary phone coordinates"
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-10 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                  {formData.secondaryPhone && (
                    <button
                      type="button"
                      onClick={() => handleChange('secondaryPhone', '')}
                      className="absolute right-3 text-gray-500 hover:text-rose-400 p-1"
                      title="Clear secondary phone"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Geography Location / Workspace Base */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                    Geography Location / Workspace Base
                  </label>
                  {formData.location && (
                    <button
                      type="button"
                      onClick={() => handleChange('location', '')}
                      className="text-[11px] text-gray-500 hover:text-rose-400 font-mono transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input 
                    type="text" 
                    value={formData.location || ''}
                    placeholder="e.g. San Francisco, CA / Remote"
                    onChange={e => handleChange('location', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-11 pr-10 py-2.5 text-white text-sm outline-none transition-all shadow-inner"
                  />
                  {formData.location && (
                    <button
                      type="button"
                      onClick={() => handleChange('location', '')}
                      className="absolute right-3 text-gray-500 hover:text-rose-400 p-1"
                      title="Clear location"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
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
                      placeholder="e.g. alex-smith or username"
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
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-medium text-gray-400 tracking-wider uppercase">
                      Public Profile Status
                    </label>
                    {formData.publicProfile === false ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                        <Lock className="w-3 h-3" />
                        Profile is Private
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                        <Globe className="w-3 h-3" />
                        Public Active
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() => handleChange('publicProfile', true)}
                      className={`flex-1 min-w-[180px] max-w-[280px] py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                        formData.publicProfile !== false 
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-500/40 font-bold shadow-md shadow-emerald-950/50' 
                          : 'bg-slate-950 text-gray-400 border-slate-800 hover:bg-slate-900 hover:text-gray-200'
                      }`}
                    >
                      <Globe className={`w-3.5 h-3.5 ${formData.publicProfile !== false ? 'text-emerald-400' : 'text-gray-500'}`} />
                      {formData.publicProfile !== false && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                      <span>Enable Public Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChange('publicProfile', false)}
                      className={`flex-1 min-w-[180px] max-w-[280px] py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                        formData.publicProfile === false 
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/50 ring-1 ring-rose-500/40 font-bold shadow-md shadow-rose-950/50' 
                          : 'bg-slate-950 text-gray-400 border-slate-800 hover:bg-slate-900 hover:text-gray-200'
                      }`}
                    >
                      <Lock className={`w-3.5 h-3.5 ${formData.publicProfile === false ? 'text-rose-400' : 'text-gray-500'}`} />
                      {formData.publicProfile === false && (
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                      )}
                      <span>Disable Public Profile</span>
                    </button>
                  </div>
                  {formData.publicProfile === false ? (
                    <p className="text-[11px] text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Profile is Private. Anyone visiting your link will see your name and "Profile is Private", with all other personal data hidden.</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-400/90 font-medium bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>Public Profile is Active. Anyone with your link can view your designated public portfolio.</span>
                    </p>
                  )}
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
                        title={formData.publicProfile === false ? "Preview private profile lock screen" : "Open public live link"}
                        className={`${
                          formData.publicProfile === false
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        } px-3 py-2 rounded-lg transition inline-flex items-center gap-1.5 text-xs font-bold active:scale-95 cursor-pointer`}
                      >
                        {formData.publicProfile === false ? (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>Preview (Private)</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            <span>Open Profile</span>
                          </>
                        )}
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
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/60">
            <div className="flex flex-wrap items-center gap-3">
              <button 
                type="submit" 
                className="bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] font-bold text-slate-950 px-6 py-3 rounded-xl cursor-pointer text-xs transition-all shadow-lg shadow-emerald-500/10"
              >
                Save Profile Changes
              </button>

              {!showClearConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 font-bold px-4 py-3 rounded-xl cursor-pointer text-xs transition-all shadow-md active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Profile Details</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-slate-950 p-1.5 border border-rose-800 rounded-xl animate-fade-in">
                  <span className="text-[11px] font-mono font-bold text-rose-400 pl-2">Delete profile data permanently?</span>
                  <button
                    type="button"
                    onClick={handleClearProfileDetails}
                    className="bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition shadow"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
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
