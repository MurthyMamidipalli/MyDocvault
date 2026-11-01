import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Users, 
  Mail, 
  Phone, 
  MessageSquare, 
  Trash2, 
  Calendar, 
  Edit2, 
  Search,
  Building,
  Briefcase,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for contact inputs
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Interactive interaction logging state
  const [activeLogContactId, setActiveLogContactId] = useState<string | null>(null);
  const [expandedLogsContactId, setExpandedLogsContactId] = useState<string | null>(null);
  const [logType, setLogType] = useState<'email' | 'call' | 'meeting' | 'note'>('note');
  const [logSummary, setLogSummary] = useState('');

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase().trim();
    return contacts.filter(c => 
      (c.name || '').toLowerCase().includes(q) ||
      (c.role || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

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

      {/* Search Bar & Total Counter */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-[#0a0b10] p-3 rounded-2xl border border-slate-850">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts list by name, company, role, email, or phone..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-600 focus:border-emerald-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 px-2 text-xs font-mono text-gray-400 shrink-0">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Total Contacts: <strong className="text-white font-bold">{filteredContacts.length}</strong></span>
        </div>
      </div>

      {/* CRM Contact List View (Rendered as a sleek List per requirement) */}
      <div className="space-y-3" id="contacts-list-container">
        {filteredContacts.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-900 rounded-2xl bg-[#0f1115]/30 p-6 space-y-3">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-gray-300 font-bold">No contacts found</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {searchQuery ? `No contacts matching "${searchQuery}".` : 'Add your first contact to populate your network list.'}
            </p>
          </div>
        ) : (
          filteredContacts.map(ct => (
            <div 
              key={ct.id} 
              className="bg-[#0c0d12] border border-slate-850 hover:border-slate-750/90 rounded-2xl p-4 sm:p-5 transition-all shadow-sm space-y-3"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* 1. Identity & Company */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-slate-950 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm shrink-0 shadow-inner">
                    {ct.name.split(' ').map(n=>n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-bold text-sm tracking-tight truncate">{ct.name}</h3>
                      <span className="text-[10px] font-mono text-gray-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                        {ct.category || 'Contact'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                      <span className="font-semibold text-gray-300 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-emerald-400" />
                        {ct.role || 'Professional'}
                      </span>
                      <span>•</span>
                      <span className="text-gray-400 flex items-center gap-1">
                        <Building className="w-3 h-3 text-sky-400" />
                        {ct.company}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Communication Coordinates (Email & Phone) */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 text-xs font-mono text-gray-300 lg:px-4">
                  {ct.email && (
                    <a 
                      href={`mailto:${ct.email}`}
                      className="inline-flex items-center gap-1.5 text-gray-300 hover:text-emerald-400 transition bg-slate-950/60 border border-slate-850 px-2.5 py-1.5 rounded-xl truncate max-w-[200px]"
                      title="Send email"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{ct.email}</span>
                    </a>
                  )}
                  {ct.phone && (
                    <a 
                      href={`tel:${ct.phone}`}
                      className="inline-flex items-center gap-1.5 text-gray-300 hover:text-emerald-400 transition bg-slate-950/60 border border-slate-850 px-2.5 py-1.5 rounded-xl shrink-0"
                      title="Call contact"
                    >
                      <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{ct.phone}</span>
                    </a>
                  )}
                  <span className="text-[10px] text-gray-500 font-mono shrink-0">
                    Sync: {ct.lastInteracted || 'Recent'}
                  </span>
                </div>

                {/* 3. Action Buttons Row (Edit, Delete, Log Communication) */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button 
                    type="button"
                    onClick={() => setActiveLogContactId(activeLogContactId === ct.id ? null : ct.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border shadow-sm active:scale-95 ${
                      activeLogContactId === ct.id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                    title="Log communication session"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>

                  <button 
                    type="button"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm active:scale-95"
                    title="Edit contact details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => onDeleteContact(ct.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm active:scale-95"
                    title="Delete contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

              </div>

              {/* Interaction Log History Toggle (if logs exist) */}
              {ct.interactionLogs && ct.interactionLogs.length > 0 && (
                <div className="pt-2 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setExpandedLogsContactId(expandedLogsContactId === ct.id ? null : ct.id)}
                    className="text-[11px] font-mono text-gray-400 hover:text-emerald-400 flex items-center gap-1.5 cursor-pointer transition select-none"
                  >
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    <span>{ct.interactionLogs.length} Communication {ct.interactionLogs.length === 1 ? 'Record' : 'Records'}</span>
                    {expandedLogsContactId === ct.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {expandedLogsContactId === ct.id && (
                    <div className="mt-2 space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                      {ct.interactionLogs.map(log => (
                        <div key={log.id} className="text-xs text-gray-300 pl-2.5 border-l-2 border-emerald-500/60 py-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                            <span className="capitalize font-bold text-emerald-400">{log.type}</span>
                            <span>{log.timestamp.substring(0, 10)}</span>
                          </div>
                          <p className="mt-0.5 text-gray-300 italic text-[11px]">"{log.summary}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Inline Log Interaction Form */}
              {activeLogContactId === ct.id && (
                <form 
                  onSubmit={e => handleLogInteraction(e, ct.id)} 
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      Log New Interaction with {ct.name}
                    </span>
                    <select
                      value={logType}
                      onChange={e=>setLogType(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 text-xs text-gray-300 rounded-lg px-2 py-1 outline-none font-mono cursor-pointer"
                    >
                      <option value="call">Phone Call</option>
                      <option value="email">Email</option>
                      <option value="meeting">Business Meeting</option>
                      <option value="note">Reference Note</option>
                    </select>
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="Briefly describe what was discussed or synchronized..."
                    value={logSummary}
                    onChange={e=>setLogSummary(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-emerald-500 outline-none"
                  />
                  <div className="flex justify-end gap-2 text-xs font-bold pt-1">
                    <button 
                      type="button" 
                      onClick={() => setActiveLogContactId(null)}
                      className="border border-slate-800 text-gray-400 px-3 py-1.5 rounded-xl hover:bg-slate-900 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-1.5 rounded-xl transition cursor-pointer font-bold"
                    >
                      Save Communication
                    </button>
                  </div>
                </form>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
}
