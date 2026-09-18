import React, { useState } from 'react';
import { Plus, GraduationCap, Calendar, Trophy, Trash2, X, Fingerprint, Pencil } from 'lucide-react';
import { Education } from '../types';

interface EducationTabProps {
  education: Education[];
  onAddEducation: (education: Omit<Education, 'id'>) => void;
  onDeleteEducation: (id: string) => void;
  onUpdateEducation: (education: Education) => void;
}

export default function EducationTab({ education, onAddEducation, onDeleteEducation, onUpdateEducation }: EducationTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Education | null>(null);
  const [formData, setFormData] = useState<Omit<Education, 'id'>>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startYear: '',
    endYear: '',
    grade: '',
    activities: '',
    percentage: '',
    enrollmentId: '',
    startDate: '',
    endDate: ''
  });

  const handleStartEdit = (edu: Education) => {
    setEditingItem(edu);
    setFormData({
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startYear: edu.startYear,
      endYear: edu.endYear,
      grade: edu.grade || '',
      activities: edu.activities || '',
      percentage: edu.percentage || '',
      enrollmentId: edu.enrollmentId || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || ''
    });
    setShowForm(true);
  };

  const handleStartAdd = () => {
    setEditingItem(null);
    setFormData({
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startYear: '',
      endYear: '',
      grade: '',
      activities: '',
      percentage: '',
      enrollmentId: '',
      startDate: '',
      endDate: ''
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.institution || !formData.degree) return;

    // Automatically map date selections back to standard startYear & endYear strings
    const sYear = formData.startDate ? formData.startDate.substring(0, 4) : '2010';
    const eYear = formData.endDate ? formData.endDate.substring(0, 4) : '2014';

    const finalData = {
      ...formData,
      startYear: sYear,
      endYear: eYear
    };

    if (editingItem) {
      onUpdateEducation({
        ...finalData,
        id: editingItem.id
      });
    } else {
      onAddEducation(finalData);
    }

    // Reset Form
    setFormData({
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startYear: '',
      endYear: '',
      grade: '',
      activities: '',
      percentage: '',
      enrollmentId: '',
      startDate: '',
      endDate: ''
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // YYYY-MM-DD -> DD-MM-YYYY
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const displayDuration = (edu: Education) => {
    if (edu.startDate && edu.endDate) {
      return `${formatDateDisplay(edu.startDate)} — ${formatDateDisplay(edu.endDate)}`;
    }
    return `${edu.startYear} — ${edu.endYear}`;
  };

  return (
    <div className="space-y-6 animate-fade-in" id="education-pane">
      {/* Redesigned Header Area matching user mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800/60">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl shadow-lg relative overflow-hidden group shrink-0">
            <GraduationCap className="w-8 h-8 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-50" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Education
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Your academic background and formal learning journey.
            </p>
          </div>
        </div>
        <button
          onClick={handleStartAdd}
          className="bg-[#10b981] hover:bg-[#059669] text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98] shrink-0 shadow-md shadow-emerald-500/10 border-none outline-none"
        >
          <Plus className="w-4 h-4" />
          <span>Add Record</span>
        </button>
      </div>

      {/* Styled Inline Academic Record Form in the Page Flow */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold text-white">
              {editingItem ? 'Edit Academic Record' : 'Academic Record'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Enter details of your educational institution.
            </p>
          </div>

          <div className="space-y-4">
            {/* Institution Field */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Institution / School Name *</label>
              <input 
                type="text" 
                required
                value={formData.institution}
                onChange={e => setFormData({ ...formData, institution: e.target.value })}
                placeholder="Enter school / institution name (e.g. Amity University)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Degree & Field of Study Grid Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Degree *</label>
                <input 
                  type="text" 
                  required
                  value={formData.degree}
                  onChange={e => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="Enter degree (e.g. B.Tech. or MBA)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Field of Study *</label>
                <input 
                  type="text" 
                  required
                  value={formData.fieldOfStudy}
                  onChange={e => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                  placeholder="Enter field of study (e.g. Business Analytics)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* ID / Enrollment Number */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">ID / Enrollment Number (Optional)</label>
              <div className="relative flex items-center">
                <Fingerprint className="absolute left-4 w-5 h-5 text-gray-500 pointer-events-none" />
                <input 
                  type="text"
                  value={formData.enrollmentId || ''}
                  onChange={e => setFormData({ ...formData, enrollmentId: e.target.value })}
                  placeholder="Enter student ID / enrollment number (e.g. STU-123456)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Start Date & End Date Grid Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Start Date</label>
                <input 
                  type="date"
                  required
                  value={formData.startDate || ''}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none text-gray-300 [color-scheme:dark]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">End Date</label>
                <input 
                  type="date"
                  required
                  value={formData.endDate || ''}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none text-gray-300 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Grade Field */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Grade / GPA (Optional)</label>
                <input 
                  type="text" 
                  value={formData.grade || ''}
                  onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="Enter grade / CGPA (e.g. 8.5 CGPA)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Percentage % (Optional)</label>
                <input 
                  type="text" 
                  value={formData.percentage || ''}
                  onChange={e => setFormData({ ...formData, percentage: e.target.value })}
                  placeholder="Enter percentage (e.g. 85%)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Activities & Societies Field */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Activities & Societies (Optional)</label>
              <textarea 
                value={formData.activities || ''}
                onChange={e => setFormData({ ...formData, activities: e.target.value })}
                placeholder="Enter activities, honors, or societies..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Action Buttons styled like Experience Tab */}
          <div className="flex justify-end gap-2 text-xs font-bold pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl cursor-pointer transition border border-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl cursor-pointer transition"
            >
              {editingItem ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      )}

      {/* Grid List of Records - Styled matching screenshot */}
      <div className="space-y-4">
        {education.map(edu => (
          <div key={edu.id} className="bg-slate-900/60 border border-slate-805/80 rounded-2xl p-5 md:p-6 relative group transition duration-205 hover:bg-slate-900/90">
            {/* Actions aligned beautifully */}
            <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition z-10">
              <button 
                onClick={() => handleStartEdit(edu)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-slate-950 cursor-pointer transition select-none"
                title="Edit ledger item"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDeleteEducation(edu.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-slate-950 cursor-pointer transition select-none"
                title="Delete ledger item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-[#10b981]/15 border border-[#10b981]/25 rounded-full text-[#10b981] shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1 min-w-0 pr-16">
                <div>
                  {/* Institution name is the main bold title */}
                  <h3 className="text-white font-bold text-lg leading-tight tracking-tight">{edu.institution}</h3>
                  {/* Degree/Study in premium green/emerald text */}
                  <p className="text-[#10b981] text-sm font-semibold mt-1">
                    {edu.degree}{edu.fieldOfStudy ? ` • ${edu.fieldOfStudy}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-mono text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{displayDuration(edu)}</span>
                  </span>
                  
                  {edu.enrollmentId && (
                    <span className="bg-slate-950/60 text-[11px] text-gray-400 px-2.5 py-0.5 rounded border border-slate-800 font-mono">
                      ID: {edu.enrollmentId}
                    </span>
                  )}

                  {edu.grade && (
                    <span className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-0.5 border border-slate-800 rounded text-gray-405">
                      <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                      Grade: {edu.grade}
                    </span>
                  )}

                  {edu.percentage && (
                    <span className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-0.5 border border-slate-800 rounded text-gray-405">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      Percentage: {edu.percentage.endsWith('%') ? edu.percentage : `${edu.percentage}%`}
                    </span>
                  )}
                </div>

                {edu.activities && (
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 max-w-2xl text-xs text-gray-400 leading-relaxed italic">
                    "{edu.activities}"
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
