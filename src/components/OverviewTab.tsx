import React from 'react';
import { 
  Sparkles
} from 'lucide-react';
import { 
  PersonalProfile, 
  Skill, 
  Experience, 
  Certification, 
  Contact, 
  CurrentJob 
} from '../types';

interface OverviewTabProps {
  profile: PersonalProfile;
  skills: Skill[];
  experience: Experience[];
  certifications: Certification[];
  contacts: Contact[];
  currentJob: CurrentJob;
  onNavigate: (tab: string) => void;
}

export default function OverviewTab({
  profile,
  skills,
  experience,
  certifications,
  contacts,
  currentJob,
  onNavigate
}: OverviewTabProps) {
  return (
    <div className="space-y-8 animate-fade-in" id="home-page-view">
      {/* 1. Brand Greeting Header (Home Page Welcome Message with About Me) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-10 max-w-4xl mx-auto backdrop-blur-sm shadow-xl">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0 shadow-lg">
            <Sparkles className="w-9 h-9 text-emerald-400" />
          </div>
          
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded">
                Personal Career Intelligence Suite
              </span>
              <h1 className="text-3xl md:text-4xl font-sans font-extrabold tracking-tight text-white leading-none">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{profile.name}</span>
              </h1>
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
              Your professional MyDocVault Hub is ready. Manage your career intelligence, track your journey, and showcase your excellence to the world.
            </p>

            {/* About Me Section - Fully Visible on Home Page welcome block */}
            <div className="pt-4 border-t border-slate-800/80 mt-4 text-left">
              <h3 className="text-white text-xs font-mono font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1"></span>
                About Me
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed font-sans bg-slate-950/40 p-4 rounded-xl border border-slate-850 shadow-inner">
                {profile.bio || "No professional overview or bio drafted yet. Create your personal profile bio statement in the Personal Profile tab."}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
