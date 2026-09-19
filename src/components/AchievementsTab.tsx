import React, { useState, useRef } from 'react';
import { Plus, Award, Trash2, Pencil, Calendar, Eye, Lock, Paperclip, FileText, Download, X } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementsTabProps {
  achievements: Achievement[];
  onAddAchievement: (achievement: Omit<Achievement, 'id'>) => void;
  onDeleteAchievement: (id: string) => void;
  onUpdateAchievement?: (achievement: Achievement) => void;
}

export default function AchievementsTab({
  achievements,
  onAddAchievement,
  onDeleteAchievement,
  onUpdateAchievement
}: AchievementsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Achievement | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [issuer, setIssuer] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartAdd = () => {
    setEditingItem(null);
    setTitle('');
    setDate('');
    setIssuer('');
    setDescription('');
    setFileName('');
    setFileUrl('');
    setIsPublic(true);
    setShowForm(true);
  };

  const handleStartEdit = (ach: Achievement) => {
    setEditingItem(ach);
    setTitle(ach.title || '');
    setDate(ach.date || '');
    setIssuer(ach.issuer || '');
    setDescription(ach.description || '');
    setFileName(ach.fileName || '');
    setFileUrl(ach.fileUrl || '');
    setIsPublic(ach.isPublic !== false);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileName(file.name);
        setFileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !issuer) return;

    const achievementData = {
      title,
      date: date || new Date().toISOString().split('T')[0],
      issuer,
      description,
      isPublic,
      fileName,
      fileUrl
    };

    if (editingItem && onUpdateAchievement) {
      onUpdateAchievement({
        ...editingItem,
        ...achievementData
      });
    } else {
      onAddAchievement(achievementData);
    }

    setTitle('');
    setDate('');
    setIssuer('');
    setDescription('');
    setFileName('');
    setFileUrl('');
    setIsPublic(true);
    setEditingItem(null);
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
          onClick={handleStartAdd}
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
                placeholder="Enter achievement title"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Awarding Organization *</label>
              <input 
                type="text" required
                value={issuer}
                onChange={e=>setIssuer(e.target.value)}
                placeholder="Enter awarding organization"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Achievement Date</label>
              <input 
                type="text"
                value={date}
                onChange={e=>setDate(e.target.value)}
                placeholder="Enter date"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Visibility</label>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
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
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
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

            {/* Achievement Document Upload Attachment */}
            <div className="space-y-1 md:col-span-2 pt-2 border-t border-slate-800/60">
              <label className="text-xs font-mono text-gray-400">Attach Document / Certificate (Optional)</label>
              <input 
                type="file"
                ref={fileInputRef}
                accept="application/pdf,image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition select-none ${
                  fileName ? 'border-emerald-500 bg-slate-950' : 'border-slate-800 hover:border-slate-700 bg-slate-950/45'
                }`}
              >
                {fileName ? (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-bold truncate max-w-[220px]">{fileName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileName('');
                        setFileUrl('');
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 ml-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-400">Attach Certificate / Award Proof Document</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 text-xs font-bold pt-2">
            <button 
              type="button" 
              onClick={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
              className="border border-slate-800 text-gray-400 px-4 py-2 rounded-xl hover:bg-slate-950 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-emerald-500 text-slate-950 px-5 py-2 rounded-xl cursor-pointer font-bold"
            >
              {editingItem ? 'Update Achievement' : 'Save Achievement'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map(ach => (
          <div key={ach.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative group hover:border-emerald-400/10 transition flex flex-col justify-between">
            {/* Card Action Buttons: Edit and Delete */}
            <div className="absolute top-5 right-5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition z-10">
              <button 
                onClick={() => handleStartEdit(ach)}
                className="p-1 rounded hover:bg-slate-950 text-gray-400 hover:text-emerald-400 cursor-pointer transition"
                title="Edit Award"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => onDeleteAchievement(ach.id)}
                className="p-1 rounded hover:bg-slate-950 text-gray-500 hover:text-rose-450 cursor-pointer transition"
                title="Delete Award"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl h-fit">
                <Award className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1 flex-1 pr-12">
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

            {/* Document attachment if present */}
            {ach.fileName && (
              <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-xl mt-3 flex items-center justify-between text-[11px] font-mono text-gray-300">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{ach.fileName}</span>
                </div>
                {ach.fileUrl && (
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={ach.fileUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline flex items-center gap-0.5 text-[10px]">
                      <Eye className="w-3 h-3" /> View
                    </a>
                    <a href={ach.fileUrl} download={ach.fileName} className="text-gray-300 hover:text-white flex items-center gap-0.5 text-[10px]">
                      <Download className="w-3 h-3" /> Save
                    </a>
                  </div>
                )}
              </div>
            )}

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

