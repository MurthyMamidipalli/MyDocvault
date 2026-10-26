import React, { useState } from 'react';
import { Plus, Users, Trash2, ShieldCheck, Sparkles, Pencil } from 'lucide-react';
import { Testimonial } from '../types';

interface TestimonialsTabProps {
  testimonials: Testimonial[];
  onAddTestimonial: (rec: Omit<Testimonial, 'id'>) => void;
  onDeleteTestimonial: (id: string) => void;
  onUpdateTestimonial?: (rec: Testimonial) => void;
}

export default function TestimonialsTab({
  testimonials,
  onAddTestimonial,
  onDeleteTestimonial,
  onUpdateTestimonial
}: TestimonialsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [relationship, setRelationship] = useState('');
  const [text, setText] = useState('');

  // Local AI polishing template state
  const [polishing, setPolishing] = useState(false);

  const handleStartEdit = (rec: Testimonial) => {
    setEditingTestimonial(rec);
    setName(rec.name || '');
    setRole(rec.role || '');
    setCompany(rec.company || '');
    setRelationship(rec.relationship || '');
    setText(rec.text || '');
    setShowForm(true);
    document.getElementById('testimonials-pane')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setName('');
    setRole('');
    setCompany('');
    setRelationship('');
    setText('');
    setEditingTestimonial(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !text) return;

    if (editingTestimonial && onUpdateTestimonial) {
      onUpdateTestimonial({
        ...editingTestimonial,
        name,
        role,
        company,
        relationship,
        text
      });
    } else {
      onAddTestimonial({
        name,
        role,
        company,
        relationship,
        avatarColor: ['emerald', 'slate', 'indigo', 'sky', 'rose', 'pink'][Math.floor(Math.random() * 6)],
        text
      });
    }

    handleCancelForm();
  };

  const handleAIMagicRephrase = () => {
    if (!text.trim()) return;
    setPolishing(true);
    setTimeout(() => {
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
          onClick={() => {
            if (editingTestimonial) {
              handleCancelForm();
            } else {
              setShowForm(!showForm);
            }
          }}
          className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{editingTestimonial ? 'Cancel Edit' : 'Publish Endorsement'}</span>
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
              onClick={handleCancelForm}
              className="border border-slate-800 text-gray-400 px-4 py-2 rounded-xl hover:bg-slate-950 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-emerald-500 text-slate-950 px-5 py-2 rounded-xl cursor-pointer font-bold"
            >
              {editingTestimonial ? 'Update Testimonial' : 'Publish Testimonial'}
            </button>
          </div>
        </form>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {testimonials.map(rec => (
          <div key={rec.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-emerald-500/20 transition-all shadow-sm">
            
            {/* Header: User details & Action Buttons (Edit + Delete) */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-11 h-11 rounded-xl font-bold flex items-center justify-center text-xs border shrink-0 ${getAvatarColor(rec.avatarColor)}`}>
                  {rec.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-sm tracking-tight truncate">{rec.name}</h4>
                  <p className="text-gray-400 text-xs truncate">{rec.role} • <strong className="text-gray-300 font-semibold">{rec.company}</strong></p>
                  {rec.relationship && (
                    <span className="text-[10px] font-mono font-medium text-emerald-400/90 tracking-wide block mt-0.5 uppercase">
                      {rec.relationship}
                    </span>
                  )}
                </div>
              </div>

              {/* Clearly visible Edit and Delete action buttons with gap-3 */}
              <div className="flex items-center gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => handleStartEdit(rec)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 hover:text-sky-300 border border-sky-500/40 rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm active:scale-95"
                  title="Edit endorsement"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button 
                  type="button"
                  onClick={() => onDeleteTestimonial(rec.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm active:scale-95"
                  title="Delete endorsement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Quote bubble text */}
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed italic border-t border-slate-850/60 pt-3">
              "{rec.text}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
