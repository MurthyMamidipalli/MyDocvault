import React, { useState, useRef } from 'react';
import { Plus, Briefcase, Calendar, MapPin, Trash2, Edit2, ShieldAlert, ExternalLink, Paperclip, Eye, Download, X, FileText } from 'lucide-react';
import { Experience } from '../types';

interface ExperienceTabProps {
  experience: Experience[];
  onAddExperience: (experience: Omit<Experience, 'id'>) => void;
  onDeleteExperience: (id: string) => void;
}

export default function ExperienceTab({
  experience,
  onAddExperience,
  onDeleteExperience
}: ExperienceTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('2022-01');
  const [endDate, setEndDate] = useState('Present');
  const [isCurrent, setIsCurrent] = useState(false);
  const [bulletText, setBulletText] = useState('');
  const [skillsText, setSkillsText] = useState('');

  // PDF File state
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfName, setPdfName] = useState<string>('');
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Link state
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    let formattedUrl = linkUrl.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }
    const label = linkLabel.trim() || 'Link';
    setLinks([...links, { label, url: formattedUrl }]);
    setLinkLabel('');
    setLinkUrl('');
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, idx) => idx !== index));
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfUrl(reader.result as string);
        setPdfName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !company) return;

    // Convert bullet lists and skill list
    const description = bulletText.split('\n').filter(b => b.trim() !== '');
    const skillsUsed = skillsText.split(',').map(s => s.trim()).filter(s => s !== '');

    onAddExperience({
      role,
      company,
      location,
      startDate,
      endDate: isCurrent ? 'Present' : endDate,
      isCurrent,
      description,
      skillsUsed,
      links,
      pdfUrl: pdfUrl || undefined,
      pdfName: pdfName || undefined
    });

    // Reset Form
    setRole('');
    setCompany('');
    setLocation('');
    setStartDate('2022-01');
    setEndDate('');
    setIsCurrent(false);
    setBulletText('');
    setSkillsText('');
    setLinks([]);
    setLinkLabel('');
    setLinkUrl('');
    setPdfUrl('');
    setPdfName('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="experience-pane">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">Professional Career Milestones</h2>
          <p className="text-xs text-gray-400 mt-1">Review operational tenures, job descriptions, and validated technical accomplishments</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Work History</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Role Title *</label>
              <input 
                type="text" required
                value={role}
                onChange={e=>setRole(e.target.value)}
                placeholder="Enter role title"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Employer / Company Name *</label>
              <input 
                type="text" required
                value={company}
                onChange={e=>setCompany(e.target.value)}
                placeholder="Enter company name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400">Work Location</label>
              <input 
                type="text"
                value={location}
                onChange={e=>setLocation(e.target.value)}
                placeholder="Enter work location"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">Start Date</label>
                <input 
                  type="text"
                  value={startDate}
                  onChange={e=>setStartDate(e.target.value)}
                  placeholder="Enter start date"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400">End Date</label>
                <input 
                  type="text"
                  disabled={isCurrent}
                  value={isCurrent ? 'Present' : endDate}
                  onChange={e=>setEndDate(e.target.value)}
                  placeholder="Enter end date"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none disabled:opacity-40"
                />
              </div>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input 
                type="checkbox"
                id="isCurrentCheck"
                checked={isCurrent}
                onChange={e=>setIsCurrent(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 border-slate-800 bg-slate-950"
              />
              <label htmlFor="isCurrentCheck" className="text-xs text-gray-400 font-mono select-none">I currently work in this active role</label>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-mono text-gray-400">Accomplishment Bullets (one per line)</label>
              <textarea 
                rows={3}
                value={bulletText}
                onChange={e=>setBulletText(e.target.value)}
                placeholder="Enter responsibilities and key accomplishments..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none resize-none font-sans"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-mono text-gray-400">Core Technologies Applied (comma-separated)</label>
              <input 
                type="text"
                value={skillsText}
                onChange={e=>setSkillsText(e.target.value)}
                placeholder="Enter skills / tools used"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Project Links Section */}
            <div className="md:col-span-2 border-t border-slate-800/60 pt-4 space-y-3" id="project-links-section">
              <h4 className="text-sm font-bold text-white tracking-tight">Project Links</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-400">LINK LABEL</label>
                  <input 
                    type="text"
                    value={linkLabel}
                    onChange={e => setLinkLabel(e.target.value)}
                    placeholder="Enter link label"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
                
                <div className="flex gap-2 items-end">
                  <div className="flex-grow space-y-1">
                    <label className="text-xs font-mono text-gray-400">LINK URL</label>
                    <input 
                      type="text"
                      value={linkUrl}
                      onChange={e => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="bg-[#10b981]/10 hover:bg-[#10b981]/20 border border-[#10b981]/30 hover:border-[#10b981]/40 text-[#10b981] font-bold h-[38px] w-[38px] rounded-xl flex items-center justify-center cursor-pointer transition select-none active:scale-95 shrink-0"
                    title="Add Link"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Added Links List */}
              {links.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {links.map((link, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-gray-300 shadow-sm"
                    >
                      <span className="font-semibold text-[#10b981]">{link.label}:</span>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[150px] text-gray-400 text-[11px] font-mono hover:underline">{link.url}</a>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        className="text-gray-500 hover:text-rose-450 ml-1 font-bold cursor-pointer transition text-sm"
                        title="Remove Link"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Experience PDF Upload Section */}
            <div className="md:col-span-2 border-t border-slate-800/60 pt-4 space-y-2">
              <label className="text-xs font-mono text-gray-400">Experience Document / Certificate PDF (Optional)</label>
              <input 
                type="file"
                ref={pdfInputRef}
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                onChange={handlePdfChange}
                className="hidden"
              />
              <div 
                onClick={() => pdfInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition select-none ${
                  pdfUrl 
                    ? 'border-[#10b981]/50 bg-slate-950' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/45'
                }`}
              >
                {pdfUrl ? (
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-5 h-5 text-[#10b981]" />
                    <span className="text-xs text-[#10b981] font-bold truncate max-w-[250px]" title={pdfName}>
                      {pdfName || "experience_doc.pdf"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPdfUrl('');
                        setPdfName('');
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer ml-2"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-300 font-semibold">Attach Experience Document / Offer Letter / Certificate PDF</span>
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
                setLinks([]);
                setLinkLabel('');
                setLinkUrl('');
                setPdfUrl('');
                setPdfName('');
              }}
              className="border border-slate-800 text-gray-400 px-4 py-2.5 rounded-xl hover:bg-slate-950 cursor-pointer select-none transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-[#10b981] hover:bg-[#059669] text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer select-none transition active:scale-95 shadow-md shadow-[#10b981]/10"
            >
              Save Experience
            </button>
          </div>
        </form>
      )}

      {/* Corporate Timeline List */}
      <div className="space-y-6">
        {experience.map(exp => (
          <div key={exp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative group">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-800/60">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl h-fit">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base tracking-tight leading-tight">{exp.role}</h3>
                  <p className="text-gray-400 text-xs mt-1 font-semibold">{exp.company}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 text-xs font-mono text-gray-500 text-left md:text-right md:shrink-0">
                {/* Delete option directly above the date */}
                <button 
                  onClick={() => onDeleteExperience(exp.id)}
                  className="p-1 rounded-lg text-gray-500 hover:text-rose-450 hover:bg-slate-950 cursor-pointer opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-[11px] font-mono"
                  title="Delete Career Ledger"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-gray-600" />
                  {exp.startDate} – {exp.endDate}
                </span>
                {exp.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-600" />
                    {exp.location}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <ul className="list-disc list-none pl-0 space-y-2 text-xs md:text-sm text-gray-400 leading-relaxed">
                {exp.description.map((bullet, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              {exp.skillsUsed && exp.skillsUsed.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-4">
                  {exp.skillsUsed.map(skill => (
                    <span key={skill} className="text-[10px] uppercase font-mono font-bold bg-slate-950 text-gray-450 px-2 py-0.5 border border-slate-850 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Work Project / Credentials Links */}
              {exp.links && exp.links.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/60 mt-4">
                  {exp.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl text-xs text-gray-300 hover:text-white transition active:scale-95 select-none font-sans font-medium shadow-sm cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#10b981]" />
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* PDF Document Actions */}
              {exp.pdfUrl && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/60 mt-3">
                  <a
                    href={exp.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981]/15 border border-[#10b981]/30 hover:bg-[#10b981]/25 text-emerald-400 font-bold rounded-xl transition text-xs cursor-pointer"
                    title="View Experience PDF in new tab"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View PDF</span>
                  </a>
                  <a
                    href={exp.pdfUrl}
                    download={exp.pdfName || `${exp.role.replace(/\s+/g, '_')}_Document.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-gray-300 hover:text-white font-bold rounded-xl transition text-xs cursor-pointer"
                    title={exp.pdfName || "Download Experience PDF"}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
