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
    
    const finalPlatform = platform || 'Resume Link';
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
          <span>Publish Node Coordinate</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Resume Name</label>
              <input 
                type="text" required
                value={label}
                onChange={e=>{
                  setLabel(e.target.value);
                  if (!platform) setPlatform('Resume Link');
                }}
                placeholder="Enter resume name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Resume Link</label>
              <input 
                type="url" required
                value={url}
                onChange={e=>setUrl(e.target.value)}
                placeholder="Enter resume link (e.g. https://drive.google.com/...)"
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
              {editingLink ? 'Update Link' : 'Publish Link'}
            </button>
          </div>
        </form>
      )}

      {/* Grid Link aggregator */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map(link => (
          <div key={link.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-emerald-500/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-emerald-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.2 rounded text-[7px] font-mono uppercase font-bold border ${
                    link.isPublic !== false 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' 
                      : 'bg-red-500/10 text-rose-400 border-red-500/10'
                  }`}>
                    {link.isPublic !== false ? 'Public' : 'Private'}
                  </span>
                </div>
                <p className="text-white text-sm font-semibold mt-1 truncate max-w-xs">{link.label}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <a 
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded text-gray-500 hover:text-white hover:bg-slate-800/80 transition"
                title="Go to link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button 
                onClick={() => handleStartEditLink(link)}
                className="p-1 rounded text-gray-500 hover:text-emerald-400 hover:bg-slate-800/80 cursor-pointer opacity-0 group-hover:opacity-100 transition"
                title="Edit Link"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button 
                onClick={() => onDeleteLink(link.id)}
                className="p-1 rounded text-gray-550 hover:text-rose-450 hover:bg-slate-800/80 cursor-pointer opacity-0 group-hover:opacity-100 transition"
                title="Delete Link"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
