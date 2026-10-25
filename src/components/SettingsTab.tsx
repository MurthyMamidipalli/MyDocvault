import React, { useState } from 'react';
import { 
  ToggleLeft, 
  ToggleRight, 
  AlertTriangle, 
  ShieldCheck, 
  RotateCcw, 
  Trash2, 
  Clock, 
  Briefcase, 
  GraduationCap, 
  Cpu, 
  Award, 
  Target, 
  Archive,
  FolderOpen
} from 'lucide-react';
import { DeletedItem } from '../types';

interface SettingsTabProps {
  onWipeData: () => void;
  oldData: DeletedItem[];
  onRestoreOldData: (item: DeletedItem) => void;
  onPermanentlyDeleteOldData: (id: string) => void;
  onRestoreDefaults?: () => void;
}

export default function SettingsTab({
  onWipeData,
  oldData,
  onRestoreOldData,
  onPermanentlyDeleteOldData
}: SettingsTabProps) {
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);

  const getRemainingDays = (expiresAt: string): number => {
    try {
      const diffMs = new Date(expiresAt).getTime() - Date.now();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(0, days);
    } catch {
      return 30;
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getItemTypeBadge = (type: DeletedItem['itemType']) => {
    switch (type) {
      case 'experience':
        return {
          icon: Briefcase,
          label: 'Experience',
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
      case 'education':
        return {
          icon: GraduationCap,
          label: 'Education',
          className: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        };
      case 'skill':
        return {
          icon: Cpu,
          label: 'Skill',
          className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
        };
      case 'certification':
        return {
          icon: Award,
          label: 'Certification',
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
      case 'specialization':
        return {
          icon: Target,
          label: 'Specialization',
          className: 'bg-teal-500/10 text-teal-400 border-teal-500/20'
        };
      default:
        return {
          icon: Archive,
          label: 'Item',
          className: 'bg-slate-800 text-gray-300 border-slate-700'
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="settings-pane">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">System Settings</h2>
          <p className="text-xs text-gray-400 mt-1">Configure client preferences, storage integrity, and manage 30-day deleted data archives</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Toggle options */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
            Display & Client Preferences
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-white font-semibold text-xs">Offline Sync Status</h4>
                <p className="text-[10px] text-gray-550 mt-0.5">Persist data models dynamically inside local client cache databases.</p>
              </div>
              <button 
                type="button"
                onClick={() => setOfflineSync(!offlineSync)}
                className="text-gray-400 hover:text-white cursor-pointer transition"
              >
                {offlineSync ? (
                  <ToggleRight className="w-9 h-9 text-emerald-450" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-gray-700" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-850/60 pt-4">
              <div>
                <h4 className="text-white font-semibold text-xs">Toast Status Notifications</h4>
                <p className="text-[10px] text-gray-550 mt-0.5">Trigger brief alerts in margins upon modifying core intelligence items.</p>
              </div>
              <button 
                type="button"
                onClick={() => setNotifications(!notifications)}
                className="text-gray-400 hover:text-white cursor-pointer transition"
              >
                {notifications ? (
                  <ToggleRight className="w-9 h-9 text-emerald-450" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Database & Storage maintenance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-bold text-sm flex items-center gap-1.5 text-rose-500">
            <AlertTriangle className="w-4.5 h-4.5" />
            Storage Actions
          </h3>

          <div className="space-y-3 pt-2 text-xs">
            <div className="bg-slate-950/45 p-3 rounded-xl border border-slate-850 text-gray-400 leading-normal">
              Manage client storage cache and clear cached records if you want a clean local state.
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {!confirmWipe ? (
                <button
                  type="button"
                  onClick={() => setConfirmWipe(true)}
                  className="bg-rose-950/40 border border-rose-900 text-rose-400 hover:bg-rose-900 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Clear Local Storage
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-slate-950 p-2 border border-rose-900 rounded-xl">
                  <span className="text-[10px] font-mono font-bold text-rose-400">Confirm wipe?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onWipeData();
                      setConfirmWipe(false);
                    }}
                    className="bg-rose-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] cursor-pointer"
                  >
                    Wipe
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmWipe(false)}
                    className="text-gray-400 hover:text-white px-2 py-0.5 rounded text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Old Data (Stored for 30 Days) Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base tracking-tight flex items-center gap-2">
                <span>Old Data</span>
                <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Stored for 30 days
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                When you delete records, they are safely preserved here for 30 days. You can get any deleted data back anytime.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-gray-400">
            {oldData && oldData.length > 0 ? (
              <span className="text-gray-300 font-semibold">{oldData.length} archived {oldData.length === 1 ? 'record' : 'records'}</span>
            ) : (
              <span className="text-gray-500">Archive empty</span>
            )}
          </div>
        </div>

        {oldData && oldData.length > 0 ? (
          <div className="space-y-3 pt-2">
            {oldData.map(item => {
              const badge = getItemTypeBadge(item.itemType);
              const BadgeIcon = badge.icon;
              const daysLeft = getRemainingDays(item.expiresAt);

              return (
                <div 
                  key={item.id}
                  className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700/80 transition"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg border shrink-0 ${badge.className}`}>
                      <BadgeIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-white font-bold text-sm tracking-tight truncate">
                          {item.title}
                        </h4>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 font-mono mt-1">
                        {item.subtitle && (
                          <span className="text-gray-300">{item.subtitle}</span>
                        )}
                        <span>Deleted: {formatDate(item.deletedAt)}</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clearly visible Get Again and Delete options with comfortable spacing */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onRestoreOldData(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95"
                      title="Restore data back to active section"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Get Data Again</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPermanentlyDeleteOldData(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-rose-400 hover:text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95"
                      title="Permanently remove from archive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center border border-dashed border-slate-800/80 rounded-xl bg-slate-950/30">
            <FolderOpen className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-gray-300">No deleted data in the 30-day retention archive</h4>
            <p className="text-[11px] text-gray-500 mt-1 max-w-md mx-auto">
              When you delete items from Experience, Education, Skills, Certifications, or Specializations, they will be preserved here for 30 days so you can get them back.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
