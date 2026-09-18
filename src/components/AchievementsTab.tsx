import React, { useState } from 'react';
import { Plus, Award, Trash2, Calendar, Eye, Lock } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementsTabProps {
  achievements: Achievement[];
  onAddAchievement: (achievement: Omit<Achievement, 'id'>) => void;
  onDeleteAchievement: (id: string) => void;
}

export default function AchievementsTab({
  achievements,
  onAddAchievement,
  onDeleteAchievement
}: AchievementsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2024-01');
  const [issuer, setIssuer] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !issuer) return;

    onAddAchievement({ title, date, issuer, description, isPublic });
    setTitle('');
    setIssuer('');
    setDescription('');
    setIsPublic(true);
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="achievements-pane">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">Achievements & Key Recognitions</h2>
          <p className="text-xs text-gray-400 mt-1">Audit flagship awards, special innovations, hackathon trophies, and corporate highlights</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0 text-white"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Achievement</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Award / Achievement Title *</label>
              <input 
                type="text" required
                value={title}
                onChange={e=>setTitle(e.target.value)}
                placeholder="Enter achievement title (e.g. Business Analytics Hackathon Finalist)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Awarding Organization *</label>
              <input 
                type="text" required
                value={issuer}
                onChange={e=>setIssuer(e.target.value)}
                placeholder="Enter awarding organization (e.g. Amity University)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Achievement Date</label>
              <input 
                type="text"
                value={date}
                onChange={e=>setDate(e.target.value)}
                placeholder="Enter date (e.g. Oct 2024)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-mono text-gray-400">Visibility</label>
              <div className="flex gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    isPublic 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-950 text-gray-500 border-slate-850 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    !isPublic 
                      ? 'bg-red-500/10 text-rose-400 border-red-500/30' 
                      : 'bg-slate-950 text-gray-500 border-slate-850 hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private</span>
                </button>
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-mono text-gray-400">Detailed Description Narrative *</label>
              <textarea 
                rows={3} required
                value={description}
                onChange={e=>setDescription(e.target.value)}
                placeholder="Enter description of award or accomplishment..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none resize-none font-sans"
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
              className="bg-emerald-500 text-slate-950 px-5 py-2 rounded-xl cursor-pointer font-bold"
            >
              Save Achievement
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map(ach => (
          <div key={ach.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative group hover:border-emerald-400/10 transition flex flex-col justify-between">
            <button 
              onClick={() => onDeleteAchievement(ach.id)}
              className="absolute top-5 right-5 p-1 rounded hover:bg-slate-950 text-gray-500 hover:text-rose-450 cursor-pointer opacity-0 group-hover:opacity-100 transition"
              title="Delete Award"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <div className="flex gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl h-fit">
                <Award className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-bold text-sm tracking-tight leading-tight">{ach.title}</h4>
                  <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${
                    ach.isPublic !== false 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-red-500/10 text-rose-400 border-red-500/20'
                  }`}>
                    {ach.isPublic !== false ? 'Public' : 'Private'}
                  </span>
                </div>
                <p className="text-emerald-450 text-xs font-mono font-medium">{ach.issuer}</p>
                <p className="text-gray-400 text-xs mt-2 leading-relaxed">{ach.description}</p>
              </div>
            </div>

            <div className="border-t border-slate-850/80 pt-3 mt-4 flex justify-between items-center text-[10px] font-mono text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-700" />
                Date: {ach.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
