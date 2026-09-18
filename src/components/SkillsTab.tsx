import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, Star, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { Skill } from '../types';

interface SkillsTabProps {
  skills: Skill[];
  onAddSkill: (skill: Omit<Skill, 'id'>) => void;
  onUpdateSkill: (skill: Skill) => void;
  onDeleteSkill: (id: string) => void;
}

export default function SkillsTab({
  skills,
  onAddSkill,
  onUpdateSkill,
  onDeleteSkill
}: SkillsTabProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'public' | 'private'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [newSkill, setNewSkill] = useState<Omit<Skill, 'id'>>({
    name: '',
    visibility: 'public',
    yearsOfExp: 3,
    endorsements: 0
  });

  const [editForm, setEditForm] = useState<Skill | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.name) return;
    onAddSkill(newSkill);
    setNewSkill({ name: '', visibility: 'public', yearsOfExp: 3, endorsements: 0 });
    setShowAddForm(false);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    onUpdateSkill(editForm);
    setEditingId(null);
    setEditForm(null);
  };

  const handleStartEdit = (skill: Skill) => {
    setEditingId(skill.id);
    setEditForm({ ...skill });
  };

  const filteredSkills = activeFilter === 'all' 
    ? skills 
    : skills.filter(s => s.visibility === activeFilter);

  const getVisibilityBadgeStyle = (vis: 'public' | 'private') => {
    return vis === 'public'
      ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
      : 'text-rose-400 bg-rose-950/40 border-rose-800/40';
  };

  return (
    <div className="space-y-6 animate-fade-in" id="skills-pane">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">Skills</h2>
          <p className="text-xs text-gray-400 mt-1">Manage technical capabilities, showcasing portfolio validations with precise privacy controls</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Skill</span>
        </button>
      </div>

      {/* Add New Skill Form Area */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-mono text-gray-400">Skill / Tech Name</label>
            <input 
              type="text"
              required
              placeholder="e.g. Business Intelligence, Python, Financial Modeling"
              value={newSkill.name}
              onChange={e=>setNewSkill({...newSkill, name: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-400">Visibility Option</label>
            <select
              value={newSkill.visibility}
              onChange={e=>setNewSkill({...newSkill, visibility: e.target.value as 'public' | 'private'})}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
            >
              <option value="public">🌐 Public Showcase</option>
              <option value="private">🔒 Private Archive</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-400">Years Experience</label>
            <input 
              type="number"
              min="0"
              max="40"
              value={newSkill.yearsOfExp}
              onChange={e=>setNewSkill({...newSkill, yearsOfExp: parseInt(e.target.value) || 0})}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="md:col-span-4 flex justify-end gap-2 text-xs font-semibold">
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="border border-slate-800 text-gray-400 px-4 py-2 rounded-xl hover:bg-slate-950 transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-5 py-2 rounded-xl cursor-pointer"
            >
              Confirm Skill Addition
            </button>
          </div>
        </form>
      )}

      {/* Filter Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: 'all', label: 'All DNA' },
          { id: 'public', label: '🌐 Public Showcase' },
          { id: 'private', label: '🔒 Private Archive' }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeFilter === tab.id 
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold' 
                : 'bg-slate-900 border-slate-800 text-gray-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSkills.map(skill => {
          const isEditing = editingId === skill.id;

          return (
            <div key={skill.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              {isEditing && editForm ? (
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-mono text-gray-500">Skill Name</label>
                      <input 
                        type="text"
                        required
                        value={editForm.name}
                        onChange={e=>setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-500">Visibility Setting</label>
                      <select
                        value={editForm.visibility}
                        onChange={e=>setEditForm({...editForm, visibility: e.target.value as 'public' | 'private'})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white h-[26px]"
                      >
                        <option value="public">🌐 Public</option>
                        <option value="private">🔒 Private</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-500">Yrs Exp</label>
                      <input 
                        type="number"
                        value={editForm.yearsOfExp}
                        onChange={e=>setEditForm({...editForm, yearsOfExp: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button" 
                      onClick={() => setEditingId(null)}
                      className="border border-slate-800 text-gray-400 px-2 py-1 rounded text-[11px]"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-emerald-500 text-slate-950 px-2.5 py-1 rounded text-[11px] font-bold"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-tight">{skill.name}</h4>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase px-2 py-0.5 mt-1 border rounded-md font-medium ${getVisibilityBadgeStyle(skill.visibility)}`}>
                        {skill.visibility === 'public' ? (
                          <>
                            <Eye className="w-2.5 h-2.5" />
                            <span>Public Showcase</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-2.5 h-2.5" />
                            <span>Private Archive</span>
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleStartEdit(skill)}
                        className="p-1 hover:bg-slate-800 text-gray-500 hover:text-white rounded transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => onDeleteSkill(skill.id)}
                        className="p-1 hover:bg-slate-800 text-gray-500 hover:text-rose-400 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] font-mono text-gray-500 pt-2 border-t border-slate-800/50">
                    <div className="flex items-center gap-1">
                      <span>Exp:</span>
                      <strong className="text-gray-300 font-bold">{skill.yearsOfExp} years</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
