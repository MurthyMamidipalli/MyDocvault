import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Target, 
  FileText, 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Layout, 
  Calendar, 
  Laptop, 
  Building2, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Pencil,
  MapPin,
  Clock,
  Shield,
  Check
} from 'lucide-react';
import { CurrentJob } from '../types';

interface CurrentJobTabProps {
  currentJob: CurrentJob;
  onUpdateCurrentJob: (job: CurrentJob) => void;
}

export default function CurrentJobTab({ currentJob, onUpdateCurrentJob }: CurrentJobTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [employer, setEmployer] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [employmentType, setEmploymentType] = useState<'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance'>('full-time');
  const [contractCompany, setContractCompany] = useState(currentJob?.contractCompany || '');
  const [locationType, setLocationType] = useState<'on-site' | 'remote' | 'hybrid'>('on-site');

  // Sub-trackers state (Weekly Goals & Initiatives)
  const [dailyStandupText, setDailyStandupText] = useState(currentJob?.dailyStandupText || '');
  const [newGoal, setNewGoal] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalText, setEditingGoalText] = useState('');
  const [editingGoalDate, setEditingGoalDate] = useState('');
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  // Keep local standup text in sync when currentJob updates
  useEffect(() => {
    if (currentJob?.dailyStandupText !== undefined) {
      setDailyStandupText(currentJob.dailyStandupText);
    }
  }, [currentJob?.dailyStandupText]);

  useEffect(() => {
    if (currentJob?.contractCompany !== undefined) {
      setContractCompany(currentJob.contractCompany);
    }
  }, [currentJob?.contractCompany]);

  const handleOpenEdit = () => {
    setEmployer(currentJob?.employer || currentJob?.company || '');
    setRole(currentJob?.role || '');
    setDepartment(currentJob?.department || '');
    setStartDate(currentJob?.startDate || currentJob?.joiningDate || '');
    setEmploymentType(currentJob?.employmentType || 'full-time');
    setContractCompany(currentJob?.contractCompany || '');
    setLocationType(currentJob?.locationType || 'on-site');
    setShowModal(true);
  };

  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    const empName = employer.trim() || 'Current Employer';
    const roleTitle = role.trim() || 'Current Role';
    
    onUpdateCurrentJob({
      ...currentJob,
      role: roleTitle,
      employer: empName,
      company: empName,
      startDate: startDate.trim(),
      joiningDate: startDate.trim(),
      department: department.trim(),
      employmentType,
      contractCompany: employmentType === 'contract' ? contractCompany.trim() : '',
      locationType,
      weeklyGoals,
      currentProjects,
      dailyStandupText
    });
    
    setShowModal(false);
  };

  const handleDeleteJob = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteJob = () => {
    onUpdateCurrentJob({
      ...currentJob,
      employer: '',
      company: '',
      role: '',
      startDate: '',
      joiningDate: '',
      department: '',
      employmentType: undefined,
      contractCompany: '',
      locationType: undefined,
      weeklyGoals: [],
      currentProjects: [],
      dailyStandupText: ''
    });
    setShowDeleteConfirm(false);
  };

  const weeklyGoals = Array.isArray(currentJob?.weeklyGoals) ? currentJob.weeklyGoals : [];
  const currentProjects = Array.isArray(currentJob?.currentProjects) ? currentJob.currentProjects : [];

  // Goal handlers with full workspace sync
  const handleToggleGoal = (id: string) => {
    const nextGoals = weeklyGoals.map(g => {
      if (g.id === id) return { ...g, completed: !g.completed };
      return g;
    });
    onUpdateCurrentJob({ ...currentJob, weeklyGoals: nextGoals, currentProjects, dailyStandupText });
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    const finalDate = newGoalDate.trim() || new Date().toISOString().substring(0, 10);
    const nextGoals = [
      ...weeklyGoals,
      { 
        id: `goal-${Date.now()}`, 
        text: newGoal.trim(), 
        completed: false,
        date: finalDate,
        dueDate: finalDate
      }
    ];
    onUpdateCurrentJob({ ...currentJob, weeklyGoals: nextGoals, currentProjects, dailyStandupText });
    setNewGoal('');
    setNewGoalDate('');
  };

  const handleStartEditGoal = (g: { id: string; text: string; completed: boolean; date?: string; dueDate?: string }) => {
    setEditingGoalId(g.id);
    setEditingGoalText(g.text);
    setEditingGoalDate(g.date || g.dueDate || '');
  };

  const handleSaveEditGoal = (id: string) => {
    if (!editingGoalText.trim()) return;
    const nextGoals = weeklyGoals.map(g => {
      if (g.id === id) {
        return {
          ...g,
          text: editingGoalText.trim(),
          date: editingGoalDate.trim() || undefined,
          dueDate: editingGoalDate.trim() || undefined
        };
      }
      return g;
    });
    onUpdateCurrentJob({ ...currentJob, weeklyGoals: nextGoals, currentProjects, dailyStandupText });
    setEditingGoalId(null);
    setEditingGoalText('');
    setEditingGoalDate('');
  };

  const handleCancelEditGoal = () => {
    setEditingGoalId(null);
    setEditingGoalText('');
    setEditingGoalDate('');
  };

  const handleDeleteGoal = (id: string) => {
    const nextGoals = weeklyGoals.filter(g => g.id !== id);
    onUpdateCurrentJob({ ...currentJob, weeklyGoals: nextGoals, currentProjects, dailyStandupText });
    if (editingGoalId === id) {
      handleCancelEditGoal();
    }
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    const nextProjects = [
      ...currentProjects,
      { id: `proj-${Date.now()}`, name: newProjName.trim(), status: 'planning' as const, desc: newProjDesc.trim() }
    ];
    onUpdateCurrentJob({ ...currentJob, currentProjects: nextProjects, weeklyGoals, dailyStandupText });
    setNewProjName('');
    setNewProjDesc('');
  };

  const handleDeleteProject = (id: string) => {
    const nextProjects = currentProjects.filter(p => p.id !== id);
    onUpdateCurrentJob({ ...currentJob, currentProjects: nextProjects, weeklyGoals, dailyStandupText });
  };

  const handleSaveStandup = () => {
    onUpdateCurrentJob({ ...currentJob, dailyStandupText, weeklyGoals, currentProjects });
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return 'Active';
    return dateStr;
  };

  const isConfigured = currentJob?.role || currentJob?.employer || currentJob?.company;

  return (
    <div className="space-y-6 animate-fade-in" id="current-job-pane">
      {/* Pristine Page Header matched to screenshot */}
      <div className="flex justify-between items-start md:items-center pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="text-3xl select-none leading-none">🏢</span>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Current Job</h2>
            <p className="text-xs text-gray-400">Manage your current professional standing and role details.</p>
          </div>
        </div>
        <button 
          onClick={handleOpenEdit}
          className="bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 border border-[#3b82f6]/30 text-white font-medium px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition select-none active:scale-[0.98] shadow-sm whitespace-nowrap"
        >
          <Pencil className="w-3.5 h-3.5 text-[#3b82f6]" />
          <span>Edit Job Role</span>
        </button>
      </div>

      {/* Main card representation */}
      {isConfigured ? (
        <div className="space-y-6">
          <div className="bg-[#101014] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl relative max-w-4xl">
            {/* Header solid cover banner region */}
            <div className="h-28 bg-gradient-to-r from-[#181822] via-[#242533] to-[#181822] border-b border-slate-800/60 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.04),transparent_60%)]" />
            </div>

            {/* Overlapping Green Icon Region */}
            <div className="absolute top-14 left-8 p-3 bg-[#0d0d10] border border-slate-850 rounded-2xl h-16 w-16 flex items-center justify-center shadow-lg">
              <div className="w-full h-full bg-[#10b981]/10 rounded-xl flex items-center justify-center border border-[#10b981]/20 text-[#10b981]">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            {/* Content area elements */}
            <div className="pt-16 px-8 pb-8 flex flex-col gap-5">
              {/* Flexrow for Title, role, company and actions */}
              <div className="flex justify-between items-start flex-wrap md:flex-nowrap gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-white font-extrabold text-2xl tracking-tight leading-none">
                      {currentJob.role}
                    </h3>
                    
                    {/* Clearly visible Edit and Delete Action Buttons with generous spacing */}
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleOpenEdit}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-400 hover:text-sky-300 text-xs font-semibold cursor-pointer transition select-none active:scale-95 shadow-sm"
                        title="Edit tenure information"
                      >
                        <Pencil className="w-3.5 h-3.5 text-sky-400" />
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={handleDeleteJob}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer transition select-none active:scale-95 shadow-sm"
                        title="Clear tenure record"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-[#10b981] font-bold text-base tracking-wide">
                    {currentJob.employer}
                    {currentJob.employmentType === 'contract' && currentJob.contractCompany && (
                      <span className="text-xs font-normal text-amber-400 ml-2">
                        (Contracted via <strong className="font-semibold underline decoration-amber-500/40">{currentJob.contractCompany}</strong>)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Horizontal flex badges precisely styled to reference */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                {/* Date range badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/45 border border-slate-850 rounded-lg text-xs font-medium text-gray-400 select-none">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <span>{formatDisplayDate(currentJob.startDate)} — Present</span>
                </div>

                {/* Employment Type badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/45 border border-slate-850 rounded-lg text-xs font-semibold text-gray-450 uppercase select-none tracking-wider">
                  <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                  <span>{currentJob.employmentType || 'Full-Time'}</span>
                </div>

                {/* Contract Company badge (only visible if contract) */}
                {currentJob.employmentType === 'contract' && currentJob.contractCompany && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-semibold text-amber-400 select-none">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Contract: {currentJob.contractCompany}</span>
                  </div>
                )}

                {/* Location Type badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/45 border border-slate-850 rounded-lg text-xs font-semibold text-gray-450 uppercase select-none tracking-wider">
                  <Laptop className="w-3.5 h-3.5 text-gray-500" />
                  <span>{currentJob.locationType || 'On-Site'}</span>
                </div>

                {currentJob.department && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/40 border border-[#10b981]/10 rounded-lg text-xs font-mono text-[#10b981]/80 select-none">
                    <Shield className="w-3 h-3 text-[#10b981]/50" />
                    <span>{currentJob.department}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advanced workspace tracker collapsible toggle */}
          <div className="pt-2 max-w-4xl">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950/40 hover:bg-slate-900 border border-slate-855 text-gray-400 hover:text-white select-none transition cursor-pointer text-xs font-semibold rounded-xl"
            >
              <span>{showAdvanced ? 'Hide' : 'Show'} Workspace Board & Logs</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Goals and Initiatives Boards if expanded */}
          {showAdvanced && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl animate-slide-up">
              {/* Daily Sync Stand-up Draft */}
              <div className="lg:col-span-3 bg-[#111116] border border-slate-850/80 rounded-2xl p-6 space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-emerald-400" />
                    Daily Checkout Sync Standup Draft
                  </h3>
                  <button 
                    onClick={handleSaveStandup}
                    className="text-xs bg-emerald-950 border border-emerald-800 text-emerald-400 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-900 cursor-pointer select-none transition"
                  >
                    Sync Logs
                  </button>
                </div>
                <p className="text-gray-500 text-[11px] font-sans leading-relaxed">
                  Maintain an ongoing ledger of today's technical accomplishments to push or paste into Slack/Teams checkout standup threads instantly.
                </p>
                <textarea
                  rows={3}
                  value={dailyStandupText}
                  onChange={e => {
                    const text = e.target.value;
                    setDailyStandupText(text);
                    onUpdateCurrentJob({ ...currentJob, dailyStandupText: text, weeklyGoals, currentProjects });
                  }}
                  onBlur={() => {
                    onUpdateCurrentJob({ ...currentJob, dailyStandupText, weeklyGoals, currentProjects });
                  }}
                  className="w-full bg-[#09090b]/80 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 outline-none resize-none font-mono leading-relaxed"
                />
              </div>

              {/* Weekly Milestones */}
              <div className="lg:col-span-3 bg-[#111116] border border-slate-850/80 rounded-2xl p-6 space-y-4 shadow-md">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-850/80">
                    <h3 className="text-white font-bold text-sm flex items-center gap-2">
                      <Target className="w-4.5 h-4.5 text-amber-500" />
                      <span>Weekly Key Milestones & Daily Tasks</span>
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">
                      {weeklyGoals.filter(g => g.completed).length} / {weeklyGoals.length} completed
                    </span>
                  </div>

                  {/* Add Milestone Form with Date Option */}
                  <form onSubmit={handleAddGoal} className="bg-[#09090b]/80 border border-slate-800/80 p-3 rounded-xl space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text"
                        required
                        placeholder="Milestone or daily task description..."
                        value={newGoal}
                        onChange={e => setNewGoal(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-500 outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <input 
                            type="date"
                            value={newGoalDate}
                            onChange={e => setNewGoalDate(e.target.value)}
                            title="Target Completion Date"
                            className="bg-transparent text-xs text-amber-300 outline-none font-mono cursor-pointer"
                          />
                        </div>
                        <button 
                          type="submit" 
                          className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition select-none shadow-sm shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Milestone</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Milestones List */}
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {weeklyGoals.length === 0 ? (
                      <div className="py-6 text-center border border-dashed border-slate-850 rounded-xl bg-slate-950/20">
                        <Target className="w-6 h-6 text-gray-600 mx-auto mb-1.5" />
                        <p className="text-gray-500 text-xs font-sans">No weekly milestones or daily tasks added yet.</p>
                        <p className="text-gray-600 text-[10px] mt-0.5">Add task deliverables with target dates above.</p>
                      </div>
                    ) : (
                      weeklyGoals.map(g => {
                        const isEditing = editingGoalId === g.id;

                        if (isEditing) {
                          return (
                            <div key={g.id} className="bg-slate-950 p-3 rounded-xl border border-sky-500/50 space-y-2.5 shadow-md">
                              <input 
                                type="text"
                                value={editingGoalText}
                                onChange={e => setEditingGoalText(e.target.value)}
                                className="w-full bg-[#111116] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-sky-500 outline-none"
                                placeholder="Edit milestone text"
                                autoFocus
                              />
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1 bg-[#111116] border border-slate-700 rounded-lg px-2.5 py-1">
                                  <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <input 
                                    type="date"
                                    value={editingGoalDate}
                                    onChange={e => setEditingGoalDate(e.target.value)}
                                    className="bg-transparent text-xs text-amber-300 outline-none font-mono cursor-pointer"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    type="button"
                                    onClick={() => handleSaveEditGoal(g.id)}
                                    className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow active:scale-95"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Save</span>
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={handleCancelEditGoal}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs cursor-pointer transition active:scale-95"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Cancel</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={g.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[#09090b]/60 p-3 rounded-xl border border-slate-850 hover:border-slate-800 transition shadow-sm"
                          >
                            {/* Checkbox + Title + Date */}
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <button 
                                type="button"
                                onClick={() => handleToggleGoal(g.id)}
                                className="mt-0.5 text-left cursor-pointer shrink-0 transition"
                                title={g.completed ? "Mark active" : "Mark completed"}
                              >
                                {g.completed ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-500 hover:text-white shrink-0" />
                                )}
                              </button>
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className={`text-xs font-semibold leading-relaxed break-words ${g.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                  {g.text}
                                </p>
                                {g.date && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400 font-mono text-[10px] font-semibold">
                                    <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span>Target Date: {g.date}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Clearly visible Edit and Delete buttons */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-850/60 w-full sm:w-auto justify-end">
                              <button 
                                type="button"
                                onClick={() => handleStartEditGoal(g)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-400 hover:text-sky-300 text-xs font-semibold cursor-pointer transition select-none active:scale-95 shadow-sm"
                                title="Edit milestone text and date"
                              >
                                <Pencil className="w-3.5 h-3.5 text-sky-400" />
                                <span>Edit</span>
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteGoal(g.id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer transition select-none active:scale-95 shadow-sm"
                                title="Delete milestone"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Initiative Repository */}
              <div className="lg:col-span-2 bg-[#111116] border border-slate-850/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between shadow-md">
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Layout className="w-4.5 h-4.5 text-purple-400" />
                    Project Initiative Repository
                  </h3>

                  <form onSubmit={handleAddProject} className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input 
                        type="text"
                        required
                        placeholder="Initiative / Project Name"
                        value={newProjName}
                        onChange={e => setNewProjName(e.target.value)}
                        className="w-full bg-[#09090b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:border-purple-500 outline-none"
                      />
                      <input 
                        type="text"
                        placeholder="Summary description"
                        value={newProjDesc}
                        onChange={e => setNewProjDesc(e.target.value)}
                        className="w-full bg-[#09090b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-2 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-lg cursor-pointer flex justify-center items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Include Active Initiative</span>
                    </button>
                  </form>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {currentProjects.length === 0 ? (
                      <p className="text-gray-600 text-[11px] font-sans py-2 text-center select-none">No active initiatives listed.</p>
                    ) : (
                      currentProjects.map(p => (
                        <div key={p.id} className="text-xs bg-[#09090b]/40 p-2.5 border border-slate-850/50 rounded-xl relative group hover:border-slate-800 transition">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <strong className="text-white font-bold text-[13px]">{p.name}</strong>
                              <span className="text-[9px] uppercase font-mono bg-indigo-950/40 text-indigo-400 px-1.5 py-0.5 rounded ml-2 border border-indigo-900/40 capitalize">
                                {p.status}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDeleteProject(p.id)}
                              className="text-gray-550 hover:text-rose-450 cursor-pointer p-0.5 rounded transition hover:bg-slate-900"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {p.desc && <p className="text-[11px] text-gray-500 mt-1 max-w-full leading-relaxed">{p.desc}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Pristine empty state matching other empty templates */
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl max-w-3xl flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-full text-gray-500">
            <Building2 className="w-8 h-8 text-gray-600" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-white font-bold text-base">No Current Job Configured</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Maintain an active tenure placeholder to outline your present workplace role, badges, on-site/remote classification, and team.
            </p>
          </div>
          <button 
            onClick={handleOpenEdit}
            className="bg-[#10b981] hover:bg-[#059669] text-white font-bold py-2.5 px-6 rounded-xl text-xs select-none shadow-md shadow-[#10b981]/15 transition active:scale-95 cursor-pointer mt-2"
          >
            Configure Current Job Role
          </button>
        </div>
      )}

      {/* Floating Supreme Edit Modal overlay matching professional style */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0e11] border border-slate-800/90 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl relative max-h-[90vh]">
            {/* Modal Topbar */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-850">
              <div>
                <h3 className="text-white font-bold text-sm tracking-tight">Active Standing Configuration</h3>
                <p className="text-[10px] text-gray-500">Edit your current ongoing professional role and metadata.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer transition hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body form fields */}
            <form onSubmit={handleSaveJob} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Employer / Workplace name */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Employer / Company Name *</label>
                <input 
                  type="text" required
                  value={employer}
                  onChange={e => setEmployer(e.target.value)}
                  placeholder="Enter company name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Active position title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 block">Role / Title</label>
                <input 
                  type="text"
                  required
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Tester"
                  className="w-full bg-[#131215] border border-slate-800/80 rounded-xl px-3 py-3 text-white text-xs focus:border-[#10b981] outline-none transition duration-150"
                />
              </div>

              {/* Start Date & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 block">Date Started</label>
                  <input 
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-[#131215] border border-slate-800/80 rounded-xl px-3 py-3 text-white text-xs focus:border-[#10b981] outline-none transition duration-150 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 block">Focus Department / Team</label>
                  <input 
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="e.g. Testing"
                    className="w-full bg-[#131215] border border-slate-800/80 rounded-xl px-3 py-3 text-white text-xs focus:border-[#10b981] outline-none transition duration-150"
                  />
                </div>
              </div>

              {/* Classification Badges: Location Type & Employment Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 block">Employment Classification</label>
                  <select
                    value={employmentType}
                    onChange={e => setEmploymentType(e.target.value as any)}
                    className="w-full bg-[#131215] border border-slate-800/80 rounded-xl px-3 py-3 text-white text-xs focus:border-[#10b981] outline-none cursor-pointer"
                  >
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 block">Workplace Location Type</label>
                  <select
                    value={locationType}
                    onChange={e => setLocationType(e.target.value as any)}
                    className="w-full bg-[#131215] border border-slate-800/80 rounded-xl px-3 py-3 text-white text-xs focus:border-[#10b981] outline-none cursor-pointer"
                  >
                    <option value="on-site">On-Site</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              {/* Conditionally display Contract Company Name ONLY if Contract is selected */}
              {employmentType === 'contract' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[11px] font-bold text-amber-400 block flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Contract Company Name *</span>
                  </label>
                  <input 
                    type="text"
                    required={employmentType === 'contract'}
                    value={contractCompany}
                    onChange={e => setContractCompany(e.target.value)}
                    placeholder="Enter contracting company name (e.g. Apex Systems, Infosys)"
                    className="w-full bg-[#131215] border border-amber-500/50 rounded-xl px-3 py-3 text-white text-xs focus:border-amber-400 outline-none transition duration-150"
                  />
                  <p className="text-[10px] text-gray-500">Provide the client or vendor company name for your contract role.</p>
                </div>
              )}

              {/* Submit trigger button */}
              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-xs font-semibold border border-slate-800 text-gray-400 hover:text-white rounded-xl hover:bg-slate-950 transition cursor-pointer select-none text-center active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg transition cursor-pointer select-none text-center active:scale-95"
                >
                  Save Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Floating Custom Confirmation Modal overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0e11] border border-slate-800/90 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl relative p-6 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto text-rose-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-bold text-base font-sans">Clear Current Job Details?</h3>
                <p className="text-xs text-gray-450 leading-relaxed font-sans max-w-sm mx-auto">
                  Are you absolutely sure you want to clear your current job role details? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-grow py-3 text-xs font-semibold border border-slate-800 text-gray-400 hover:text-white rounded-xl hover:bg-slate-950 transition cursor-pointer select-none text-center active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteJob}
                className="flex-grow py-3 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg transition cursor-pointer select-none text-center active:scale-95 animate-pulse-subtle"
              >
                Clear Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
