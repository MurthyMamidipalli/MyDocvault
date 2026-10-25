import React from 'react';
import { 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  Cpu, 
  Sparkles,
  Building,
  Award
} from 'lucide-react';
import { TimelineMilestone, Experience, Education, CurrentJob, isDemoItem } from '../types';

interface TimelineTabProps {
  experience?: Experience[];
  education?: Education[];
  currentJob?: CurrentJob;
  milestones?: TimelineMilestone[];
  onAddMilestone?: (milestone: Omit<TimelineMilestone, 'id'>) => void;
  onUpdateMilestone?: (milestone: TimelineMilestone) => void;
  onDeleteMilestone?: (id: string) => void;
}

interface SyncedTimelineItem {
  id: string;
  sourceType: 'education' | 'experience' | 'currentJob';
  categoryLabel: string;
  title: string;
  subtitle?: string;
  date: string;
  timestamp: number;
  periodLabel: string;
  description: string;
  intensity: 'high' | 'medium' | 'low';
  isCurrent?: boolean;
}

// Helper to normalize dates in DD-MM-YYYY, YYYY-MM-DD, YYYY, etc. into ISO date, clean display, and epoch timestamp
const normalizeTimelineDate = (dateStr?: string, isCurrent?: boolean): { isoDate: string; displayPeriod: string; timestamp: number } => {
  if (isCurrent) {
    return { isoDate: '9999-12-31', displayPeriod: 'Present', timestamp: Date.now() + 100000000000 };
  }
  if (!dateStr || !dateStr.trim()) {
    return { isoDate: '1970-01-01', displayPeriod: '', timestamp: 0 };
  }
  const str = dateStr.trim();

  // 1. Matches DD-MM-YYYY or DD/MM/YYYY (e.g., "02-07-2024" or "25/09/2026")
  const ddmmyyyy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (ddmmyyyy) {
    const day = String(parseInt(ddmmyyyy[1], 10)).padStart(2, '0');
    const month = String(parseInt(ddmmyyyy[2], 10)).padStart(2, '0');
    const year = ddmmyyyy[3];
    const isoDate = `${year}-${month}-${day}`;
    return {
      isoDate,
      displayPeriod: `${day}/${month}/${year}`,
      timestamp: new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)).getTime()
    };
  }

  // 2. Matches YYYY-MM-DD or YYYY-MM
  const yyyymmdd = str.match(/^(\d{4})[-/](\d{1,2})[-/]?(\d{1,2})?/);
  if (yyyymmdd) {
    const year = yyyymmdd[1];
    const month = String(parseInt(yyyymmdd[2], 10)).padStart(2, '0');
    const day = yyyymmdd[3] ? String(parseInt(yyyymmdd[3], 10)).padStart(2, '0') : '01';
    const isoDate = `${year}-${month}-${day}`;
    return {
      isoDate,
      displayPeriod: `${year}-${month}`,
      timestamp: new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)).getTime()
    };
  }

  // 3. Just a 4-digit year e.g. "2024"
  const singleYear = str.match(/^\d{4}$/);
  if (singleYear) {
    const year = singleYear[0];
    return {
      isoDate: `${year}-06-01`,
      displayPeriod: year,
      timestamp: new Date(parseInt(year, 10), 5, 1).getTime()
    };
  }

  // 4. Any 4-digit year found inside string
  const yearMatch = str.match(/\d{4}/);
  if (yearMatch) {
    const year = yearMatch[0];
    return {
      isoDate: `${year}-06-01`,
      displayPeriod: str,
      timestamp: new Date(parseInt(year, 10), 5, 1).getTime()
    };
  }

  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    return {
      isoDate: new Date(parsed).toISOString().substring(0, 10),
      displayPeriod: str,
      timestamp: parsed
    };
  }

  return { isoDate: '1970-01-01', displayPeriod: str, timestamp: 0 };
};

export default function TimelineTab({
  experience = [],
  education = [],
  currentJob
}: TimelineTabProps) {

  // 1. Current Job landmark coordinate (if employer/role specified and not demo)
  const currentJobLandmarks: SyncedTimelineItem[] = [];
  const activeCompany = (currentJob?.employer || currentJob?.company || '').trim();
  const activeRole = (currentJob?.role || '').trim();

  if (currentJob && activeCompany && activeRole && !isDemoItem(currentJob)) {
    const rawDate = currentJob.startDate || currentJob.joiningDate || new Date().toISOString().substring(0, 7);
    const norm = normalizeTimelineDate(rawDate, true);
    
    currentJobLandmarks.push({
      id: 'synced-current-job',
      sourceType: 'currentJob',
      categoryLabel: 'Current Position',
      title: `${activeRole} at ${activeCompany}`,
      subtitle: currentJob.department ? `Department: ${currentJob.department}` : undefined,
      date: norm.isoDate,
      timestamp: norm.timestamp,
      periodLabel: `${norm.displayPeriod || rawDate} – Present`,
      description: currentJob.description || `Active ${currentJob.employmentType || 'full-time'} engagement orchestrating core responsibilities in ${currentJob.department || 'the organization'}.`,
      intensity: 'high',
      isCurrent: true
    });
  }

  // 2. Experience landmarks (excluding demo items and currentJob duplicates)
  const experienceLandmarks: SyncedTimelineItem[] = (experience || [])
    .filter(exp => !isDemoItem(exp))
    .filter(exp => {
      // If matches active current job role and company, current job represents it
      if (activeCompany && activeRole) {
        const expComp = (exp.company || '').trim().toLowerCase();
        const expRole = (exp.role || '').trim().toLowerCase();
        if (expComp === activeCompany.toLowerCase() && expRole === activeRole.toLowerCase()) {
          return false;
        }
      }
      return true;
    })
    .map(exp => {
      const rawDate = exp.startDate || new Date().toISOString().substring(0, 7);
      const startNorm = normalizeTimelineDate(rawDate, Boolean(exp.isCurrent));
      const endNorm = exp.endDate ? normalizeTimelineDate(exp.endDate) : null;
      const endLabel = exp.isCurrent ? 'Present' : (endNorm?.displayPeriod || exp.endDate || 'Completed');
      const startLabel = startNorm.displayPeriod || rawDate;
      
      const narrative = Array.isArray(exp.description) && exp.description.length > 0
        ? exp.description.join(' ')
        : `${exp.role} position at ${exp.company}${exp.location ? ` in ${exp.location}` : ''}.`;

      return {
        id: `synced-exp-${exp.id}`,
        sourceType: 'experience',
        categoryLabel: exp.isCurrent ? 'Active Experience' : 'Professional Experience',
        title: `${exp.role} at ${exp.company}`,
        subtitle: exp.location ? `Location: ${exp.location}` : undefined,
        date: startNorm.isoDate,
        timestamp: exp.isCurrent ? (Date.now() + 5000000000) : startNorm.timestamp,
        periodLabel: `${startLabel} – ${endLabel}`,
        description: narrative,
        intensity: exp.isCurrent ? 'high' : 'medium',
        isCurrent: Boolean(exp.isCurrent)
      };
    });

  // 3. Education landmarks (excluding demo items)
  const educationLandmarks: SyncedTimelineItem[] = (education || [])
    .filter(edu => !isDemoItem(edu))
    .map(edu => {
      const rawDate = edu.startDate || (edu.startYear ? `${edu.startYear}-06-01` : (edu.endYear ? `${edu.endYear}-05-01` : new Date().toISOString().substring(0, 7)));
      const startNorm = normalizeTimelineDate(rawDate, Boolean(edu.isCurrentlyPursuing));
      const startPeriod = edu.startYear || (edu.startDate ? normalizeTimelineDate(edu.startDate).displayPeriod : startNorm.displayPeriod);
      const endPeriod = edu.isCurrentlyPursuing ? 'Present' : (edu.endYear || (edu.endDate ? normalizeTimelineDate(edu.endDate).displayPeriod : 'Completed'));

      const degreeTitle = `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''} at ${edu.institution}`;
      
      // Clean up narrative if stored as stringified JSON metadata
      let narrative = edu.description || `${degreeTitle} program at ${edu.institution}.`;
      if (narrative.startsWith('{')) {
        try {
          const parsed = JSON.parse(narrative);
          const parts: string[] = [];
          if (parsed.specialization) parts.push(`Specialization: ${parsed.specialization}`);
          if (parsed.activities) parts.push(`Activities: ${parsed.activities}`);
          if (parsed.enrollmentId) parts.push(`Enrollment ID: ${parsed.enrollmentId}`);
          narrative = parts.length > 0 ? parts.join(' • ') : `${edu.degree} program at ${edu.institution}.`;
        } catch (_) {
          narrative = `${edu.degree} program at ${edu.institution}.`;
        }
      }

      return {
        id: `synced-edu-${edu.id}`,
        sourceType: 'education',
        categoryLabel: 'Academic Education',
        title: degreeTitle,
        subtitle: edu.institution,
        date: startNorm.isoDate,
        timestamp: edu.isCurrentlyPursuing ? (Date.now() + 1000000000) : startNorm.timestamp,
        periodLabel: `${startPeriod} – ${endPeriod}`,
        description: narrative,
        intensity: 'medium',
        isCurrent: Boolean(edu.isCurrentlyPursuing)
      };
    });

  // Combine and deduplicate
  const allSyncedItems = [
    ...currentJobLandmarks,
    ...experienceLandmarks,
    ...educationLandmarks
  ];

  // Semantic deduplication ensuring Education, Experience, Current Job display ONLY ONE TIME
  const seenSemanticKeys = new Set<string>();
  const uniqTimelineItems: SyncedTimelineItem[] = [];

  for (const item of allSyncedItems) {
    const rawTitle = item.title.toLowerCase()
      .replace(/\(active engagement\)/gi, '')
      .replace(/\(current job engagement\)/gi, '')
      .replace(/\(score\/grade:[^)]*\)/gi, '')
      .replace(/\(score:[^)]*\)/gi, '')
      .trim();

    const alphaTitle = rawTitle.replace(/[^a-z0-9]/g, '');
    const year = (item.date || '').match(/\d{4}/)?.[0] || '';

    // Check if duplicate
    const key = `${item.sourceType}_${alphaTitle}`;
    const yearKey = `${item.sourceType}_${year}_${alphaTitle}`;

    if (!seenSemanticKeys.has(key) && !seenSemanticKeys.has(yearKey)) {
      seenSemanticKeys.add(key);
      if (year) seenSemanticKeys.add(yearKey);
      uniqTimelineItems.push(item);
    }
  }

  // Sort chronological descending (most recent date first)
  const sortedTimeline = [...uniqTimelineItems].sort((a, b) => {
    // 1. Active / Current landmarks come first
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;

    // 2. Sort by timestamp descending (newest first)
    if (b.timestamp !== a.timestamp) {
      return b.timestamp - a.timestamp;
    }

    // 3. If in same year/timestamp, show professional experience before education
    if (a.sourceType === 'experience' && b.sourceType === 'education') return -1;
    if (a.sourceType === 'education' && b.sourceType === 'experience') return 1;

    return b.date.localeCompare(a.date);
  });

  const getIntensityColor = (intensity: SyncedTimelineItem['intensity']) => {
    if (intensity === 'high') return 'bg-emerald-400 border-emerald-400 shadow-[0_0_12px_#10b981]';
    if (intensity === 'medium') return 'bg-cyan-400 border-cyan-400 shadow-[0_0_8px_#22d3ee]';
    return 'bg-emerald-950 border-emerald-900';
  };

  const getItemIcon = (sourceType: SyncedTimelineItem['sourceType']) => {
    switch (sourceType) {
      case 'education': return <GraduationCap className="w-4 h-4 text-cyan-400" />;
      case 'currentJob': return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'experience': return <Briefcase className="w-4 h-4 text-emerald-400" />;
      default: return <Briefcase className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="career-timeline-pane">
      {/* Header Banner - Read-only Chronological feed synced with Education, Experience & Current Job */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Chronological Career Milestones</h2>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Synced
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Chronological landmarks compiled directly and automatically from your Education, Experience, and Current Job records.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl shrink-0">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>Synced with Education, Experience & Current Job</span>
        </div>
      </div>

      {/* Styled Chronological Milestone Timeline */}
      {sortedTimeline.length === 0 ? (
        <div className="py-16 px-6 text-center bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-3">
          <div className="p-3 bg-slate-950 rounded-2xl w-fit mx-auto border border-slate-800 text-gray-500">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-white">No Career Landmarks Found</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
            Career Timeline automatically populates from your records. Add your background in the <strong>Education</strong>, <strong>Experience</strong>, or <strong>Current Job</strong> tabs to see your synchronized chronological timeline.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 md:pl-8 border-l border-slate-800 space-y-6 max-w-4xl py-2">
          {sortedTimeline.map(item => (
            <div 
              key={item.id} 
              className="relative p-4 md:p-5 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-slate-700/80 transition duration-200 shadow-lg"
            >
              {/* Timeline bullet node with glow */}
              <div className={`absolute -left-[33px] md:-left-[41px] top-6 w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-slate-950 z-10 flex items-center justify-center ${getIntensityColor(item.intensity)}`} />

              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/60 shrink-0 mt-0.5">
                  {getItemIcon(item.sourceType)}
                </div>
                
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400">
                      {item.categoryLabel}
                    </span>
                    
                    <span className="text-[9px] uppercase font-mono font-bold bg-[#0d2a1f] border border-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Cpu className="w-2.5 h-2.5 text-emerald-400" />
                      {item.sourceType === 'education' ? 'Synced with Education' : item.sourceType === 'currentJob' ? 'Active Engagement' : 'Synced with Experience'}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-400 md:hidden ml-auto">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      {item.periodLabel}
                    </span>
                  </div>

                  <h4 className="text-white font-bold text-sm md:text-base leading-snug break-words">
                    {item.title}
                  </h4>

                  {item.description && (
                    <p className="text-gray-400 text-xs leading-relaxed max-w-2xl break-words">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Date & Period Indicator (No add/edit/delete buttons) */}
              <div className="hidden md:flex flex-col items-end gap-1 shrink-0 text-right">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-gray-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/80">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  {item.periodLabel}
                </span>
                <span className="text-[9px] font-mono text-gray-500 tracking-wider uppercase">
                  {item.isCurrent ? 'Current Landmark' : 'Archived Milestone'}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
