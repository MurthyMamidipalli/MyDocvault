import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Star, 
  Trash2, 
  Award, 
  Briefcase, 
  GraduationCap, 
  LayoutGrid, 
  Cpu, 
  Pencil, 
  Check, 
  X,
  AlertTriangle 
} from 'lucide-react';
import { TimelineMilestone, Experience, Education, CurrentJob, isDemoId, isDemoTitle, isDemoItem } from '../types';

interface TimelineTabProps {
  milestones: TimelineMilestone[];
  onAddMilestone: (milestone: Omit<TimelineMilestone, 'id'>) => void;
  onUpdateMilestone?: (milestone: TimelineMilestone) => void;
  onDeleteMilestone: (id: string) => void;
  experience?: Experience[];
  education?: Education[];
  currentJob?: CurrentJob;
}

export default function TimelineTab({
  milestones,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  experience = [],
  education = [],
  currentJob
}: TimelineTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<TimelineMilestone | null>(null);
  const [deleteConfirmMilestoneId, setDeleteConfirmMilestoneId] = useState<string | null>(null);
  
  // New Milestone Form State
  const [date, setDate] = useState('2024-01');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TimelineMilestone['category']>('experience');
  const [description, setDescription] = useState('');
  const [intensity, setIntensity] = useState<TimelineMilestone['intensity']>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    onAddMilestone({ date, title, category, description, intensity });
    setTitle('');
    setDescription('');
    setShowForm(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone || !editingMilestone.title) return;
    if (onUpdateMilestone) {
      onUpdateMilestone(editingMilestone);
    }
    setEditingMilestone(null);
  };

  // Convert education items to timeline milestones (excluding demo items)
  const educationMilestones: TimelineMilestone[] = (education || []).filter(edu => !isDemoItem(edu)).map(edu => {
    const rawDate = edu.startYear || edu.startDate || (edu.endYear ? `${edu.endYear}-05` : new Date().toISOString().substring(0, 7));
    const normalizedDate = rawDate.length === 4 ? `${rawDate}-06` : rawDate;
    return {
      id: `auto-edu-${edu.id}`,
      date: normalizedDate,
      title: `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''} at ${edu.institution}`,
      category: 'education' as const,
      description: `${edu.degree} program at ${edu.institution}${edu.grade ? ` (Score/Grade: ${edu.grade})` : ''}.`,
      intensity: 'medium' as const,
      isAuto: true
    };
  });

  // Convert experience items to timeline milestones (excluding demo items)
  const experienceMilestones: TimelineMilestone[] = (experience || []).filter(exp => !isDemoItem(exp)).map(exp => ({
    id: `auto-exp-${exp.id}`,
    date: exp.startDate || new Date().toISOString().substring(0, 7),
    title: `${exp.role} at ${exp.company}`,
    category: 'experience' as const,
    description: exp.description && exp.description.length > 0
      ? exp.description.join(' ')
      : `${exp.role} role at ${exp.company}.`,
    intensity: exp.isCurrent ? 'high' as const : 'medium' as const,
    isAuto: true
  }));

  // Convert currentJob if employer or role is specified, not demo, and not already in experience
  const currentJobMilestones: TimelineMilestone[] = [];
  if (currentJob && (currentJob.employer || currentJob.company) && currentJob.role && !isDemoItem(currentJob)) {
    const emp = (currentJob.employer || currentJob.company).trim().toLowerCase();
    const rol = currentJob.role.trim().toLowerCase();
    const alreadyInExp = (experience || []).some(exp => 
      (exp.company || '').trim().toLowerCase() === emp && 
      (exp.role || '').trim().toLowerCase() === rol
    );
    if (!alreadyInExp) {
      const jobDate = currentJob.startDate ? currentJob.startDate.substring(0, 7) : (currentJob.joiningDate ? currentJob.joiningDate.substring(0, 7) : new Date().toISOString().substring(0, 7));
      currentJobMilestones.push({
        id: 'auto-current-job',
        date: jobDate,
        title: `${currentJob.role} at ${currentJob.employer || currentJob.company}`,
        category: 'experience' as const,
        description: currentJob.description || `Active role in ${currentJob.department || 'the organization'}.`,
        intensity: 'high' as const,
        isAuto: true
      });
    }
  }

  // Filter out any static milestones that match demo titles or demo IDs
  const cleanUserMilestones = (milestones || []).filter(m => {
    if (!m) return false;
    if (isDemoId(m.id) || isDemoTitle(m.title) || isDemoItem(m)) return false;
    const cleanTitle = (m.title || '').toLowerCase().trim();
    if (cleanTitle.includes('photonx')) return false;
    return true;
  });

  // Comprehensive deduplication ensuring Education, Experience, Current Job display ONLY ONE TIME
  const combinedRaw = [
    ...cleanUserMilestones,
    ...educationMilestones,
    ...experienceMilestones,
    ...currentJobMilestones
  ];

  // Helper to extract normalized semantic identity for timeline deduplication
  const getSemanticKeys = (m: TimelineMilestone): string[] => {
    const keys: string[] = [];
    const rawTitle = (m.title || '').toLowerCase()
      .replace(/\(active engagement\)/gi, '')
      .replace(/\(current job engagement\)/gi, '')
      .replace(/\(score\/grade:[^)]*\)/gi, '')
      .replace(/\(score:[^)]*\)/gi, '')
      .trim();

    const alphaTitle = rawTitle.replace(/[^a-z0-9]/g, '');
    const yearMatch = (m.date || '').match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : '';

    if (m.id) {
      keys.push(`id_${m.id}`);
    }

    // Role and Company extraction (e.g. "Software Engineer at Google" -> "google", "softwareengineer")
    if (rawTitle.includes(' at ')) {
      const parts = rawTitle.split(' at ');
      if (parts.length >= 2) {
        const roleOrDegree = parts[0].replace(/[^a-z0-9]/g, '');
        const companyOrInst = parts[1].replace(/[^a-z0-9]/g, '');
        if (roleOrDegree && companyOrInst) {
          keys.push(`pair_${roleOrDegree}_${companyOrInst}`);
          if (year) {
            keys.push(`pair_yr_${year}_${roleOrDegree}_${companyOrInst}`);
          }
          // Also company alone with year for single company milestone uniqueness
          keys.push(`comp_yr_${year}_${companyOrInst}`);
        }
      }
    }

    // Title + Year key
    if (alphaTitle) {
      if (year) {
        keys.push(`yr_title_${year}_${alphaTitle}`);
      }
      keys.push(`title_${alphaTitle}`);
    }

    return keys;
  };

  const seenSemanticKeys = new Set<string>();
  const uniqMilestones: TimelineMilestone[] = [];

  for (const m of combinedRaw) {
    if (!m) continue;
    const keys = getSemanticKeys(m);
    const isDuplicate = keys.some(k => seenSemanticKeys.has(k));

    if (!isDuplicate) {
      keys.forEach(k => seenSemanticKeys.add(k));
      uniqMilestones.push(m);
    } else {
      // If duplicate found and current item has richer user-defined data or real UUID, merge attributes
      const matchIdx = uniqMilestones.findIndex(existing => {
        const existingKeys = getSemanticKeys(existing);
        return keys.some(k => existingKeys.includes(k));
      });
      if (matchIdx >= 0) {
        const existing = uniqMilestones[matchIdx];
        // Prefer explicit Supabase UUID if available
        const hasRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id);
        uniqMilestones[matchIdx] = {
          ...existing,
          id: hasRealUuid ? m.id : existing.id,
          description: (m.description || '').length > (existing.description || '').length ? m.description : existing.description,
          intensity: m.intensity || existing.intensity,
          date: m.date && m.date.length >= existing.date.length ? m.date : existing.date
        };
      }
    }
  }

  // Sort chronological descending
  const sortedMilestones = [...uniqMilestones].sort((a, b) => b.date.localeCompare(a.date));

  const getIntensityColor = (intensity: TimelineMilestone['intensity']) => {
    if (intensity === 'high') return 'bg-emerald-400 border-emerald-400 shadow-[0_0_10px_#10b981]';
    if (intensity === 'medium') return 'bg-emerald-500/60 border-emerald-500/40';
    return 'bg-emerald-950 border-emerald-900';
  };

  const getMilestoneIcon = (cat: TimelineMilestone['category']) => {
    switch (cat) {
      case 'education': return <GraduationCap className="w-4 h-4 text-cyan-400" />;
      case 'experience': return <Briefcase className="w-4 h-4 text-emerald-400" />;
      case 'certification': return <Award className="w-4 h-4 text-amber-500" />;
      case 'achievement': return <Star className="w-4 h-4 text-pink-400" />;
      default: return <LayoutGrid className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="career-timeline-pane">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Chronological Career Milestones</h2>
          <p className="text-xs text-gray-400 mt-1">Audit historic landmark events, academic admissions, and structural corporate shifts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-500 hover:bg-emerald-400 font-bold text-slate-950 px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0 active:scale-95 shadow-md shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Publish Milestone Node</span>
        </button>
      </div>

      {/* Add Milestone Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 max-w-xl animate-fade-in shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold font-mono uppercase text-emerald-400 tracking-wider">New Milestone Coordinate</h3>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Month / Period Date</label>
              <input 
                type="text" required
                value={date}
                onChange={e => setDate(e.target.value)}
                placeholder="e.g. 2024-05"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Milestone Heading Title</label>
              <input 
                type="text" required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Joined Tech-Scale Inc as Lead Dev"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Milestone Sector</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
              >
                <option value="experience">Professional Experience</option>
                <option value="education">Academic Education</option>
                <option value="certification">Industry Certification</option>
                <option value="achievement">Special Recognition Award</option>
                <option value="project">Flagship Release Project</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Milestone Intensity Weight</label>
              <select
                value={intensity}
                onChange={e => setIntensity(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
              >
                <option value="high">High Strategic Shift</option>
                <option value="medium">Medium Standard Development</option>
                <option value="low">Low Support Metric</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-mono text-gray-400">Summary Context Narrative</label>
              <textarea 
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Key accomplishments, orchestration of pipelines..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 text-xs font-bold">
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="border border-slate-800 text-gray-400 px-4 py-2 rounded-xl hover:bg-slate-950 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-xl cursor-pointer font-bold active:scale-95 transition"
            >
              Confirm State Milestone
            </button>
          </div>
        </form>
      )}

      {/* Styled Chronological Milestone Timeline */}
      <div className="relative pl-6 md:pl-8 border-l border-slate-800 space-y-6 max-w-4xl py-2">
        {sortedMilestones.map(mil => (
          <div 
            key={mil.id} 
            className="relative p-4 md:p-5 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-slate-700/80 transition duration-200 shadow-lg"
          >
            {/* Timeline bullet nodes with pulse glow */}
            <div className={`absolute -left-[33px] md:-left-[41px] top-6 w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-slate-950 z-10 flex items-center justify-center ${getIntensityColor(mil.intensity)}`} />

            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/60 shrink-0 mt-0.5">
                {getMilestoneIcon(mil.category)}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400">
                    {mil.category}
                  </span>
                  {mil.isAuto && (
                    <span className="text-[8px] uppercase font-mono font-bold bg-[#0d2a1f] border border-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Cpu className="w-2.5 h-2.5 text-emerald-400" />
                      Syncing Active
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-400 md:hidden ml-auto">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    {mil.date}
                  </span>
                </div>
                <h4 className="text-white font-bold text-sm md:text-base leading-snug break-words">
                  {mil.title}
                </h4>
                {mil.description && (
                  <p className="text-gray-400 text-xs leading-relaxed max-w-2xl break-words">
                    {mil.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Bar: Date + Edit and Delete buttons clearly visible with clear space */}
            <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
              <span className="hidden md:inline-flex items-center gap-1 text-xs font-mono font-medium text-gray-400">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                {mil.date}
              </span>
              
              <div className="flex items-center gap-3">
                {/* Clearly Visible Edit Option */}
                <button
                  type="button"
                  onClick={() => setEditingMilestone({ ...mil })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/30 hover:border-sky-400/50 rounded-xl text-xs font-semibold cursor-pointer transition active:scale-95 shadow-sm"
                  title="Edit milestone"
                >
                  <Pencil className="w-3.5 h-3.5 shrink-0" />
                  <span>Edit</span>
                </button>

                {/* Clearly Visible Delete Option */}
                <button 
                  type="button"
                  onClick={() => setDeleteConfirmMilestoneId(mil.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-400/50 rounded-xl text-xs font-semibold cursor-pointer transition active:scale-95 shadow-sm"
                  title="Delete milestone"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Edit Milestone Modal */}
      {editingMilestone && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="edit-milestone-dialog">
          <form 
            onSubmit={handleEditSubmit} 
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-up"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Edit Milestone
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingMilestone(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-gray-400">Period / Date (YYYY-MM)</label>
                <input 
                  type="text" 
                  required
                  value={editingMilestone.date}
                  onChange={e => setEditingMilestone({ ...editingMilestone, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-sky-500 outline-none"
                  placeholder="e.g. 2024-05"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-gray-400">Heading Title</label>
                <input 
                  type="text" 
                  required
                  value={editingMilestone.title}
                  onChange={e => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-gray-400">Sector</label>
                  <select
                    value={editingMilestone.category}
                    onChange={e => setEditingMilestone({ ...editingMilestone, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-sky-500 outline-none"
                  >
                    <option value="experience">Professional Experience</option>
                    <option value="education">Academic Education</option>
                    <option value="certification">Industry Certification</option>
                    <option value="achievement">Special Recognition Award</option>
                    <option value="project">Flagship Release Project</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-gray-400">Intensity Weight</label>
                  <select
                    value={editingMilestone.intensity}
                    onChange={e => setEditingMilestone({ ...editingMilestone, intensity: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-sky-500 outline-none"
                  >
                    <option value="high">High Strategic Shift</option>
                    <option value="medium">Medium Standard Development</option>
                    <option value="low">Low Support Metric</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-gray-400">Summary Context Narrative</label>
                <textarea 
                  rows={3}
                  value={editingMilestone.description}
                  onChange={e => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-sky-500 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setEditingMilestone(null)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-gray-400 hover:text-white rounded-xl border border-slate-800 font-bold active:scale-95 transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl active:scale-95 transition cursor-pointer text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/10"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmMilestoneId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="delete-milestone-dialog">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Confirm Deletion
              </h3>
            </div>
            
            <p className="text-xs text-gray-400 leading-relaxed">
              Are you sure you want to delete this career milestone? The checkpoint will be permanently removed from Supabase and local storage.
            </p>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmMilestoneId(null)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-gray-400 hover:text-white text-xs font-bold rounded-xl border border-slate-800 transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMilestone(deleteConfirmMilestoneId);
                  setDeleteConfirmMilestoneId(null);
                }}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer"
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
