import React, { useState } from 'react';
import { Plus, Users, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { Testimonial } from '../types';

interface TestimonialsTabProps {
  testimonials: Testimonial[];
  onAddTestimonial: (rec: Omit<Testimonial, 'id'>) => void;
  onDeleteTestimonial: (id: string) => void;
}

export default function TestimonialsTab({
  testimonials,
  onAddTestimonial,
  onDeleteTestimonial
}: TestimonialsTabProps) {
  const [showForm, setShowForm] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [relationship, setRelationship] = useState('');
  const [text, setText] = useState('');

  // Local AI polishing template state
  const [polishing, setPolishing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !text) return;

    onAddTestimonial({
      name,
      role,
      company,
      relationship,
      avatarColor: ['emerald', 'slate', 'indigo', 'sky', 'rose', 'pink'][Math.floor(Math.random() * 6)],
      text
    });

    setName('');
    setRole('');
    setCompany('');
    setRelationship('');
    setText('');
    setShowForm(false);
  };

  const handleAIMagicRephrase = () => {
    if (!text.trim()) return;
    setPolishing(true);
    setTimeout(() => {
      // Powerful rephraser simulator
      const prefixes = [
        "Highly technical, reliable, and thorough.",
        "Undeniable master of scalable engineering architecture.",
        "A rare combination of meticulous precision and speed."
      ];
      const rephrasedText = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${text.trim()} Murthy's contribution completely elevated our release metrics. He operates with outstanding engineering empathy and absolute technical clarity. Highly recommended.`;
      
      setText(rephrasedText);
      setPolishing(false);
    }, 1200);
  };

  const getAvatarColor = (color: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-950 text-emerald-400 border-emerald-800/40';
      case 'indigo': return 'bg-indigo-950 text-indigo-400 border-indigo-800/40';
      case 'sky': return 'bg-sky-950 text-sky-400 border-sky-800/40';
      case 'rose': return 'bg-rose-950 text-rose-400 border-rose-800/40';
      default: return 'bg-slate-950 text-gray-400 border-slate-800/40';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="testimonials-pane">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">Testimonials & Professional Reviews</h2>
          <p className="text-xs text-gray-400 mt-1">Review validation remarks, endorsements, and validated customer feedback quotes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Endorsement</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Endorser Name *</label>
              <input 
                type="text" required
                value={name}
                onChange={e=>setName(e.target.value)}
                placeholder="Enter endorser name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Professional Title / Role *</label>
              <input 
                type="text" required
                value={role}
                onChange={e=>setRole(e.target.value)}
                placeholder="Enter professional title / role"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Company / Organization *</label>
              <input 
                type="text" required
                value={company}
                onChange={e=>setCompany(e.target.value)}
                placeholder="Enter company name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Relationship *</label>
              <input 
                type="text" required
                value={relationship}
                onChange={e=>setRelationship(e.target.value)}
                placeholder="Enter relationship"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-gray-400">Endorsement Text</label>
                <button
                  type="button"
                  onClick={handleAIMagicRephrase}
                  disabled={polishing || !text.trim()}
                  className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 hover:bg-indigo-900 transition disabled:opacity-45 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>{polishing ? 'Grooming...' : 'AI Rephrase Magic'}</span>
                </button>
              </div>
              <textarea 
                rows={4} required
                value={text}
                onChange={e=>setText(e.target.value)}
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
              className="bg-emerald-500 text-slate-950 px-5 py-2 rounded-xl cursor-pointer"
            >
              Publish Testimonial
            </button>
          </div>
        </form>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {testimonials.map(rec => (
          <div key={rec.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative group flex flex-col justify-between">
            <button 
              onClick={() => {
                setDeleteId(rec.id);
                setDeleteName(rec.name);
              }}
              className="absolute top-4 right-4 p-1.5 bg-[#0e0e11]/90 hover:bg-rose-950 border border-slate-800 text-gray-400 hover:text-rose-400 rounded-lg cursor-pointer transition select-none opacity-100 md:opacity-0 md:group-hover:opacity-100"
              title="Delete endorsement"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <div className="space-y-4">
              {/* Quote bubble style */}
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed italic relative">
                "{rec.text}"
              </p>

              <div className="flex items-center gap-3 border-t border-slate-850/60 pt-4">
                <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-xs border ${getAvatarColor(rec.avatarColor)}`}>
                  {rec.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs">{rec.name}</h4>
                  <p className="text-gray-500 text-[10px]">{rec.role} • <strong className="text-gray-450 font-semibold">{rec.company}</strong></p>
                  {rec.relationship && (
                    <span className="text-[9px] font-mono font-medium text-emerald-400/90 tracking-wide block mt-0.5 uppercase">
                      {rec.relationship}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Confirmation Modal overlay for deletion */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0e11] border border-slate-800/90 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl p-6 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto text-rose-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-bold text-base font-sans">Delete Testimonial?</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans max-w-xs mx-auto">
                  Are you absolutely sure you want to delete <strong className="text-gray-200">"{deleteName}"</strong>'s testimonial? This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteId(null);
                  setDeleteName('');
                }}
                className="flex-grow py-2.5 text-xs font-semibold border border-slate-800 text-gray-400 hover:text-white rounded-xl hover:bg-slate-950 transition cursor-pointer select-none text-center active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTestimonial(deleteId);
                  setDeleteId(null);
                  setDeleteName('');
                }}
                className="flex-grow py-2.5 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg transition cursor-pointer select-none text-center active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
