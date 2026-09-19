import React, { useState } from 'react';
import { Plus, Users, Mail, Phone, MessageSquare, Trash2, ShieldAlert, Star, Calendar, Edit2 } from 'lucide-react';
import { Contact } from '../types';

interface ContactsTabProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id' | 'interactionLogs'>) => void;
  onDeleteContact: (id: string) => void;
  onUpdateContact?: (contact: Contact) => void;
  onAddInteraction: (contactId: string, log: { type: 'email' | 'call' | 'meeting' | 'note'; summary: string }) => void;
}

export default function ContactsTab({
  contacts,
  onAddContact,
  onDeleteContact,
  onUpdateContact,
  onAddInteraction
}: ContactsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  // State for contact inputs
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Interactive interaction logging state
  const [activeLogContactId, setActiveLogContactId] = useState<string | null>(null);
  const [logType, setLogType] = useState<'email' | 'call' | 'meeting' | 'note'>('note');
  const [logSummary, setLogSummary] = useState('');

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;

    if (editingContact) {
      if (onUpdateContact) {
        onUpdateContact({
          ...editingContact,
          name,
          role,
          company,
          email,
          phone
        });
      }
      setEditingContact(null);
    } else {
      onAddContact({
        name,
        role,
        company,
        email,
        phone,
        category: 'recruiter',
        notes: '',
        relationshipStrength: 5,
        status: 'active',
        lastInteracted: new Date().toISOString().substring(0, 10)
      });
    }

    // Reset Form
    setName('');
    setRole('');
    setCompany('');
    setEmail('');
    setPhone('');
    setShowForm(false);
  };

  const handleCancelForm = () => {
    setName('');
    setRole('');
    setCompany('');
    setEmail('');
    setPhone('');
    setEditingContact(null);
    setShowForm(false);
  };

  const handleLogInteraction = (e: React.FormEvent, cId: string) => {
    e.preventDefault();
    if (!logSummary.trim()) return;

    onAddInteraction(cId, { type: logType, summary: logSummary });
    setLogSummary('');
    setActiveLogContactId(null);
  };

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'hot': return 'bg-rose-950 text-rose-400 border-rose-900/60';
      case 'active': return 'bg-emerald-950 text-emerald-405 border-emerald-900/60';
      case 'on-hold': return 'bg-amber-950 text-amber-400 border-amber-900/60';
      default: return 'bg-slate-950 text-gray-400 border-slate-800/60';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="contacts-pane">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">Professional Contacts CRM</h2>
          <p className="text-xs text-gray-400 mt-1">Stay synchronized with industry recruiters, career mentors, and academic colleagues</p>
        </div>
        <button
          onClick={() => {
            if (editingContact) {
              handleCancelForm();
            } else {
              setShowForm(!showForm);
            }
          }}
          className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{editingContact ? 'Cancel Edit' : 'Add Contact Node'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmitContact} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 pb-2 border-b border-slate-800 flex justify-between items-center mb-1">
            <h3 className="text-white font-bold text-xs font-mono uppercase tracking-wider text-emerald-400">
              {editingContact ? '🔄 Modify Connection Coordinates' : '➕ Register New Network Node'}
            </h3>
            {editingContact && (
              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-gray-400 font-mono">
                Target Node: {editingContact.id}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-400">Full Name *</label>
            <input 
              type="text" required
              value={name}
              onChange={e=>setName(e.target.value)}
              placeholder="Enter contact name"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-400">Role / Title *</label>
            <input 
              type="text" required
              value={role}
              onChange={e=>setRole(e.target.value)}
              placeholder="Enter role title"
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
            <label className="text-xs font-mono text-gray-400">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="rachel.a@google.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-mono text-gray-400">Phone Coordinate (Optional)</label>
            <input 
              type="text"
              value={phone}
              onChange={e=>setPhone(e.target.value)}
              placeholder="+1 (555) 231-109"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 text-xs font-bold mt-2">
            <button 
              type="button" 
              onClick={handleCancelForm}
              className="border border-slate-800 text-gray-400 px-4 py-2 rounded-xl hover:bg-slate-950 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-emerald-500 text-slate-950 px-5 py-2 rounded-xl cursor-pointer"
            >
              {editingContact ? 'Update Coordinates' : 'Add CRM Node'}
            </button>
          </div>
        </form>
      )}

      {/* CRM Contact Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {contacts.map(ct => (
          <div key={ct.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 group relative hover:border-emerald-400/10 transition">
            <div className="absolute top-6 right-6 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
              <button 
                onClick={() => {
                  setEditingContact(ct);
                  setName(ct.name);
                  setRole(ct.role);
                  setCompany(ct.company || '');
                  setEmail(ct.email || '');
                  setPhone(ct.phone || '');
                  setShowForm(true);
                  document.getElementById('contacts-pane')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-1 rounded hover:bg-slate-950 text-gray-500 hover:text-emerald-400 cursor-pointer"
                title="Edit connection coordinates"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => onDeleteContact(ct.id)}
                className="p-1 rounded hover:bg-slate-950 text-gray-500 hover:text-rose-450 cursor-pointer"
                title="Purge connection"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Profile Line */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-850/80 pb-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center font-bold text-emerald-400 text-sm">
                  {ct.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-sm tracking-tight">{ct.name}</h3>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">{ct.role || 'Career Network Contact'} • <strong className="text-gray-350 font-semibold">{ct.company}</strong></p>
                </div>
              </div>
            </div>

            {/* Details and coordinates */}
            <div className="text-xs">
              <div className="space-y-1.5 text-gray-450 font-mono">
                {ct.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400/80" />
                    <span className="truncate">{ct.email}</span>
                  </div>
                )}
                {ct.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400/80" />
                    <span>{ct.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Communication log tracker */}
            {ct.interactionLogs && ct.interactionLogs.length > 0 && (
              <div className="bg-slate-950/20 rounded-xl p-3 border border-slate-850/40 space-y-2">
                <span className="text-[9px] font-mono font-bold text-gray-550 uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  LATEST SYNC COMM LOGS
                </span>
                {ct.interactionLogs.map(log => (
                  <div key={log.id} className="text-[11px] text-gray-400 leading-normal pl-2 border-l border-emerald-500/50">
                    <div className="flex items-center justify-between font-mono text-[9px] text-gray-550">
                      <span className="capitalize font-bold text-gray-450">{log.type} session</span>
                      <span>{log.timestamp.substring(0, 10)}</span>
                    </div>
                    <p className="mt-0.5 italic text-gray-350">"{log.summary}"</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Interactive interaction log link and prompt */}
            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-[10px] font-mono text-gray-550">
                Last Sync: {ct.lastInteracted || 'Unspecified'}
              </span>

              {activeLogContactId !== ct.id ? (
                <button 
                  onClick={() => setActiveLogContactId(ct.id)}
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-305 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Log Interactive Communication</span>
                </button>
              ) : (
                <form onSubmit={e => handleLogInteraction(e, ct.id)} className="w-full max-w-sm flex flex-col gap-2 mt-2 bg-slate-950 p-3 rounded-xl border border-slate-850/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">ADD TO TIMELINE</span>
                    <select
                      value={logType}
                      onChange={e=>setLogType(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 text-[10px] text-gray-300 rounded p-0.5 outline-none font-mono"
                    >
                      <option value="call">Phone Call</option>
                      <option value="email">Email</option>
                      <option value="meeting">Business Meeting</option>
                      <option value="note">Reference Note</option>
                    </select>
                  </div>
                  <input 
                    type="text" required
                    placeholder="Short description of what was synchronized..."
                    value={logSummary}
                    onChange={e=>setLogSummary(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                  />
                  <div className="flex justify-end gap-1 text-[10px] font-bold">
                    <button 
                      type="button" 
                      onClick={() => setActiveLogContactId(null)}
                      className="border border-slate-800 text-gray-400 px-2 py-0.5 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded cursor-pointer"
                    >
                      Save Communication
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
