import React, { useState } from 'react';
import { Plus, Link, Trash2, ExternalLink, Globe, Pencil, Eye, Lock } from 'lucide-react';
import { PortfolioLink } from '../types';

interface PortfoliosTabProps {
  links: PortfolioLink[];
  onAddLink: (link: Omit<PortfolioLink, 'id'>) => void;
  onDeleteLink: (id: string) => void;
  onUpdateLink: (link: PortfolioLink) => void;
}

export default function PortfoliosTab({
  links,
  onAddLink,
  onDeleteLink,
  onUpdateLink
}: PortfoliosTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<PortfolioLink | null>(null);
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleStartEditLink = (lk: PortfolioLink) => {
    setEditingLink(lk);
    setPlatform(lk.platform);
    setUrl(lk.url);
    setLabel(lk.label);
    setIsPublic(lk.isPublic !== false);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !label) return;
    
    const finalPlatform = platform || 'Link';
    if (editingLink) {
      onUpdateLink({ id: editingLink.id, platform: finalPlatform, url, label, isPublic });
    } else {
      onAddLink({ platform: finalPlatform, url, label, isPublic });
    }

    setUrl('');
    setLabel('');
    setPlatform('');
    setIsPublic(true);
    setEditingLink(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="portfolios-links-pane">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">Dynamic Portfolios & Coordinates</h2>
          <p className="text-xs text-gray-400 mt-1">Review unified entrypoints, social developer nodes, and live coordinate trees</p>
        </div>
        <button
          onClick={() => {
            setEditingLink(null);
            setPlatform('');
            setUrl('');
            setLabel('');
            setIsPublic(true);
            setShowForm(!showForm);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Link</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Name</label>
              <input 
                type="text" required
                value={label}
                onChange={e=>{
                  setLabel(e.target.value);
                  if (!platform) setPlatform('Link');
                }}
                placeholder="Enter link name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Link</label>
              <input 
                type="url" required
                value={url}
                onChange={e=>setUrl(e.target.value)}
                placeholder="Enter link (e.g. https://...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-mono text-gray-400">Visibility Status</label>
              <div className="flex gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    isPublic 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-950 text-gray-500 border-slate-850 hover:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Public (Visible in public portfolio)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    !isPublic 
                      ? 'bg-red-500/10 text-red-500/30 text-rose-450 border-red-500/30' 
                      : 'bg-slate-950 text-gray-500 border-slate-850 hover:text-white'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Private (Hidden from public portfolio)</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 text-xs font-bold pt-2">
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
              {editingLink ? 'Update Link' : 'Add Link'}
            </button>
          </div>
        </form>
      )}

      {/* Grid Link aggregator */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {links.map(link => {
          const displayName = link.label || link.platform || 'Portfolio Link';
          const platformName = link.platform || 'Direct Coordinate';

          return (
            <div 
              key={link.id} 
              className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between gap-4 group hover:border-emerald-500/30 transition-all shadow-sm"
            >
              {/* Top Section: Globe Icon + Link Name & Platform + Public/Private Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-emerald-400 shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white text-base font-bold tracking-tight truncate select-text" title={displayName}>
                        {displayName}
                      </h3>
                      <p className="text-gray-400 text-xs font-mono truncate mt-0.5 select-text">
                        {platformName}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold shrink-0 border ${
                    link.isPublic !== false 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-red-500/10 text-rose-400 border-red-500/30'
                  }`}>
                    {link.isPublic !== false ? 'Public' : 'Private'}
                  </span>
                </div>

                {/* URL display pill */}
                <div className="bg-slate-950/80 border border-slate-850 px-3 py-2 rounded-xl text-xs text-gray-300 font-mono truncate select-all">
                  <span className="text-emerald-450 mr-1.5 font-bold">URL:</span>
                  <span>{link.url}</span>
                </div>
              </div>

              {/* Dedicated Actions Row: Clearly visible Visit, Edit, and Delete with gap-3 */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-3 shrink-0">
                <a 
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition active:scale-95 shadow-sm"
                  title="Go to link in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Visit</span>
                </a>

                <button 
                  type="button"
                  onClick={() => handleStartEditLink(link)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-400 hover:text-sky-300 text-xs font-semibold cursor-pointer transition active:scale-95 shadow-sm"
                  title="Edit link"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button 
                  type="button"
                  onClick={() => onDeleteLink(link.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer transition active:scale-95 shadow-sm"
                  title="Delete link"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
