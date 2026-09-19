import React, { useState } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Mail, 
  Phone, 
  MapPin, 
  Cpu, 
  Briefcase, 
  Award, 
  GraduationCap, 
  Rocket, 
  Link2, 
  Star, 
  MessageSquare,
  ChevronLeft,
  EyeOff,
  Calendar,
  Clock,
  FileText,
  Eye,
  Download,
  Folder,
  Package,
  File
} from 'lucide-react';
import { 
  PersonalProfile, 
  Skill, 
  Experience, 
  Certification, 
  Project,
  Education,
  Achievement,
  Testimonial,
  PortfolioLink,
  CalendarEvent,
  ResumeItem,
  VaultDocument
} from '../types';

interface PublicPortfolioViewProps {
  profile: PersonalProfile;
  skills: Skill[];
  experience: Experience[];
  certifications: Certification[];
  projects: Project[];
  education: Education[];
  achievements: Achievement[];
  testimonials: Testimonial[];
  links: PortfolioLink[];
  calendarEvents: CalendarEvent[];
  resumes?: ResumeItem[];
  documents?: VaultDocument[];
  onGoToConsole?: () => void;
}

export default function PublicPortfolioView({
  profile,
  skills,
  experience,
  certifications,
  projects,
  education,
  achievements,
  testimonials,
  links,
  calendarEvents,
  resumes = [],
  documents = [],
  onGoToConsole
}: PublicPortfolioViewProps) {
  const [themeColor] = useState<'emerald' | 'cyan' | 'purple'>(() => {
    return (localStorage.getItem('nexus_share_theme') as 'emerald' | 'cyan' | 'purple') || 'emerald';
  });

  const getThemeTextGlow = () => {
    if (themeColor === 'cyan') return 'text-cyan-400';
    if (themeColor === 'purple') return 'text-purple-400';
    return 'text-emerald-400';
  };

  const getThemeBg = () => {
    if (themeColor === 'cyan') return 'bg-cyan-500';
    if (themeColor === 'purple') return 'bg-purple-500';
    return 'bg-emerald-500';
  };

  const getThemeBorder = () => {
    if (themeColor === 'cyan') return 'border-cyan-500/20 hover:border-cyan-500/45';
    if (themeColor === 'purple') return 'border-purple-500/20 hover:border-purple-500/45';
    return 'border-emerald-500/20 hover:border-emerald-500/45';
  };

  const getThemeGlowRing = () => {
    if (themeColor === 'cyan') return 'ring-cyan-500/35';
    if (themeColor === 'purple') return 'ring-purple-500/35';
    return 'ring-emerald-500/35';
  };

  const getThemeHeadlineBg = () => {
    if (themeColor === 'cyan') return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    if (themeColor === 'purple') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-emerald-505/10 text-emerald-400 border-emerald-500/20';
  };

  if (profile.publicProfile === false) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col justify-center items-center font-sans select-none relative overflow-hidden" id="nexus-share-disabled">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] bg-red-500/10 pointer-events-none" />
        <div className="z-10 text-center space-y-6 max-w-sm px-6">
          <div className="relative inline-flex">
            <div className="relative rounded-full border border-red-500/30 p-4 bg-slate-950/80 shadow-2xl">
              <EyeOff className="w-8 h-8 text-red-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-white font-extrabold text-sm tracking-widest uppercase font-mono">Access Restricted</h2>
            <p className="text-sm text-gray-400 font-mono leading-relaxed bg-slate-950/60 p-3.5 border border-slate-900 rounded-xl">
              This profile is not publicly available.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => {
              window.history.pushState(null, '', window.location.origin + window.location.pathname);
              if (onGoToConsole) {
                onGoToConsole();
              } else {
                window.location.hash = '#overview';
              }
            }}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer select-none bg-slate-900 border border-slate-800 py-1.5 px-3.5 rounded-xl mx-auto active:scale-95"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Go to Console</span>
          </button>
        </div>
      </div>
    );
  }

  // Deduplicate helper function by ID or specific unique fallback key
  const deduplicateByUniqueKey = <T extends { id?: string }>(arr: T[], getFallbackKey: (item: T) => string): T[] => {
    if (!arr || !Array.isArray(arr)) return [];
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();
    const result: T[] = [];

    for (const item of arr) {
      if (!item) continue;
      const id = item.id ? String(item.id).trim() : '';
      const fallbackKey = getFallbackKey(item) ? getFallbackKey(item).toLowerCase().trim().replace(/\/+$/, '') : '';

      if (id && seenIds.has(id)) continue;
      if (fallbackKey && seenKeys.has(fallbackKey)) continue;

      if (id) seenIds.add(id);
      if (fallbackKey) seenKeys.add(fallbackKey);
      result.push(item);
    }
    return result;
  };

  const cleanSkills = deduplicateByUniqueKey(skills || [], sk => sk.name || '');
  const cleanExperience = deduplicateByUniqueKey(experience || [], exp => `${exp.role || ''}-${exp.company || ''}`);
  const cleanCerts = deduplicateByUniqueKey(certifications || [], c => c.title || '');
  const cleanProjects = deduplicateByUniqueKey(projects || [], proj => proj.name || '');
  const cleanEducation = deduplicateByUniqueKey(education || [], edu => `${edu.degree || ''}-${edu.institution || ''}`);
  const cleanAchievements = deduplicateByUniqueKey(achievements || [], ach => ach.title || '');
  const cleanTestimonials = deduplicateByUniqueKey(testimonials || [], rec => `${rec.name || ''}-${rec.company || ''}`);
  const cleanLinks = deduplicateByUniqueKey(links || [], lk => (lk.url || lk.label || ''));
  const cleanCalendarEvents = deduplicateByUniqueKey(calendarEvents || [], evt => `${evt.title || ''}-${evt.date || ''}`);
  const cleanResumes = deduplicateByUniqueKey(resumes || [], res => res.name || '');
  const cleanDocuments = deduplicateByUniqueKey(documents || [], doc => doc.name || doc.title || '');

  // Filter skills to show all public/unflagged ones
  const publicSkills = cleanSkills.filter(sk => sk.visibility !== 'private');
  // Filter certifications to public ones
  const publicCerts = cleanCerts.filter(c => c.visibility !== 'private');
  // Filter portfolio links to public ones
  const publicLinks = cleanLinks.filter(lk => lk.isPublic !== false);
  // Filter projects/products to public ones
  const publicProjects = cleanProjects.filter(proj => proj.isPublic !== false);
  // Filter calendar events to public ones
  const publicCalendarEvents = cleanCalendarEvents.filter(evt => evt.isPublic !== false);
  // Filter achievements to public ones
  const publicAchievements = cleanAchievements.filter(ach => ach.isPublic !== false);
  // Filter public resumes
  const publicResumes = cleanResumes.filter(res => res.visibility !== 'private');
  // Filter public documents
  const publicDocuments = cleanDocuments.filter(doc => doc.visibility === 'public');

  // Categorize Projects, Products, and Others
  const projectsList = publicProjects.filter(p => p.type === 'project' || (!p.type && p.type !== 'product' && p.type !== 'other'));
  const productsList = publicProjects.filter(p => p.type === 'product');
  const othersList = publicProjects.filter(p => p.type === 'other');

  return (
    <div className="min-h-screen bg-[#07080b] text-gray-305 flex flex-col font-sans selection:bg-emerald-500/20 antialiased" id="public-live-portfolio">
      
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none overflow-hidden opacity-30 select-none z-0">
        <div className={`absolute top-[-220px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[160px] ${
          themeColor === 'cyan' ? 'bg-cyan-505/25' : themeColor === 'purple' ? 'bg-purple-505/25' : 'bg-emerald-505/25'
        }`} />
      </div>

      {/* Header action panel to go back to customizer console */}
      <div className="border-b border-slate-900/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 select-none">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            type="button"
            onClick={() => {
              window.history.pushState(null, '', window.location.origin + window.location.pathname);
              if (onGoToConsole) {
                onGoToConsole();
              } else {
                window.location.hash = '#overview';
              }
            }}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer select-none bg-slate-900 border border-slate-800 py-1.5 px-3.5 rounded-xl active:scale-95"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>App Console</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${getThemeBg()}`} />
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">Live Portfolio Hub</span>
          </div>
        </div>
      </div>

      {/* Main Single Page Layout Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 space-y-12 z-10">
        
        {/* Banner Hero Card Block */}
        <div className="bg-[#0c0d12]/90 border border-slate-800 p-8 md:p-12 rounded-3xl relative overflow-hidden backdrop-blur-sm space-y-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 shadow-2xl">
          
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border uppercase ${getThemeHeadlineBg()}`}>
                Verified Professional
              </span>
              <span className="text-gray-500 font-mono text-[10px]">Updated recently</span>
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-none">
                {profile.name}
              </h1>
              <p className={`text-sm md:text-base font-medium font-sans max-w-xl text-gray-300`}>
                {profile.headline}
              </p>
            </div>

            {profile.bio && (
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed max-w-2xl font-normal font-sans italic">
                "{profile.bio}"
              </p>
            )}

            {/* Structured Quick Contact Details */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-[11px] text-gray-400 font-mono">
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 hover:text-white transition">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{profile.email}</span>
                </a>
              )}
              {profile.phone && (
                <a href={`tel:${profile.phone}`} className="flex items-center gap-1.5 hover:text-white transition">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{profile.phone}</span>
                </a>
              )}
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Initial Avatar Block */}
          <div className="relative shrink-0 flex items-center justify-center self-center md:self-auto">
            {profile.avatarUrl && !profile.avatarUrl.startsWith('[') && !profile.avatarUrl.includes('truncated') ? (
              <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${
                themeColor === 'cyan' ? 'border-cyan-400/20' : themeColor === 'purple' ? 'border-purple-400/20' : 'border-emerald-400/20'
              } ring-4 ${getThemeGlowRing()}`}>
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.name || "User"} 
                  className="w-full h-full object-cover bg-slate-950"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className={`w-24 h-24 rounded-full bg-slate-900 border-4 ${
                themeColor === 'cyan' ? 'border-cyan-400/20' : themeColor === 'purple' ? 'border-purple-400/20' : 'border-emerald-400/20'
              } flex items-center justify-center font-bold text-3xl text-white select-none ring-4 ${getThemeGlowRing()}`}>
                {profile.name ? (() => {
                  const parts = profile.name.trim().split(/\s+/).filter(Boolean);
                  if (parts.length >= 2) {
                    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                  }
                  return parts[0].slice(0, 2).toUpperCase();
                })() : "AM"}
              </div>
            )}
          </div>

        </div>

        {/* Dynamic Column Grid System for Resume Portions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column blocks (Capabilities / Certifications / Portfolio Registries / Resumes) */}
          <div className="space-y-8 lg:col-span-1">
            
            {/* Technical Capabilities Tab Section */}
            {publicSkills.length > 0 && (
              <div className="bg-[#0b0c10]/70 border border-slate-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-widest font-mono flex items-center gap-2">
                  <Cpu className={`w-4 h-4 ${getThemeTextGlow()}`} />
                  Skills
                </h3>
                <div className="space-y-3 pt-1">
                  {publicSkills.map(sk => (
                    <div key={sk.id} className="bg-slate-950/45 p-3 rounded-xl border border-slate-900 flex items-center justify-between text-xs hover:bg-slate-900/30 transition">
                      <span className="text-gray-200 font-semibold">{sk.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-mono">({sk.yearsOfExp} yrs)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Portfolio Registry Section */}
            {publicLinks.length > 0 && (
              <div className="bg-[#0b0c10]/70 border border-slate-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-widest font-mono flex items-center gap-2">
                  <Link2 className={`w-4 h-4 ${getThemeTextGlow()}`} />
                  Links & Portfolio
                </h3>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {publicLinks.map(lk => (
                    <a 
                      key={lk.id}
                      href={lk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-950/45 border border-slate-900 p-3 rounded-xl text-xs text-gray-300 hover:text-white flex items-center justify-between group transition hover:bg-slate-900/30 cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-[11px] text-gray-400 font-mono uppercase tracking-wide leading-none">{lk.platform}</span>
                        <span className="font-sans font-medium text-xs mt-1">{lk.label}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Public Resumes / CV Documents Section */}
            {publicResumes.length > 0 && (
              <div className="bg-[#0b0c10]/70 border border-slate-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-widest font-mono flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${getThemeTextGlow()}`} />
                  Resumes & Documents
                </h3>
                <div className="space-y-3 pt-1">
                  {publicResumes.map(res => (
                    <div key={res.id} className="bg-slate-950/45 p-3.5 rounded-xl border border-slate-900 space-y-2.5 hover:bg-slate-900/30 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {res.type || 'Resume'}
                        </span>
                        <span className="text-[9px] font-mono text-gray-500">{res.uploadDate || 'Verified'}</span>
                      </div>
                      <h4 className="text-white font-semibold text-xs leading-snug truncate" title={res.name}>{res.name}</h4>
                      
                      <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                        {(res.fileDataUrl || res.linkUrl) && (
                          <a
                            href={res.fileDataUrl || res.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </a>
                        )}
                        {res.fileDataUrl && (
                          <a
                            href={res.fileDataUrl}
                            download={res.fileName || `${res.name}.pdf`}
                            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-gray-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Public Vault Documents Section */}
            {publicDocuments.length > 0 && (
              <div className="bg-[#0b0c10]/70 border border-slate-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-widest font-mono flex items-center gap-2">
                  <Folder className={`w-4 h-4 ${getThemeTextGlow()}`} />
                  Public Documents & Files
                </h3>
                <div className="space-y-3 pt-1">
                  {publicDocuments.map(doc => (
                    <div key={doc.id} className="bg-slate-950/45 p-3.5 rounded-xl border border-slate-900 space-y-2.5 hover:bg-slate-900/30 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {doc.category || 'Document'}
                        </span>
                        <span className="text-[9px] font-mono text-gray-500">{doc.uploadDate || doc.size || 'Verified'}</span>
                      </div>
                      <h4 className="text-white font-semibold text-xs leading-snug truncate" title={doc.name}>{doc.name}</h4>
                      {doc.description && <p className="text-[11px] text-gray-400 line-clamp-2">{doc.description}</p>}
                      
                      <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                        {doc.fileUrl && (
                          <>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </a>
                            <a
                              href={doc.fileUrl}
                              download={doc.fileName || doc.name}
                              className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-gray-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications Block */}
            {publicCerts.length > 0 && (
              <div className="bg-[#0b0c10]/70 border border-slate-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-widest font-mono flex items-center gap-2">
                  <Award className={`w-4 h-4 ${getThemeTextGlow()}`} />
                  Certified Credentials
                </h3>
                <div className="space-y-3 pt-1">
                  {publicCerts.map(cert => (
                    <div key={cert.id} className="bg-slate-950/45 p-3.5 rounded-xl border border-slate-900 space-y-2 hover:bg-slate-900/30 transition">
                      <div className="space-y-0.5">
                        <h4 className="text-white font-semibold text-xs leading-snug">{cert.title}</h4>
                        <p className="text-[10px] text-gray-500 font-mono">{cert.issuer} • {cert.dateIssued}</p>
                      </div>
                      {cert.credentialUrl && (
                        <a 
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-400 hover:underline font-semibold font-mono flex items-center gap-1"
                        >
                          <span>Verify Authenticity</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Academic Credentials */}
            {cleanEducation.length > 0 && (
              <div className="bg-[#0b0c10]/70 border border-slate-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-widest font-mono flex items-center gap-2">
                  <GraduationCap className={`w-4 h-4 ${getThemeTextGlow()}`} />
                  Academics & Education
                </h3>
                <div className="space-y-3.5 pt-1">
                  {cleanEducation.map(edu => (
                    <div key={edu.id} className="relative pl-3 border-l-2 border-slate-850">
                      <div className="space-y-1">
                        <strong className="text-white text-xs block leading-tight">{edu.degree}</strong>
                        <span className="text-[10px] text-gray-500 font-mono block">{edu.fieldOfStudy}</span>
                        <span className="text-[11px] text-gray-400 font-sans font-medium block mt-1">{edu.institution}</span>
                        <div className="flex justify-between font-mono text-[9px] text-gray-500 pt-0.5 mt-1">
                          <span>{edu.startYear} – {edu.endYear}</span>
                          {edu.grade && <span className="text-emerald-400">Score: {edu.grade}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column blocks (Timeline and Tenures, Projects, Products, Others, Testimonials) */}
          <div className="space-y-8 lg:col-span-2">
            
            {/* Enterprise tenure timeline */}
            {cleanExperience.length > 0 && (
              <div className="bg-[#0b0c10]/70 border border-slate-850 p-6 md:p-8 rounded-2xl space-y-6">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-widest font-mono flex items-center gap-2">
                  <Briefcase className={`w-4 h-4 ${getThemeTextGlow()}`} />
                  Experience Timeline
                </h3>

                <div className="space-y-6 pl-4 border-l border-slate-800">
                  {cleanExperience.map(exp => (
                    <div key={exp.id} className="relative space-y-2">
                      {/* Connection node point */}
                      <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${getThemeBg()}`} />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <strong className="text-white text-sm font-semibold">{exp.role}</strong>
                        <span className="text-[10px] font-mono text-gray-500 font-semibold">{exp.startDate} – {exp.endDate}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-300 font-medium">{exp.company}</span>
                        {exp.location && (
                          <span className="text-gray-550 font-mono text-[10px]">({exp.location})</span>
                        )}
                      </div>

                      {exp.description && exp.description.length > 0 && (
                        <ul className="list-disc pl-4 space-y-1 pt-1.5 text-xs text-gray-400">
                          {exp.description.map((desc, idx) => (
                            <li key={idx} className="leading-relaxed font-sans">{desc}</li>
                          ))}
                        </ul>
                      )}

                      {exp.skillsUsed && exp.skillsUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {exp.skillsUsed.map((sk, idx) => (
                            <span key={idx} className="bg-slate-900 text-gray-400 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-850">
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {exp.links && exp.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2.5 mt-2 border-t border-slate-900/40">
                          {exp.links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono text-emerald-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span>🚀</span> <span>{link.label}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {exp.pdfUrl && (
                        <div className="flex flex-wrap items-center gap-2 pt-2.5 mt-2 border-t border-slate-900/40 font-mono text-[10px]">
                          <a
                            href={exp.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View PDF</span>
                          </a>
                          <a
                            href={exp.pdfUrl}
                            download={exp.pdfName || `${exp.role}.pdf`}
                            className="text-gray-300 hover:text-white font-bold flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects Category */}
            {projectsList.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-widest font-mono flex items-center gap-2 px-1">
                  <Folder className={`w-4 h-4 ${getThemeTextGlow()}`} />
                  Projects
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projectsList.map(proj => (
                    <div key={proj.id} className={`bg-[#0b0c10]/70 border ${getThemeBorder()} p-6 rounded-2xl space-y-4 relative overflow-hidden backdrop-blur-sm transition flex flex-col justify-between`}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="bg-slate-950 text-gray-500 font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border border-slate-905">
                            {proj.category || 'Project'}
                          </span>
                          {proj.date && (
                            <span className="text-[10px] font-mono text-gray-400">
                              {proj.date}{proj.toDate ? ` – ${proj.toDate}` : ''}
                            </span>
                          )}
                        </div>
                        <h4 className="text-white font-bold text-[13px] tracking-tight">{proj.name}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-sans">{proj.description}</p>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-slate-900/60">
                        {proj.techStack && proj.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {proj.techStack.map((tech, idx) => (
                              <span key={idx} className="bg-slate-950/60 text-gray-500 font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-900">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
                          {proj.pdfUrl && (
                            <>
                              <a 
                                href={proj.pdfUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View PDF</span>
                              </a>
                              <a 
                                href={proj.pdfUrl} 
                                download={proj.pdfName || `${proj.name}.pdf`} 
                                className="text-gray-300 hover:text-white font-bold flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </a>
                            </>
                          )}
                          {proj.liveUrl && (
                            <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:text-emerald-400 font-semibold flex items-center gap-1 transition">
                              <span>Live</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {proj.githubUrl && (
                            <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white flex items-center gap-1 transition">
                              <span>Code</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products Category */}
            {productsList.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-widest font-mono flex items-center gap-2 px-1">
                  <Package className={`w-4 h-4 ${getThemeTextGlow()}`} />
                  Products
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {productsList.map(proj => (
                    <div key={proj.id} className={`bg-[#0b0c10]/70 border ${getThemeBorder()} p-6 rounded-2xl space-y-4 relative overflow-hidden backdrop-blur-sm transition flex flex-col justify-between`}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="bg-slate-950 text-gray-500 font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border border-slate-905">
                            Product Release
                          </span>
                          {proj.date && <span className="text-[10px] font-mono text-gray-650">{proj.date}</span>}
                        </div>
                        <h4 className="text-white font-bold text-[13px] tracking-tight">{proj.name}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-sans">{proj.description}</p>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-slate-900/60">
                        {proj.techStack && proj.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {proj.techStack.map((tech, idx) => (
                              <span key={idx} className="bg-slate-950/60 text-gray-500 font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-900">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
                          {proj.pdfUrl && (
                            <>
                              <a 
                                href={proj.pdfUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View PDF</span>
                              </a>
                              <a 
                                href={proj.pdfUrl} 
                                download={proj.pdfName || `${proj.name}.pdf`} 
                                className="text-gray-300 hover:text-white font-bold flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </a>
                            </>
                          )}
                          {proj.liveUrl && (
                            <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:text-emerald-400 font-semibold flex items-center gap-1 transition">
                              <span>Live Product</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Others Category */}
            {othersList.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-widest font-mono flex items-center gap-2 px-1">
                  <FileText className={`w-4 h-4 ${getThemeTextGlow()}`} />
                  Others (Documents & Files)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {othersList.map(proj => (
                    <div key={proj.id} className={`bg-[#0b0c10]/70 border ${getThemeBorder()} p-6 rounded-2xl space-y-4 relative overflow-hidden backdrop-blur-sm transition flex flex-col justify-between`}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="bg-slate-950 text-emerald-400 font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border border-slate-905">
                            {proj.docType || 'Document'}
                          </span>
                          {proj.date && <span className="text-[10px] font-mono text-gray-650">{proj.date}</span>}
                        </div>
                        <h4 className="text-white font-bold text-[13px] tracking-tight">{proj.name}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-sans">{proj.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-900/60 font-mono text-[10px]">
                        {proj.pdfUrl && (
                          <>
                            <a 
                              href={proj.pdfUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View PDF</span>
                            </a>
                            <a 
                              href={proj.pdfUrl} 
                              download={proj.pdfName || `${proj.name}.pdf`} 
                              className="text-gray-300 hover:text-white font-bold flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded border border-slate-800"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </a>
                          </>
                        )}
                        {proj.liveUrl && (
                          <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:text-emerald-400 font-semibold flex items-center gap-1 transition">
                            <span>Open Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Testimonials Block */}
            {cleanTestimonials.length > 0 && (
              <div className="bg-[#0b0c10]/70 border border-slate-850 p-6 md:p-8 rounded-2xl space-y-6">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-widest font-mono flex items-center gap-2">
                  <MessageSquare className={`w-4 h-4 ${getThemeTextGlow()}`} />
                  Peer Endorsements
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {cleanTestimonials.map(rec => (
                    <div key={rec.id} className="bg-slate-950/30 p-5 rounded-xl border border-slate-900/60 flex flex-col justify-between gap-4">
                      <p className="text-xs text-gray-300 leading-relaxed italic">
                        "{rec.text}"
                      </p>
                      
                      <div className="flex items-center gap-3 border-t border-slate-900/40 pt-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white select-none ${rec.avatarColor || 'bg-slate-800'}`}>
                          {rec.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div>
                          <strong className="text-white font-semibold text-xs block leading-none">{rec.name}</strong>
                          <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                            {rec.role} at {rec.company} ({rec.relationship})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements and awards */}
            {publicAchievements.length > 0 && (
              <div className="bg-[#0b0c10]/70 border border-slate-850 p-6 md:p-8 rounded-2xl space-y-6">
                <h3 className="text-white font-extrabold text-xs uppercase tracking-widest font-mono flex items-center gap-2">
                  <Star className={`w-4 h-4 ${getThemeTextGlow()}`} />
                  Achievements & Awards
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {publicAchievements.map(ach => (
                    <div key={ach.id} className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/15 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase tracking-wider">
                          Award
                        </span>
                        <span className="text-[9px] font-mono text-gray-550">{ach.date}</span>
                      </div>
                      <h4 className="text-white font-bold text-xs">{ach.title}</h4>
                      <p className="text-[11px] text-gray-400 font-mono leading-relaxed">{ach.issuer}</p>
                      <p className="text-xs text-gray-400 font-sans leading-relaxed pt-1">{ach.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Public Availability & Schedule */}
            {publicCalendarEvents && publicCalendarEvents.length > 0 && (
              <div className="bg-[#0b0c10]/70 border border-slate-850 p-6 md:p-8 rounded-2xl space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-extrabold text-xs uppercase tracking-widest font-mono flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${getThemeTextGlow()}`} />
                    Public Schedule & Availability
                  </h3>
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    Live Updates
                  </span>
                </div>

                <div className="space-y-4">
                  {publicCalendarEvents.map(evt => (
                    <div key={evt.id} className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                          evt.type === 'interview' 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                            : evt.type === 'class' 
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/15'
                              : evt.type === 'work' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/15'
                        }`}>
                          {evt.type}
                        </span>
                        <span className="text-[10px] text-gray-550 font-mono font-medium">{evt.date}</span>
                      </div>

                      <h4 className="text-white font-bold text-xs leading-snug">{evt.title}</h4>
                      {evt.description && (
                        <p className="text-gray-400 text-xs font-sans leading-relaxed">{evt.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-400 font-mono pt-1">
                        {(evt.startTime || evt.endTime) && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            <span>{evt.startTime || '00:00'} - {evt.endTime || '23:59'}</span>
                          </div>
                        )}
                        {evt.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-500" />
                            <span>{evt.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </main>

      {/* Standalone signature footer */}
      <footer className="border-t border-slate-900/60 bg-[#06070a] py-8 text-center text-[10px] font-mono text-gray-500 mt-12 z-10 select-none">
        <p>This is a verified portfolio produced by and secure container credentials hosted on the live document vault.</p>
        <p className="mt-1 flex items-center justify-center gap-1 text-gray-600">
          <span>Powered by</span> 
          <span className="text-gray-400 font-bold">MyDocVault Platform</span> 
          <span>© 2026. All rights reserved.</span>
        </p>
      </footer>

    </div>
  );
}
