import React, { useState } from 'react';
import { Plus, Calendar, Star, Trash2, Award, Briefcase, GraduationCap, LayoutGrid, Cpu } from 'lucide-react';
import { TimelineMilestone, Experience, CurrentJob } from '../types';

interface TimelineTabProps {
  milestones: TimelineMilestone[];
  onAddMilestone: (milestone: Omit<TimelineMilestone, 'id'>) => void;
  onDeleteMilestone: (id: string) => void;
  experience?: Experience[];
  currentJob?: CurrentJob;
}

export default function TimelineTab({
  milestones,
  onAddMilestone,
  onDeleteMilestone,
  experience = [],
  currentJob
}: TimelineTabProps) {
  const [showForm, setShowForm] = useState(false);
  
  // Form State
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

  // Convert experience items to timeline milestones
  const experienceMilestones = experience.map(exp => ({
    id: `auto-exp-${exp.id}`,
    date: exp.startDate,
    title: `${exp.role} at ${exp.company}`,
    category: 'experience' as const,
    description: exp.description && exp.description.length > 0
      ? exp.description.join(' ')
      : `${exp.role} role at ${exp.company}.`,
    intensity: exp.isCurrent ? 'high' as const : 'medium' as const,
    isAuto: true
  }));

  // Convert currentJob if employer or role is specified
  const currentJobMilestones = [];
  if (currentJob && currentJob.employer && currentJob.role) {
    const jobDate = currentJob.startDate ? currentJob.startDate.substring(0, 7) : new Date().toISOString().substring(0, 7);
    currentJobMilestones.push({
      id: 'auto-current-job',
      date: jobDate,
      title: `${currentJob.role} (Current Job Engagement) at ${currentJob.employer}`,
      category: 'experience' as const,
      description: currentJob.dailyStandupText || `Active role in ${currentJob.department || 'the firm'}.`,
      intensity: 'high' as const,
      isAuto: true
    });
  }

  // Combine static milestones with auto-generated career coordinates
  const combined = [
    ...milestones.map(m => ({ ...m, isAuto: false })),
    ...experienceMilestones,
    ...currentJobMilestones
  ];

  // Distinct list by YYYY-MM date + title to prevent duplicates
  const seenKeys = new Set<string>();
  const uniqMilestones = combined.filter(m => {
    const key = `${m.date}-${m.title}`.toLowerCase().trim();
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  // Sort chronological descending
  const sortedMilestones = [...uniqMilestones].sort((a,b) => b.date.localeCompare(a.date));

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
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">Chronological Career Milestones</h2>
          <p className="text-xs text-gray-400 mt-1">Audit historic landmark events, academic admissions, and structural corporate shifts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Milestone Node</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Month / Period Date</label>
              <input 
                type="text" required
                value={date}
                onChange={e=>setDate(e.target.value)}
                placeholder="e.g. 2024-05"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Milestone Heading Title</label>
              <input 
                type="text" required
                value={title}
                onChange={e=>setTitle(e.target.value)}
                placeholder="Joined Tech-Scale Inc as Lead Dev"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Milestone Sector</label>
              <select
                value={category}
                onChange={e=>setCategory(e.target.value as any)}
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
                onChange={e=>setIntensity(e.target.value as any)}
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
                onChange={e=>setDescription(e.target.value)}
                placeholder="Relocated to Bengaluru, orchestrated development pipelines..."
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
              className="bg-emerald-500 text-slate-950 px-5 py-2 rounded-xl cursor-pointer"
            >
              Confirm State Milestone
            </button>
          </div>
        </form>
      )}

      {/* Styled Chronological Milestone Timeline */}
      <div className="relative pl-8 border-l border-slate-800 space-y-8 max-w-4xl py-2">
        {sortedMilestones.map(mil => (
          <div key={mil.id} className="relative group p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-emerald-500/10 transition duration-200">
            
            {/* Timeline bullet nodes with pulse glows */}
            <div className={`absolute -left-[41px] top-6 w-5 h-5 rounded-full border-2 border-slate-950 z-10 flex items-center justify-center ${getIntensityColor(mil.intensity)}`} />

            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/60 shrink-0 mt-0.5">
                {getMilestoneIcon(mil.category)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400">{mil.category}</span>
                  {mil.isAuto && (
                    <span className="text-[8px] uppercase font-mono font-bold bg-[#0d2a1f] border border-emerald-900/60 text-emerald-305 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Cpu className="w-2.5 h-2.5 text-emerald-400" />
                      Syncing Active
                    </span>
                  )}
                </div>
                <h4 className="text-white font-bold text-sm leading-snug">{mil.title}</h4>
                <p className="text-gray-450 text-xs leading-relaxed max-w-2xl">{mil.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 md:text-right">
              <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-gray-400">
                <Calendar className="w-3.5 h-3.5 text-gray-650" />
                {mil.date}
              </span>
              
              {!mil.isAuto ? (
                <button 
                  onClick={() => onDeleteMilestone(mil.id)}
                  className="p-1 rounded text-gray-600 hover:text-rose-400 hover:bg-slate-955 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  title="Wipe milestone snapshot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-[9px] font-mono text-gray-500 italic">Connected Sync</span>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
