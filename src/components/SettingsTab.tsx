import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SettingsTabProps {
  onRestoreDefaults: () => void;
  onWipeData: () => void;
}

export default function SettingsTab({ onRestoreDefaults, onWipeData }: SettingsTabProps) {
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);

  return (
    <div className="space-y-6 animate-fade-in" id="settings-pane">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">System Settings</h2>
          <p className="text-xs text-gray-400 mt-1">Configure internal local storage, sync backups, and manage operational variables</p>
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

        {/* Database & Backup tools */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-bold text-sm flex items-center gap-1.5 text-rose-500">
            <AlertTriangle className="w-4.5 h-4.5" />
            Integrity & Storage Actions
          </h3>

          <div className="space-y-3 pt-2 text-xs">
            <div className="bg-slate-950/45 p-3 rounded-xl border border-slate-850 text-gray-400 leading-normal">
              Restore defaults to prefill the complete profile of **Ramachandra Murthy Mamidipalli ("Murthy AM")** automatically.
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={onRestoreDefaults}
                className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 px-4 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Restore "Murthy AM" Profile</span>
              </button>

              {!confirmWipe ? (
                <button
                  onClick={() => setConfirmWipe(true)}
                  className="bg-rose-950/40 border border-rose-900 text-rose-400 hover:bg-rose-900 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Clear Local Storage
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-slate-950 p-2 border border-rose-900 rounded-xl">
                  <span className="text-[10px] font-mono font-bold text-rose-400">Confirm wipe?</span>
                  <button
                    onClick={() => {
                      onWipeData();
                      setConfirmWipe(false);
                    }}
                    className="bg-rose-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] cursor-pointer"
                  >
                    Wipe
                  </button>
                  <button
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
    </div>
  );
}
