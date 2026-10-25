import React, { useState } from 'react';
import { Plus, Target, Pencil, Trash2, X, Check } from 'lucide-react';
import { Specialization } from '../types';

interface SpecializationTabProps {
  specializations: Specialization[];
  onAddSpecialization: (name: string) => void;
  onUpdateSpecialization: (specialization: Specialization) => void;
  onDeleteSpecialization: (id: string) => void;
}

export default function SpecializationTab({
  specializations,
  onAddSpecialization,
  onUpdateSpecialization,
  onDeleteSpecialization
}: SpecializationTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [specializationName, setSpecializationName] = useState('');
  const [editName, setEditName] = useState('');

  const handleStartAdd = () => {
    setEditingId(null);
    setSpecializationName('');
    setShowForm(true);
  };

  const handleStartEdit = (item: Specialization) => {
    setEditingId(item.id);
    setEditName(item.name);
    setShowForm(false);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = specializationName.trim();
    if (!trimmed) return;
    onAddSpecialization(trimmed);
    setSpecializationName('');
    setShowForm(false);
  };

  const handleSaveEdit = (e: React.FormEvent, item: Specialization) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) return;
    onUpdateSpecialization({
      ...item,
      name: trimmed
    });
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="space-y-6 animate-fade-in" id="specialization-pane">
      {/* Header Area matching application styling */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800/60">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl shadow-lg relative overflow-hidden group shrink-0">
            <Target className="w-8 h-8 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-50" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Specialization
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Your core areas of specialization and domain focus.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleStartAdd}
          className="bg-[#10b981] hover:bg-[#059669] text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98] shrink-0 shadow-md shadow-emerald-500/10 border-none outline-none"
        >
          <Plus className="w-4 h-4" />
          <span>Add Specialization</span>
        </button>
      </div>

      {/* Add Specialization Form */}
      {showForm && (
        <form onSubmit={handleSaveAdd} className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl space-y-5 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold text-white">
              Add Specialization
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Enter your specialization name.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-400">Specialization Name *</label>
            <input 
              type="text" 
              required
              autoFocus
              value={specializationName}
              onChange={e => setSpecializationName(e.target.value)}
              placeholder="Enter specialization name"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none placeholder:text-gray-600"
            />
          </div>

          <div className="flex justify-end items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSpecializationName('');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl cursor-pointer transition border border-transparent text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl cursor-pointer transition text-xs shadow-md shadow-emerald-500/20 active:scale-95"
            >
              Save Specialization
            </button>
          </div>
        </form>
      )}

      {/* Specializations Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {specializations && specializations.length > 0 ? (
          specializations.map(item => {
            const isEditing = editingId === item.id;

            return (
              <div 
                key={item.id}
                className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3 hover:border-slate-700/80 transition-colors shadow-sm"
              >
                {isEditing ? (
                  <form onSubmit={(e) => handleSaveEdit(e, item)} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-gray-400">Specialization Name</label>
                      <input 
                        type="text" 
                        required
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Enter specialization name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="flex justify-end items-center gap-2.5 pt-1">
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditName('');
                        }}
                        className="border border-slate-800 hover:border-slate-700 bg-slate-950 text-gray-400 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Target className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white font-bold text-sm tracking-tight truncate">
                          {item.name}
                        </h4>
                        <span className="text-[10px] text-gray-500 font-mono">
                          Specialization
                        </span>
                      </div>
                    </div>

                    {/* Prominent Edit and Delete buttons clearly visible with comfortable spacing */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button 
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-emerald-950/60 border border-slate-700/80 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95"
                        title="Edit Specialization"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSpecialization(item.id);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-rose-950/60 border border-slate-700/80 hover:border-rose-500/50 text-rose-400 hover:text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95"
                        title="Delete Specialization"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-slate-900/30 border border-dashed border-slate-800/80 rounded-2xl">
            <Target className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-300">No specializations added yet</h3>
            <p className="text-xs text-gray-500 mt-1">Click "Add Specialization" above to enter your specialization name.</p>
          </div>
        )}
      </div>
    </div>
  );
}
