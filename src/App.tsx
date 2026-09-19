/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl, apiFetch } from './lib/api';
import { 
  Home, 
  User, 
  Cpu, 
  GraduationCap, 
  Award, 
  Briefcase, 
  Laptop, 
  Rocket, 
  FileText, 
  Link2, 
  GitBranch, 
  Users, 
  Star, 
  MessageSquare, 
  FolderLock, 
  Globe, 
  Settings, 
  LogOut, 
  Plus, 
  X, 
  Menu, 
  UserPlus, 
  CheckCircle2, 
  Wifi,
  Sparkles,
  StickyNote,
  Calendar,
  AlertTriangle
} from 'lucide-react';

import { 
  PersonalProfile, 
  Skill, 
  Education, 
  Certification, 
  Experience, 
  CurrentJob, 
  Project, 
  PortfolioLink, 
  TimelineMilestone, 
  Contact, 
  Achievement, 
  Testimonial, 
  VaultDocument,
  CalendarEvent,
  NotepadNote,
  ResumeItem,
  EMPTY_PROFILE,
  EMPTY_CURRENT_JOB,
  getAvatarInitials,
  INITIAL_PROFILE, 
  INITIAL_SKILLS, 
  INITIAL_EDUCATION, 
  INITIAL_CERTIFICATIONS, 
  INITIAL_EXPERIENCE, 
  INITIAL_CURRENT_JOB, 
  INITIAL_PROJECTS, 
  INITIAL_LINKS, 
  INITIAL_TIMELINE, 
  INITIAL_CONTACTS, 
  INITIAL_ACHIEVEMENTS, 
  INITIAL_TESTIMONIALS, 
  INITIAL_DOCUMENTS,
  INITIAL_CALENDAR_EVENTS,
  decodePortfolioData,
  encodePortfolioData,
  toUUID
} from './types';

// Tab Components
import OverviewTab from './components/OverviewTab';
import ProfileTab from './components/ProfileTab';
import SkillsTab from './components/SkillsTab';
import EducationTab from './components/EducationTab';
import CertificationsTab from './components/CertificationsTab';
import ExperienceTab from './components/ExperienceTab';
import CurrentJobTab from './components/CurrentJobTab';
import ProjectsTab from './components/ProjectsTab';
import ResumeTab from './components/ResumeTab';
import PortfoliosTab from './components/PortfoliosTab';
import TimelineTab from './components/TimelineTab';
import ContactsTab from './components/ContactsTab';
import AchievementsTab from './components/AchievementsTab';
import TestimonialsTab from './components/TestimonialsTab';
import DocumentVaultTab from './components/DocumentVaultTab';
import SettingsTab from './components/SettingsTab';
import NotepadTab from './components/NotepadTab';
import CalendarTab from './components/CalendarTab';
import PublicPortfolioView from './components/PublicPortfolioView';
import AuthPage from './components/AuthPage';
import { heavyStorage } from './lib/heavyStorage';
import { handleOAuthCallback } from './lib/googleDrive';
import { supabase, STORAGE_BUCKETS, uploadFileToSupabaseStorage } from './lib/supabase';


export default function App() {
  
  // Helper to merge array records by ID or unique key without dropping any records
  const mergeArrayRecords = <T extends { id?: string; name?: string }>(incoming?: T[], existing?: T[]): T[] => {
    const inc = Array.isArray(incoming) ? incoming : [];
    const ext = Array.isArray(existing) ? existing : [];
    if (inc.length === 0) return ext;
    if (ext.length === 0) return inc;

    const map = new Map<string, T>();
    // First keep existing records
    for (const item of ext) {
      const key = item.id || (item.name ? item.name.toLowerCase().trim() : `item_${Math.random()}`);
      map.set(key, item);
    }
    // Then merge/update incoming records
    for (const item of inc) {
      const key = item.id || (item.name ? item.name.toLowerCase().trim() : `item_${Math.random()}`);
      map.set(key, item);
    }
    return Array.from(map.values());
  };

  // Helper to retrieve the current active user's standardized email address
  const getCurrentUserEmail = (): string | null => {
    const saved = localStorage.getItem('nexus_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed?.email?.toLowerCase()?.trim() || null;
      } catch (e) {}
    }
    return null;
  };

  const lastLoadedEmailRef = useRef<string | null>(getCurrentUserEmail());
  const isDocsRestoringRef = useRef<boolean>(true);
  const isCertsRestoringRef = useRef<boolean>(true);
  const isProjsRestoringRef = useRef<boolean>(true);

  // Enforce clean slate ONCE initially to secure empty-by-default behavior
  if (!localStorage.getItem('nexus_empty_slate_initialized_v2')) {
    localStorage.removeItem('nexus_profile');
    localStorage.removeItem('nexus_skills');
    localStorage.removeItem('nexus_education');
    localStorage.removeItem('nexus_certs');
    localStorage.removeItem('nexus_experience');
    localStorage.removeItem('nexus_current_job');
    localStorage.removeItem('nexus_projects');
    localStorage.removeItem('nexus_links');
    localStorage.removeItem('nexus_milestones');
    localStorage.removeItem('nexus_contacts');
    localStorage.removeItem('nexus_achievements');
    localStorage.removeItem('nexus_testimonials');
    localStorage.removeItem('nexus_documents');
    localStorage.setItem('nexus_empty_slate_initialized_v2', 'true');
  }

  // State hooks for public asynchronous share view database and loader status
  const [remoteShareData, setRemoteShareData] = useState<{
    profile: PersonalProfile;
    skills: Skill[];
    experience: Experience[];
    certifications: Certification[];
    projects: Project[];
    education: Education[];
    achievements: Achievement[];
    testimonials: Testimonial[];
    links: PortfolioLink[];
    documents?: VaultDocument[];
    calendarEvents?: CalendarEvent[];
    currentJob?: CurrentJob;
  } | null>(null);
  const [loadingRemoteShare, setLoadingRemoteShare] = useState<boolean>(true);

  // 1. Unified State Initializer
  const [profile, setProfile] = useState<PersonalProfile>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_profile`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { ...EMPTY_PROFILE, ...parsed };
        } catch (e) {}
      }
      
      // Intelligent fallback for new accounts to use their signup identification
      const userJSON = localStorage.getItem('nexus_current_user');
      if (userJSON) {
        try {
          const parsedUser = JSON.parse(userJSON);
          if (parsedUser && parsedUser.email?.toLowerCase().trim() === email) {
            return {
              ...EMPTY_PROFILE,
              email: email,
              firstName: parsedUser.firstName || "",
              lastName: parsedUser.lastName || "",
              name: `${parsedUser.firstName || ""} ${parsedUser.lastName || ""}`.trim(),
              headline: "",
            };
          }
        } catch (e) {}
      }
    }
    return EMPTY_PROFILE;
  });

  const [skills, setSkills] = useState<Skill[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_skills`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const unique: Skill[] = [];
            const seen = new Set<string>();
            for (const s of parsed) {
              if (s && s.name) {
                const nameLower = s.name.toLowerCase().trim();
                if (!seen.has(nameLower)) {
                  seen.add(nameLower);
                  unique.push(s);
                }
              }
            }
            return unique.map((s: any) => ({
              id: s.id,
              name: s.name,
              category: s.category || 'Technical',
              proficiency: s.proficiency || 'Intermediate',
              yearsOfExp: s.yearsOfExp || 1,
              endorsements: s.endorsements || 0,
              description: s.description || '',
              visibility: s.visibility || 'public'
            }));
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [education, setEducation] = useState<Education[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_education`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const unique: Education[] = [];
            const seen = new Set<string>();
            for (const item of parsed) {
              const key = `${item.institution || ''}-${item.degree || ''}`.toLowerCase().trim();
              if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
              }
            }
            return unique;
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [certifications, setCertifications] = useState<Certification[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_certs`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const unique: Certification[] = [];
            const seen = new Set<string>();
            for (const item of parsed) {
              const key = (item.title || '').toLowerCase().trim();
              if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
              }
            }
            return unique;
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [experience, setExperience] = useState<Experience[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_experience`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const unique: Experience[] = [];
            const seen = new Set<string>();
            for (const item of parsed) {
              const key = `${item.role || ''}-${item.company || ''}`.toLowerCase().trim();
              if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
              }
            }
            return unique;
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [currentJob, setCurrentJob] = useState<CurrentJob>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_current_job`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) {
            return { ...EMPTY_CURRENT_JOB, ...parsed };
          }
        } catch (e) {}
      }
    }
    return EMPTY_CURRENT_JOB;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_projects`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const unique: Project[] = [];
            const seen = new Set<string>();
            for (const item of parsed) {
              const key = item.id || (item.name ? `${item.name.toLowerCase().trim()}_${item.date || ''}` : `proj_${Math.random()}`);
              if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
              }
            }
            return unique;
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [products, setProducts] = useState<Project[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_products`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const unique: Project[] = [];
            const seen = new Set<string>();
            for (const item of parsed) {
              const key = item.id || (item.name ? `${item.name.toLowerCase().trim()}_${item.date || ''}` : `prod_${Math.random()}`);
              if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
              }
            }
            return unique;
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [others, setOthers] = useState<Project[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_others`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const unique: Project[] = [];
            const seen = new Set<string>();
            for (const item of parsed) {
              const key = item.id || (item.name ? `${item.name.toLowerCase().trim()}_${item.date || ''}` : `oth_${Math.random()}`);
              if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
              }
            }
            return unique;
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [links, setLinks] = useState<PortfolioLink[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_links`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [resumeLinks, setResumeLinks] = useState<PortfolioLink[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_resume_links`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [milestones, setMilestones] = useState<TimelineMilestone[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_milestones`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_contacts`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_achievements`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_testimonials`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [documents, setDocuments] = useState<VaultDocument[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_documents`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_calendar_events`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return INITIAL_CALENDAR_EVENTS;
  });

  const [notes, setNotes] = useState<NotepadNote[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_notepad_notes`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const [resumes, setResumes] = useState<ResumeItem[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_nexus_vault_resumes`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const VALID_APP_TABS = [
    'overview', 'profile', 'skills', 'education', 'certifications', 'experience',
    'current-job', 'projects', 'resume', 'portfolios', 'timeline', 'contacts',
    'calendar', 'achievements', 'testimonials', 'vault', 'notepad', 'settings'
  ];

  // Active navigation sidebar link with persistence
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const hash = window.location.hash;
      if (hash && !hash.includes('access_token')) {
        const cleaned = hash.replace(/^#\/?/, '').split('?')[0].split('/')[0].trim().toLowerCase();
        if (VALID_APP_TABS.includes(cleaned)) {
          return cleaned;
        }
      }
      const saved = localStorage.getItem('nexus_active_tab');
      if (saved && VALID_APP_TABS.includes(saved)) {
        return saved;
      }
    } catch (_) {}
    return 'overview';
  });

  // Synchronize activeTab with URL hash and localStorage
  useEffect(() => {
    const handleHashChange = () => {
      try {
        const hash = window.location.hash;
        if (hash && !hash.includes('access_token')) {
          const cleaned = hash.replace(/^#\/?/, '').split('?')[0].split('/')[0].trim().toLowerCase();
          if (VALID_APP_TABS.includes(cleaned)) {
            setActiveTab(cleaned);
            localStorage.setItem('nexus_active_tab', cleaned);
          }
        }
      } catch (_) {}
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (activeTab && VALID_APP_TABS.includes(activeTab)) {
      localStorage.setItem('nexus_active_tab', activeTab);
      if (!window.location.hash.startsWith('#/public/') && !window.location.hash.startsWith('#/portfolio/') && !window.location.hash.startsWith('#/share/')) {
        const currentHashClean = window.location.hash.replace(/^#\/?/, '').split('?')[0].split('/')[0].trim().toLowerCase();
        if (currentHashClean !== activeTab) {
          window.history.replaceState(null, '', `${window.location.pathname}#${activeTab}`);
        }
      }
    }
  }, [activeTab]);
  
  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Current logged in user state
  const [currentUser, setCurrentUser] = useState<{ id?: string; email: string; firstName?: string; lastName?: string } | null>(() => {
    const saved = localStorage.getItem('nexus_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Supabase Auth listener & automatic session restoration
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const mappedUser = {
          id: u.id,
          email: u.email || '',
          firstName: u.user_metadata?.first_name || u.email?.split('@')[0],
          lastName: u.user_metadata?.last_name || ''
        };
        setCurrentUser(mappedUser);
        localStorage.setItem('nexus_current_user', JSON.stringify(mappedUser));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        const mappedUser = {
          id: u.id,
          email: u.email || '',
          firstName: u.user_metadata?.first_name || u.email?.split('@')[0],
          lastName: u.user_metadata?.last_name || ''
        };
        setCurrentUser(mappedUser);
        localStorage.setItem('nexus_current_user', JSON.stringify(mappedUser));
      } else if (_event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('nexus_current_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserLogin = (user: { id?: string; email: string; firstName?: string; lastName?: string }) => {
    setCurrentUser(user);
    localStorage.setItem('nexus_current_user', JSON.stringify(user));
  };

  const handleUserLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
    setCurrentUser(null);
    localStorage.removeItem('nexus_current_user');
  };

  // Styled custom modal dialog to bypass native iframe confirm blocking
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Margin notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

   const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check for the Google Drive OAuth redirect hash and set activeTab
  useEffect(() => {
    if (window.location.hash && window.location.hash.includes('access_token')) {
      try {
        const parsed = handleOAuthCallback();
        if (parsed?.token) {
          setActiveTab('vault');
          triggerToast("🔑 Google Drive connected successfully! Upload and download are now active.");
        }
      } catch (e) {
        console.error("OAuth callback handling failed:", e);
      }
    }
  }, []);

  const safeLocalStorageSetItem = (key: string, value: string) => {
    // 1. Save to high-capacity IndexedDB database first to guarantee permanent persistence of all full data
    let parsedData: any = null;
    try {
      parsedData = JSON.parse(value);
      heavyStorage.set(key, parsedData).catch(dbErr => {
        console.error(`IndexedDB background put failed for key "${key}":`, dbErr);
      });
    } catch (_) {
      heavyStorage.set(key, value).catch(dbErr => {
        console.error(`IndexedDB background raw put failed for key "${key}":`, dbErr);
      });
    }

    // 2. High-capacity safeguard: if value is large (> 250KB), prepare a stripped version for localStorage
    // to preserve all records (titles, IDs, metadata) without blowing past the 5MB browser quota.
    let storageValue = value;
    if (value.length > 250000 && parsedData) {
      try {
        if (Array.isArray(parsedData)) {
          const stripped = parsedData.map((item: any) => {
            if (!item || typeof item !== 'object') return item;
            const copy = { ...item };
            if (typeof copy.coverUrl === 'string' && copy.coverUrl.startsWith('data:')) {
              copy.coverUrl = '';
            }
            if (typeof copy.pdfUrl === 'string' && copy.pdfUrl.startsWith('data:')) {
              copy.pdfUrl = '';
            }
            if (typeof copy.fileUrl === 'string' && copy.fileUrl.startsWith('data:')) {
              copy.fileUrl = '';
            }
            if (typeof copy.imageUrl === 'string' && copy.imageUrl.startsWith('data:')) {
              copy.imageUrl = '';
            }
            return copy;
          });
          storageValue = JSON.stringify(stripped);
        }
      } catch (_) {}
    }

    // 3. Save small configuration items to localStorage with graceful fallback
    try {
      localStorage.setItem(key, storageValue);
    } catch (error) {
      if (error instanceof DOMException && (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        // Silently clear any legacy pending sync strings from localStorage to free space
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('nexus_pending_sync_')) {
              localStorage.removeItem(k);
            }
          }
          if (parsedData && Array.isArray(parsedData)) {
            const minItems = parsedData.map((item: any) => ({
              id: item.id,
              name: item.name,
              title: item.title,
              type: item.type,
              date: item.date,
              category: item.category,
              description: item.description ? (item.description.slice(0, 100) + '...') : ''
            }));
            localStorage.setItem(key, JSON.stringify(minItems));
          }
        } catch (_) {}
      }
    }
  };

  // Sync currentUser with localStorage
  useEffect(() => {
    if (currentUser) {
      safeLocalStorageSetItem('nexus_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('nexus_current_user');
    }
  }, [currentUser]);

  // 2. State persistence side-effects
  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        safeLocalStorageSetItem(`${email}_profile`, JSON.stringify(profile));
      }
    }
  }, [profile, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      lastLoadedEmailRef.current = currentUser.email.toLowerCase().trim();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_skills`, JSON.stringify(skills));
    }
  }, [skills, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        safeLocalStorageSetItem(`${email}_education`, JSON.stringify(education));
      }
    }
  }, [education, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (isCertsRestoringRef.current) {
        return;
      }
      safeLocalStorageSetItem(`${email}_certs`, JSON.stringify(certifications));
      heavyStorage.set(`${email}_certs`, certifications).catch(e => {});
    }
  }, [certifications, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        safeLocalStorageSetItem(`${email}_experience`, JSON.stringify(experience));
      }
    }
  }, [experience, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        safeLocalStorageSetItem(`${email}_current_job`, JSON.stringify(currentJob));
      }
    }
  }, [currentJob, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        if (isProjsRestoringRef.current) {
          return;
        }
        safeLocalStorageSetItem(`${email}_projects`, JSON.stringify(projects));
      }
    }
  }, [projects, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        if (isProjsRestoringRef.current) {
          return;
        }
        safeLocalStorageSetItem(`${email}_products`, JSON.stringify(products));
      }
    }
  }, [products, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        if (isProjsRestoringRef.current) {
          return;
        }
        safeLocalStorageSetItem(`${email}_others`, JSON.stringify(others));
      }
    }
  }, [others, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        safeLocalStorageSetItem(`${email}_links`, JSON.stringify(links));
      }
    }
  }, [links, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        safeLocalStorageSetItem(`${email}_resume_links`, JSON.stringify(resumeLinks));
      }
    }
  }, [resumeLinks, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        safeLocalStorageSetItem(`${email}_milestones`, JSON.stringify(milestones));
      }
    }
  }, [milestones, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        safeLocalStorageSetItem(`${email}_contacts`, JSON.stringify(contacts));
      }
    }
  }, [contacts, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        safeLocalStorageSetItem(`${email}_achievements`, JSON.stringify(achievements));
      }
    }
  }, [achievements, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        safeLocalStorageSetItem(`${email}_testimonials`, JSON.stringify(testimonials));
      }
    }
  }, [testimonials, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        if (isDocsRestoringRef.current) {
          return;
        }
        safeLocalStorageSetItem(`${email}_documents`, JSON.stringify(documents));
      }
    }
  }, [documents, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (lastLoadedEmailRef.current === email) {
        safeLocalStorageSetItem(`${email}_calendar_events`, JSON.stringify(calendarEvents));
      }
    }
  }, [calendarEvents, currentUser]);

  // Load high-capacity IndexedDB data asynchronously to bypass standard 5MB browser limits
  useEffect(() => {
    const fetchHeavyData = async () => {
      const email = currentUser?.email?.toLowerCase()?.trim() || getCurrentUserEmail();
      if (!email) {
        isDocsRestoringRef.current = false;
        isCertsRestoringRef.current = false;
        isProjsRestoringRef.current = false;
        return;
      }

      // Mark as restoring to bypass state-persistence saving the empty initial state
      isDocsRestoringRef.current = true;
      isCertsRestoringRef.current = true;
      isProjsRestoringRef.current = true;

      try {
        const dDocs = await heavyStorage.get(`${email}_documents`);
        if (dDocs && Array.isArray(dDocs) && dDocs.length > 0) {
          setDocuments(dDocs);
        }
      } catch (err) {
        console.warn("Async restoration of documents deferred:", err);
      } finally {
        isDocsRestoringRef.current = false;
      }

      try {
        const dCerts = await heavyStorage.get(`${email}_certs`);
        if (dCerts && Array.isArray(dCerts) && dCerts.length > 0) {
          setCertifications(prev => {
            const sanitized = dCerts.map((c: any) => {
              const existing = prev.find(p => p.id === c.id || (p.title && c.title && p.title.toLowerCase().trim() === c.title.toLowerCase().trim()));
              const dVal = c.dateIssued || c.issueDate || c.issue_date || c.date_issued || existing?.dateIssued || existing?.issueDate || '';
              return {
                ...c,
                dateIssued: dVal,
                issueDate: dVal
              };
            });
            return mergeArrayRecords(sanitized, prev);
          });
        }
      } catch (err) {
        console.warn("Async restoration of certifications deferred:", err);
      } finally {
        isCertsRestoringRef.current = false;
      }

      try {
        const dProjs = await heavyStorage.get(`${email}_projects`);
        if (dProjs && Array.isArray(dProjs) && dProjs.length > 0) {
          setProjects(prev => mergeArrayRecords(dProjs, prev));
        }
      } catch (err) {
        console.warn("Async restoration of projects deferred:", err);
      }

      try {
        const dProds = await heavyStorage.get(`${email}_products`);
        if (dProds && Array.isArray(dProds) && dProds.length > 0) {
          setProducts(prev => mergeArrayRecords(dProds, prev));
        }
      } catch (err) {
        console.warn("Async restoration of products deferred:", err);
      }

      try {
        const dOthers = await heavyStorage.get(`${email}_others`);
        if (dOthers && Array.isArray(dOthers) && dOthers.length > 0) {
          setOthers(prev => mergeArrayRecords(dOthers, prev));
        }
      } catch (err) {
        console.warn("Async restoration of others deferred:", err);
      } finally {
        isProjsRestoringRef.current = false;
      }
    };

    fetchHeavyData();
  }, [currentUser]);

  const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const ensureUUID = (id?: string): string => {
    return toUUID(id);
  };

  // Supabase Database restore & initial sync whenever currentUser logs in
  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.id;
    if (!userId) return;

    const loadSupabaseUserData = async () => {
      console.log(`[Supabase DB] Loading records for authenticated user: ${userId}`);
      
      // 1. Profile
      try {
        const { data: pData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (pData) {
          setProfile(prev => ({
            ...prev,
            name: pData.name || prev.name,
            firstName: pData.first_name || prev.firstName,
            lastName: pData.last_name || prev.lastName,
            headline: pData.headline || prev.headline,
            bio: pData.bio || prev.bio,
            email: pData.email || prev.email,
            phone: pData.phone || prev.phone,
            secondaryEmail: pData.secondary_email || prev.secondaryEmail,
            secondaryPhone: pData.secondary_phone || prev.secondaryPhone,
            location: pData.location || prev.location,
            avatarUrl: pData.avatar_url || prev.avatarUrl,
            publicProfile: pData.public_profile ?? prev.publicProfile,
            shareSlug: pData.share_slug || prev.shareSlug
          }));
        }
      } catch (err) {
        console.warn("[Supabase Profiles Load]", err);
      }

      // 2. Skills
      try {
        const { data: sData } = await supabase.from('skills').select('*').eq('user_id', userId);
        if (sData && Array.isArray(sData) && sData.length > 0) {
          const mapped = sData.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category || 'Technical',
            proficiency: s.proficiency || 'Intermediate',
            yearsOfExp: s.years_of_exp || 1,
            endorsements: s.endorsements || 0,
            description: s.description || '',
            visibility: s.visibility || 'public'
          }));
          setSkills(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_skills`, JSON.stringify(mapped));
        } else {
          const emailKey = currentUser?.email?.toLowerCase().trim();
          let currentLocalSkills: Skill[] = skills;
          if ((!currentLocalSkills || currentLocalSkills.length === 0) && emailKey) {
            const raw = localStorage.getItem(`${emailKey}_skills`);
            if (raw) { try { currentLocalSkills = JSON.parse(raw); } catch (e) {} }
          }
          if (currentLocalSkills && currentLocalSkills.length > 0) {
            setSkills(currentLocalSkills);
            for (const sk of currentLocalSkills) {
              const skId = ensureUUID(sk.id);
              try {
                await supabase.from('skills').upsert({
                  id: skId,
                  user_id: userId,
                  name: sk.name,
                  category: sk.category || 'Technical',
                  proficiency: sk.proficiency || 'Intermediate',
                  years_of_exp: sk.yearsOfExp || 1,
                  endorsements: sk.endorsements || 0,
                  description: sk.description || '',
                  visibility: sk.visibility || 'public'
                });
              } catch (err) {}
            }
          }
        }
      } catch (err) { console.warn("[Supabase Skills Load]", err); }

      // 3. Education
      try {
        const { data: eData } = await supabase.from('education').select('*').eq('user_id', userId);
        if (eData && Array.isArray(eData)) {
          const mapped = eData.map(e => ({
            id: e.id,
            degree: e.degree,
            institution: e.institution,
            fieldOfStudy: e.field_of_study,
            startYear: e.start_year,
            endYear: e.end_year,
            grade: e.grade,
            percentage: e.percentage,
            description: e.description
          }));
          setEducation(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_education`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Education Load]", err); }

      // 4. Certifications
      try {
        const { data: cData } = await supabase.from('certifications').select('*').eq('user_id', userId);
        if (cData && Array.isArray(cData) && cData.length > 0) {
          const mapped = cData.map(c => {
            const dVal = c.issue_date || c.date_issued || c.dateIssued || c.issueDate || '';
            return {
              id: c.id,
              title: c.title,
              issuer: c.issuer,
              credentialId: c.credential_id || c.credentialId,
              dateIssued: dVal,
              issueDate: dVal,
              expirationDate: c.expiry_date || c.expirationDate || '',
              expiryDate: c.expiry_date || c.expiryDate || '',
              credentialUrl: c.credential_url || c.credentialUrl,
              description: c.description,
              fileName: c.file_name || c.fileName || '',
              fileUrl: c.file_url || c.fileUrl,
              storagePath: c.storage_path || c.storagePath,
              type: c.type || 'study',
              percentage: c.percentage || '',
              visibility: c.visibility || 'public'
            };
          });
          setCertifications(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_certs`, JSON.stringify(mapped));
        } else {
          const emailKey = currentUser?.email?.toLowerCase().trim();
          let currentLocalCerts: Certification[] = certifications;
          if ((!currentLocalCerts || currentLocalCerts.length === 0) && emailKey) {
            const raw = localStorage.getItem(`${emailKey}_certs`);
            if (raw) { try { currentLocalCerts = JSON.parse(raw); } catch (e) {} }
          }
          if (currentLocalCerts && currentLocalCerts.length > 0) {
            setCertifications(currentLocalCerts);
            for (const c of currentLocalCerts) {
              const cId = ensureUUID(c.id);
              const dVal = c.dateIssued || c.issueDate || '';
              try {
                await supabase.from('certifications').upsert({
                  id: cId,
                  user_id: userId,
                  title: c.title,
                  issuer: c.issuer,
                  credential_id: c.credentialId,
                  issue_date: dVal,
                  expiry_date: c.expirationDate || c.expiryDate,
                  credential_url: c.credentialUrl,
                  description: c.description,
                  file_name: c.fileName,
                  file_url: c.fileUrl,
                  storage_path: c.storagePath,
                  type: c.type || 'study',
                  percentage: c.percentage,
                  visibility: c.visibility || 'public'
                });
              } catch (err) {}
            }
          }
        }
      } catch (err) { console.warn("[Supabase Certifications Load]", err); }

      // 5. Experience
      try {
        const { data: expData } = await supabase.from('experience').select('*').eq('user_id', userId);
        if (expData && Array.isArray(expData)) {
          const mapped = expData.map(exp => ({
            id: exp.id,
            company: exp.company,
            role: exp.role,
            employmentType: exp.employment_type,
            location: exp.location,
            startDate: exp.start_date,
            endDate: exp.end_date,
            isCurrent: exp.is_current,
            description: exp.description || [],
            skillsUsed: exp.skills_used || [],
            links: exp.links || []
          }));
          setExperience(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_experience`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Experience Load]", err); }

      // 6. Current Job
      try {
        const { data: jobData } = await supabase.from('current_jobs').select('*').eq('user_id', userId).maybeSingle();
        if (jobData) {
          const loadedJob = {
            company: jobData.company || '',
            employer: jobData.company || '',
            role: jobData.role || '',
            department: jobData.department || '',
            employeeId: jobData.employee_id || '',
            joiningDate: jobData.joining_date || '',
            startDate: jobData.joining_date || '',
            location: jobData.location || '',
            locationType: jobData.location || 'on-site',
            employmentType: jobData.employment_type || 'full-time',
            salary: jobData.salary || '',
            manager: jobData.manager || '',
            description: jobData.description || ''
          };
          setCurrentJob(loadedJob as any);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_current_job`, JSON.stringify(loadedJob));
        }
      } catch (err) { console.warn("[Supabase Current Job Load]", err); }

      // 7. Projects
      try {
        const { data: projData } = await supabase.from('projects').select('*').eq('user_id', userId);
        if (projData && Array.isArray(projData) && projData.length > 0) {
          const mapped = projData.filter(p => p.type === 'project' || (!p.type && p.category !== 'products' && p.category !== 'others')).map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            type: 'project' as const,
            description: p.description,
            highlights: p.highlights || [],
            techStack: p.tech_stack || [],
            liveUrl: p.live_url,
            githubUrl: p.github_url,
            pdfUrl: p.pdf_url,
            imageUrl: p.image_url,
            isPublic: p.is_public !== false,
            date: p.date
          }));
          setProjects(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_projects`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Projects Load]", err); }

      // 8. Products
      try {
        const { data: prodData } = await supabase.from('products').select('*').eq('user_id', userId);
        if (prodData && Array.isArray(prodData) && prodData.length > 0) {
          const mapped = prodData.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            type: 'product' as const,
            description: p.description,
            highlights: p.highlights || [],
            techStack: p.tech_stack || [],
            liveUrl: p.live_url,
            githubUrl: p.github_url,
            pdfUrl: p.pdf_url,
            imageUrl: p.image_url,
            isPublic: p.is_public !== false,
            date: p.date
          }));
          setProducts(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_products`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Products Load]", err); }

      // 8.5 Others / Reports
      try {
        const { data: othData } = await supabase.from('others').select('*').eq('user_id', userId);
        if (othData && Array.isArray(othData) && othData.length > 0) {
          const mapped = othData.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            type: 'other' as const,
            docType: p.doc_type || p.category || 'Report',
            description: p.description,
            highlights: p.highlights || [],
            techStack: p.tech_stack || [],
            liveUrl: p.live_url,
            githubUrl: p.github_url,
            pdfUrl: p.pdf_url,
            imageUrl: p.image_url,
            isPublic: p.is_public !== false,
            date: p.date
          }));
          setOthers(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_others`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Others Load]", err); }

      // 9. Resumes
      try {
        const { data: resData } = await supabase.from('resumes').select('*').eq('user_id', userId);
        if (resData && Array.isArray(resData)) {
          const mapped = resData.map(r => ({
            id: r.id,
            name: r.title || r.file_name,
            title: r.title,
            fileName: r.file_name,
            fileUrl: r.file_url,
            fileDataUrl: r.file_url,
            storagePath: r.storage_path,
            size: r.file_size,
            fileSize: r.file_size,
            type: r.file_type || 'Resume',
            fileType: r.file_type,
            isPrimary: r.is_primary,
            visibility: r.is_public ? 'public' : 'private',
            isPublic: r.is_public !== false,
            uploadDate: r.created_at ? r.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10),
            category: 'SUPABASE'
          }));
          setResumes(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_nexus_vault_resumes`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Resumes Load]", err); }

      // 10. Documents (Vault)
      try {
        const { data: docData } = await supabase.from('documents').select('*').eq('user_id', userId);
        if (docData && Array.isArray(docData)) {
          const mapped = docData.map(d => ({
            id: d.id,
            name: d.file_name || d.title,
            title: d.title,
            category: d.category,
            description: d.description,
            fileName: d.file_name,
            fileType: d.file_type,
            size: d.file_size,
            fileSize: d.file_size,
            fileUrl: d.file_url,
            storagePath: d.storage_path,
            expiryDate: d.expiry_date,
            uploadDate: d.created_at ? d.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10),
            tags: d.tags || [],
            visibility: d.visibility || 'private'
          }));
          setDocuments(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_documents`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Documents Load]", err); }

      // 11. Notes
      try {
        const { data: nData } = await supabase.from('notes').select('*').eq('user_id', userId);
        if (nData && Array.isArray(nData)) {
          const mapped = nData.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content,
            category: n.tags && n.tags.length > 0 ? n.tags[0] : 'General',
            tags: n.tags || [],
            isPublic: n.is_public !== false,
            updatedAt: n.updated_at || new Date().toISOString()
          }));
          setNotes(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_notepad_notes`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Notes Load]", err); }

      // 12. Portfolio Links
      try {
        const { data: lData } = await supabase.from('portfolio_links').select('*').eq('user_id', userId);
        if (lData && Array.isArray(lData)) {
          const mapped = lData.map(l => ({
            id: l.id,
            platform: l.platform,
            label: l.label,
            url: l.url,
            isPublic: l.is_public !== false
          }));
          setLinks(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_links`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Portfolio Links Load]", err); }

      // 13. Career Timeline (Milestones)
      try {
        const { data: tmData } = await supabase.from('career_timeline').select('*').eq('user_id', userId);
        if (tmData && Array.isArray(tmData)) {
          const mapped = tmData.map(m => ({
            id: m.id,
            title: m.title,
            date: m.date,
            category: m.category,
            type: m.category,
            description: m.description
          }));
          setMilestones(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_milestones`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Timeline Load]", err); }

      // 14. Contacts
      try {
        const { data: ctData } = await supabase.from('contacts').select('*').eq('user_id', userId);
        if (ctData && Array.isArray(ctData)) {
          const mapped = ctData.map(ct => ({
            id: ct.id,
            name: ct.name,
            email: ct.email,
            phone: ct.phone,
            role: ct.role,
            company: ct.company,
            relationship: ct.category,
            category: ct.category,
            location: ct.location,
            notes: ct.notes,
            lastInteracted: ct.last_interacted,
            interactionLogs: ct.interaction_logs || []
          }));
          setContacts(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_contacts`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Contacts Load]", err); }

      // 15. Calendar Events
      try {
        const { data: calData } = await supabase.from('calendar_events').select('*').eq('user_id', userId);
        if (calData && Array.isArray(calData)) {
          const mapped = calData.map(cal => ({
            id: cal.id,
            title: cal.title,
            date: cal.date,
            startTime: cal.start_time,
            endTime: cal.end_time,
            type: cal.type,
            description: cal.description,
            isPublic: cal.is_public !== false
          }));
          setCalendarEvents(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_calendar_events`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Calendar Events Load]", err); }

      // 16. Achievements
      try {
        const { data: aData } = await supabase.from('achievements').select('*').eq('user_id', userId);
        if (aData && Array.isArray(aData)) {
          const mapped = aData.map(a => ({
            id: a.id,
            title: a.title,
            issuer: a.issuer,
            date: a.date,
            description: a.description,
            badgeUrl: a.badge_url,
            isPublic: a.is_public !== false
          }));
          setAchievements(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_achievements`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Achievements Load]", err); }

      // 17. Testimonials
      try {
        const { data: tData } = await supabase.from('testimonials').select('*').eq('user_id', userId);
        if (tData && Array.isArray(tData)) {
          const mapped = tData.map(t => ({
            id: t.id,
            name: t.name,
            company: t.company,
            role: t.role,
            text: t.text,
            relationship: t.relationship,
            avatarColor: t.avatar_color,
            isPublic: t.is_public !== false
          }));
          setTestimonials(mapped);
          if (currentUser?.email) safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_testimonials`, JSON.stringify(mapped));
        }
      } catch (err) { console.warn("[Supabase Testimonials Load]", err); }
    };

    loadSupabaseUserData();
  }, [currentUser]);

  const triggerSaveAll = async (
    customProfile = profile,
    customSkills = skills,
    customEducation = education,
    customCertifications = certifications,
    customExperience = experience,
    customCurrentJob = currentJob,
    customProjects = projects,
    customProducts = products,
    customOthers = others,
    customLinks = links,
    customResumeLinks = resumeLinks,
    customMilestones = milestones,
    customContacts = contacts,
    customAchievements = achievements,
    customTestimonials = testimonials,
    customDocuments = documents,
    customCalendarEvents = calendarEvents,
    customNotes = notes,
    customResumes = resumes
  ) => {
    if (!currentUser) return;
    const email = currentUser.email.toLowerCase().trim();

    // 1. Save to local storage immediately as offline backup
    safeLocalStorageSetItem(`${email}_profile`, JSON.stringify(customProfile));
    safeLocalStorageSetItem(`${email}_skills`, JSON.stringify(customSkills));
    safeLocalStorageSetItem(`${email}_education`, JSON.stringify(customEducation));
    safeLocalStorageSetItem(`${email}_certs`, JSON.stringify(customCertifications));
    safeLocalStorageSetItem(`${email}_experience`, JSON.stringify(customExperience));
    safeLocalStorageSetItem(`${email}_current_job`, JSON.stringify(customCurrentJob));
    safeLocalStorageSetItem(`${email}_projects`, JSON.stringify(customProjects));
    safeLocalStorageSetItem(`${email}_products`, JSON.stringify(customProducts));
    safeLocalStorageSetItem(`${email}_others`, JSON.stringify(customOthers));
    safeLocalStorageSetItem(`${email}_links`, JSON.stringify(customLinks));
    safeLocalStorageSetItem(`${email}_resume_links`, JSON.stringify(customResumeLinks));
    safeLocalStorageSetItem(`${email}_milestones`, JSON.stringify(customMilestones));
    safeLocalStorageSetItem(`${email}_contacts`, JSON.stringify(customContacts));
    safeLocalStorageSetItem(`${email}_achievements`, JSON.stringify(customAchievements));
    safeLocalStorageSetItem(`${email}_testimonials`, JSON.stringify(customTestimonials));
    safeLocalStorageSetItem(`${email}_documents`, JSON.stringify(customDocuments));
    safeLocalStorageSetItem(`${email}_calendar_events`, JSON.stringify(customCalendarEvents));
    safeLocalStorageSetItem(`${email}_notepad_notes`, JSON.stringify(customNotes));
    safeLocalStorageSetItem(`${email}_nexus_vault_resumes`, JSON.stringify(customResumes));
  };

  // 3. Operational CRUD handlers for Supabase Database Integration

  // Profile
  const handleUpdateProfile = async (newProfile: PersonalProfile) => {
    setProfile(newProfile);
    if (currentUser?.id) {
      try {
        await supabase.from('profiles').upsert({
          user_id: currentUser.id,
          email: newProfile.email || currentUser.email,
          first_name: newProfile.firstName,
          last_name: newProfile.lastName,
          name: newProfile.name,
          headline: newProfile.headline,
          bio: newProfile.bio,
          phone: newProfile.phone,
          secondary_email: newProfile.secondaryEmail,
          secondary_phone: newProfile.secondaryPhone,
          location: newProfile.location,
          avatar_url: newProfile.avatarUrl,
          public_profile: newProfile.publicProfile !== false,
          share_slug: newProfile.shareSlug || (newProfile.name ? newProfile.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'user'),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      } catch (err) { console.warn("[Supabase Profile Update Error]", err); }
    }
  };

  // Skills
  const handleAddSkill = async (newSk: Omit<Skill, 'id'>) => {
    const id = generateUUID();
    const skill: Skill = { ...newSk, id };
    const updatedSkills = [skill, ...skills];
    setSkills(updatedSkills);
    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_skills`, JSON.stringify(updatedSkills));
    }
    triggerToast(`Exposed technical skill capability: ${newSk.name}`);

    if (currentUser?.id) {
      try {
        await supabase.from('skills').insert({
          id,
          user_id: currentUser.id,
          name: newSk.name,
          category: newSk.category || 'Technical',
          proficiency: newSk.proficiency || 'Intermediate',
          years_of_exp: newSk.yearsOfExp || 1,
          endorsements: newSk.endorsements || 0,
          description: newSk.description || '',
          visibility: newSk.visibility || 'public'
        });
      } catch (err) { console.warn("[Supabase Add Skill Error]", err); }
    }
  };

  const handleUpdateSkill = async (upSkill: Skill) => {
    const targetId = ensureUUID(upSkill.id);
    const updatedSkill = { ...upSkill, id: targetId };
    const updatedSkills = skills.map(s => (s.id === upSkill.id || s.id === targetId) ? updatedSkill : s);
    setSkills(updatedSkills);
    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_skills`, JSON.stringify(updatedSkills));
    }
    triggerToast(`Optimized technical status: ${upSkill.name}`);

    if (currentUser?.id) {
      try {
        await supabase.from('skills').upsert({
          id: targetId,
          user_id: currentUser.id,
          name: upSkill.name,
          category: upSkill.category || 'Technical',
          proficiency: upSkill.proficiency || 'Intermediate',
          years_of_exp: upSkill.yearsOfExp || 1,
          endorsements: upSkill.endorsements || 0,
          description: upSkill.description || '',
          visibility: upSkill.visibility || 'public'
        });
      } catch (err) { console.warn("[Supabase Update Skill Error]", err); }
    }
  };

  const handleDeleteSkill = async (id: string) => {
    const targetItem = skills.find(s => s.id === id);
    const targetId = toUUID(id);
    const updated = skills.filter(s => s.id !== id && s.id !== targetId);
    setSkills(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_skills`, JSON.stringify(updated));
    }
    triggerToast(`Purged technical coordinate.`);

    if (currentUser?.id) {
      try {
        await supabase.from('skills').delete().eq('id', targetId).eq('user_id', currentUser.id);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('skills').delete().eq('id', id).eq('user_id', currentUser.id);
        }
        if (targetItem?.name) {
          await supabase.from('skills').delete().eq('name', targetItem.name).eq('user_id', currentUser.id);
        }
      } catch (err) { console.warn("[Supabase Delete Skill Error]", err); }
    }
  };

  // Education
  const handleAddEdu = async (newEd: Omit<Education, 'id'>) => {
    const id = generateUUID();
    const eduItem: Education = { ...newEd, id };
    setEducation(prev => [eduItem, ...prev]);
    triggerToast(`Appended academic credential: ${newEd.degree}`);

    if (currentUser?.id) {
      try {
        await supabase.from('education').insert({
          id,
          user_id: currentUser.id,
          degree: newEd.degree,
          institution: newEd.institution,
          field_of_study: newEd.fieldOfStudy,
          start_year: newEd.startYear,
          end_year: newEd.endYear,
          grade: newEd.grade,
          percentage: newEd.percentage,
          description: newEd.description
        });
      } catch (err) { console.warn("[Supabase Add Edu Error]", err); }
    }
  };

  const handleDeleteEdu = async (id: string) => {
    const targetItem = education.find(e => e.id === id);
    const targetId = toUUID(id);
    const updated = education.filter(e => e.id !== id && e.id !== targetId);
    setEducation(updated);

    if (currentUser?.email) {
      safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_education`, JSON.stringify(updated));
    }
    triggerToast(`Removed academic snapshot.`);

    if (currentUser?.id) {
      try {
        await supabase.from('education').delete().eq('id', targetId).eq('user_id', currentUser.id);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('education').delete().eq('id', id).eq('user_id', currentUser.id);
        }
        if (targetItem?.degree && targetItem?.institution) {
          await supabase.from('education').delete().eq('degree', targetItem.degree).eq('institution', targetItem.institution).eq('user_id', currentUser.id);
        }
      } catch (err) { console.warn("[Supabase Delete Edu Error]", err); }
    }
  };

  const handleUpdateEdu = async (updatedEd: Education) => {
    const targetId = ensureUUID(updatedEd.id);
    const item = { ...updatedEd, id: targetId };
    setEducation(prev => prev.map(e => e.id === updatedEd.id ? item : e));
    triggerToast(`Updated academic credential: ${updatedEd.degree}`);

    if (currentUser?.id) {
      try {
        await supabase.from('education').upsert({
          id: targetId,
          user_id: currentUser.id,
          degree: updatedEd.degree,
          institution: updatedEd.institution,
          field_of_study: updatedEd.fieldOfStudy,
          start_year: updatedEd.startYear,
          end_year: updatedEd.endYear,
          grade: updatedEd.grade,
          percentage: updatedEd.percentage,
          description: updatedEd.description
        });
      } catch (err) { console.warn("[Supabase Update Edu Error]", err); }
    }
  };

  // Certifications
  const handleAddCert = async (newCert: Omit<Certification, 'id'>) => {
    const id = generateUUID();
    const dVal = newCert.dateIssued || newCert.issueDate || '';
    const cert: Certification = { ...newCert, id, dateIssued: dVal, issueDate: dVal };
    const updatedCerts = [cert, ...certifications];
    setCertifications(updatedCerts);
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_certs`, JSON.stringify(updatedCerts));
      heavyStorage.set(`${email}_certs`, updatedCerts).catch(e => {});
    }
    triggerToast(`Exposed regulatory certificate: ${newCert.title}`);

    if (currentUser?.id) {
      try {
        await supabase.from('certifications').insert({
          id,
          user_id: currentUser.id,
          title: newCert.title,
          issuer: newCert.issuer,
          credential_id: newCert.credentialId,
          issue_date: dVal,
          expiry_date: newCert.expirationDate || newCert.expiryDate,
          credential_url: newCert.credentialUrl,
          description: newCert.description,
          file_name: newCert.fileName,
          file_url: newCert.fileUrl,
          storage_path: newCert.storagePath,
          type: newCert.type || 'study',
          percentage: newCert.percentage,
          visibility: newCert.visibility || 'public'
        });
      } catch (err) { console.warn("[Supabase Add Cert Error]", err); }
    }
  };

  const handleDeleteCert = async (id: string) => {
    const targetItem = certifications.find(c => c.id === id);
    const targetId = toUUID(id);
    const updated = certifications.filter(c => c.id !== id && c.id !== targetId);
    setCertifications(updated);

    if (currentUser?.email) {
      safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_certs`, JSON.stringify(updated));
    }
    triggerToast(`Wiped credential clearance.`);

    if (currentUser?.id) {
      try {
        await supabase.from('certifications').delete().eq('id', targetId).eq('user_id', currentUser.id);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('certifications').delete().eq('id', id).eq('user_id', currentUser.id);
        }
        if (targetItem?.title) {
          await supabase.from('certifications').delete().eq('title', targetItem.title).eq('user_id', currentUser.id);
        }
      } catch (err) { console.warn("[Supabase Delete Cert Error]", err); }
    }
  };

  const handleUpdateCert = async (updatedCert: Certification) => {
    const targetId = ensureUUID(updatedCert.id);
    const dVal = updatedCert.dateIssued || updatedCert.issueDate || '';
    const item = { ...updatedCert, id: targetId, dateIssued: dVal, issueDate: dVal };
    const updatedCerts = certifications.map(c => (c.id === updatedCert.id || c.id === targetId) ? item : c);
    setCertifications(updatedCerts);
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_certs`, JSON.stringify(updatedCerts));
      heavyStorage.set(`${email}_certs`, updatedCerts).catch(e => {});
    }
    triggerToast(`Updated file attachment for: ${updatedCert.title}`);

    if (currentUser?.id) {
      try {
        await supabase.from('certifications').upsert({
          id: targetId,
          user_id: currentUser.id,
          title: updatedCert.title,
          issuer: updatedCert.issuer,
          credential_id: updatedCert.credentialId,
          issue_date: dVal,
          expiry_date: updatedCert.expirationDate || updatedCert.expiryDate,
          credential_url: updatedCert.credentialUrl,
          description: updatedCert.description,
          file_name: updatedCert.fileName,
          file_url: updatedCert.fileUrl,
          storage_path: updatedCert.storagePath,
          type: updatedCert.type || 'study',
          percentage: updatedCert.percentage,
          visibility: updatedCert.visibility || 'public'
        });
      } catch (err) { console.warn("[Supabase Update Cert Error]", err); }
    }
  };

  // Experience
  const handleAddExp = async (newExp: Omit<Experience, 'id'>) => {
    const id = generateUUID();
    const exp: Experience = { ...newExp, id };
    setExperience(prev => [exp, ...prev]);
    triggerToast(`Registered employment tenure: ${newExp.role}`);

    if (currentUser?.id) {
      try {
        await supabase.from('experience').insert({
          id,
          user_id: currentUser.id,
          company: newExp.company,
          role: newExp.role,
          employment_type: newExp.employmentType,
          location: newExp.location,
          start_date: newExp.startDate,
          end_date: newExp.endDate,
          is_current: newExp.isCurrent,
          description: newExp.description || [],
          skills_used: newExp.skillsUsed || [],
          links: newExp.links || []
        });
      } catch (err) { console.warn("[Supabase Add Exp Error]", err); }
    }
  };

  const handleDeleteExp = async (id: string) => {
    const targetItem = experience.find(e => e.id === id);
    const targetId = toUUID(id);
    const updated = experience.filter(e => e.id !== id && e.id !== targetId);
    setExperience(updated);

    if (currentUser?.email) {
      safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_experience`, JSON.stringify(updated));
    }
    triggerToast(`Cleared historic experience milestone.`);

    if (currentUser?.id) {
      try {
        await supabase.from('experience').delete().eq('id', targetId).eq('user_id', currentUser.id);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('experience').delete().eq('id', id).eq('user_id', currentUser.id);
        }
        if (targetItem?.company && targetItem?.role) {
          await supabase.from('experience').delete().eq('company', targetItem.company).eq('role', targetItem.role).eq('user_id', currentUser.id);
        }
      } catch (err) { console.warn("[Supabase Delete Exp Error]", err); }
    }
  };

  const getActiveUserId = async (): Promise<string | null> => {
    if (currentUser?.id) return currentUser.id;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) return session.user.id;
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (e) {
      return null;
    }
  };

  // Current Job
  const handleUpdateCurrentJob = async (newJob: CurrentJob) => {
    setCurrentJob(newJob);
    const email = currentUser?.email?.toLowerCase().trim();
    if (email) {
      safeLocalStorageSetItem(`${email}_current_job`, JSON.stringify(newJob));
    }
    triggerToast("Updated current job position.");

    const userId = await getActiveUserId();
    if (userId) {
      try {
        const companyName = newJob.company || newJob.employer || 'Current Employer';
        const roleName = newJob.role || 'Current Role';
        const joinDate = newJob.joiningDate || newJob.startDate || '';
        const empType = newJob.employmentType || 'Full-Time';

        const payload = {
          user_id: userId,
          company: companyName,
          role: roleName,
          department: newJob.department || '',
          employee_id: newJob.employeeId || '',
          joining_date: joinDate,
          location: newJob.location || newJob.locationType || '',
          employment_type: empType,
          salary: newJob.salary || '',
          manager: newJob.manager || '',
          description: newJob.description || '',
          updated_at: new Date().toISOString()
        };

        const { data: existing } = await supabase
          .from('current_jobs')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existing && existing.id) {
          const { error } = await supabase.from('current_jobs').update(payload).eq('id', existing.id);
          if (error) console.error("[Supabase Current Job Update Error]", error);
          else console.log("[Supabase Current Job Updated]", payload);
        } else {
          const { error } = await supabase.from('current_jobs').insert({
            id: generateUUID(),
            ...payload
          });
          if (error) console.error("[Supabase Current Job Insert Error]", error);
          else console.log("[Supabase Current Job Inserted]", payload);
        }
      } catch (err) { console.warn("[Supabase Current Job Exception]", err); }
    } else {
      console.warn("[Supabase Current Job] User is not authenticated in Supabase.");
    }
  };

  // Milestones / Career Timeline
  const handleAddMilestone = async (newMil: Omit<TimelineMilestone, 'id'>) => {
    const id = generateUUID();
    const mil: TimelineMilestone = { ...newMil, id };
    const updated = [mil, ...milestones];
    setMilestones(updated);
    const email = currentUser?.email?.toLowerCase().trim();
    if (email) {
      safeLocalStorageSetItem(`${email}_milestones`, JSON.stringify(updated));
    }
    triggerToast(`Published career milestone checkpoint.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        const { error } = await supabase.from('career_timeline').insert({
          id,
          user_id: userId,
          title: newMil.title || 'Career Milestone',
          date: newMil.date || new Date().toISOString().substring(0, 7),
          category: newMil.category || newMil.type || 'career',
          intensity: newMil.intensity || 'medium',
          description: newMil.description || '',
          is_public: true
        });
        if (error) console.error("[Supabase Add Milestone Error]", error);
        else console.log("[Supabase Add Milestone Success]", id);
      } catch (err) { console.warn("[Supabase Add Milestone Exception]", err); }
    } else {
      console.warn("[Supabase Milestone] User is not authenticated in Supabase.");
    }
  };

  // Projects & Products & Others
  const handleAddProj = async (newPr: Omit<Project, 'id'>) => {
    const id = generateUUID();
    const proj: Project = { ...newPr, id };
    const email = currentUser?.email?.toLowerCase().trim();

    if (newPr.type === 'product') {
      const updatedProducts = [proj, ...products];
      setProducts(updatedProducts);
      if (email) safeLocalStorageSetItem(`${email}_products`, JSON.stringify(updatedProducts));
      triggerToast(`Published product assets: ${newPr.name}`);
      if (currentUser?.id) {
        try {
          const payload = {
            id,
            user_id: currentUser.id,
            name: newPr.name,
            category: newPr.category,
            type: 'product',
            description: newPr.description,
            highlights: newPr.highlights || [],
            tech_stack: newPr.techStack || [],
            live_url: newPr.liveUrl,
            github_url: newPr.githubUrl,
            pdf_url: newPr.pdfUrl,
            image_url: newPr.imageUrl,
            is_public: newPr.isPublic !== false,
            date: newPr.date
          };
          await supabase.from('products').insert(payload);
        } catch (err) { console.warn("[Supabase Add Product Error]", err); }
      }
    } else if (newPr.type === 'other') {
      const updatedOthers = [proj, ...others];
      setOthers(updatedOthers);
      if (email) safeLocalStorageSetItem(`${email}_others`, JSON.stringify(updatedOthers));
      triggerToast(`Added document: ${newPr.name}`);
      if (currentUser?.id) {
        try {
          const payload = {
            id,
            user_id: currentUser.id,
            name: newPr.name,
            category: newPr.category,
            type: 'other',
            doc_type: newPr.docType || 'Report',
            description: newPr.description,
            highlights: newPr.highlights || [],
            tech_stack: newPr.techStack || [],
            live_url: newPr.liveUrl,
            github_url: newPr.githubUrl,
            pdf_url: newPr.pdfUrl,
            image_url: newPr.imageUrl,
            is_public: newPr.isPublic !== false,
            date: newPr.date
          };
          await supabase.from('others').insert(payload);
        } catch (err) { console.warn("[Supabase Add Other Error]", err); }
      }
    } else {
      const updatedProjects = [proj, ...projects];
      setProjects(updatedProjects);
      if (email) safeLocalStorageSetItem(`${email}_projects`, JSON.stringify(updatedProjects));
      triggerToast(`Published project assets: ${newPr.name}`);
      if (currentUser?.id) {
        try {
          await supabase.from('projects').insert({
            id,
            user_id: currentUser.id,
            name: newPr.name,
            category: newPr.category,
            type: 'project',
            description: newPr.description,
            highlights: newPr.highlights || [],
            tech_stack: newPr.techStack || [],
            live_url: newPr.liveUrl,
            github_url: newPr.githubUrl,
            pdf_url: newPr.pdfUrl,
            image_url: newPr.imageUrl,
            is_public: newPr.isPublic !== false,
            date: newPr.date
          });
        } catch (err) { console.warn("[Supabase Add Project Error]", err); }
      }
    }
  };

  const handleDeleteProj = async (id: string) => {
    const targetProj = projects.find(p => p.id === id);
    const targetProd = products.find(p => p.id === id);
    const targetOth = others.find(p => p.id === id);
    const targetItem = targetProj || targetProd || targetOth;
    const targetId = toUUID(id);

    const updatedProj = projects.filter(p => p.id !== id && p.id !== targetId);
    const updatedProd = products.filter(p => p.id !== id && p.id !== targetId);
    const updatedOth = others.filter(p => p.id !== id && p.id !== targetId);

    setProjects(updatedProj);
    setProducts(updatedProd);
    setOthers(updatedOth);

    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_projects`, JSON.stringify(updatedProj));
      safeLocalStorageSetItem(`${email}_products`, JSON.stringify(updatedProd));
      safeLocalStorageSetItem(`${email}_others`, JSON.stringify(updatedOth));
    }
    triggerToast(`Archived record.`);

    if (currentUser?.id) {
      try {
        await supabase.from('projects').delete().eq('id', targetId).eq('user_id', currentUser.id);
        await supabase.from('products').delete().eq('id', targetId).eq('user_id', currentUser.id);
        await supabase.from('others').delete().eq('id', targetId).eq('user_id', currentUser.id);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('projects').delete().eq('id', id).eq('user_id', currentUser.id);
          await supabase.from('products').delete().eq('id', id).eq('user_id', currentUser.id);
          await supabase.from('others').delete().eq('id', id).eq('user_id', currentUser.id);
        }
        if (targetItem?.name) {
          await supabase.from('projects').delete().eq('name', targetItem.name).eq('user_id', currentUser.id);
          await supabase.from('products').delete().eq('name', targetItem.name).eq('user_id', currentUser.id);
          await supabase.from('others').delete().eq('name', targetItem.name).eq('user_id', currentUser.id);
        }
      } catch (err) { console.warn("[Supabase Delete Project/Product Error]", err); }
    }
  };

  const handleUpdateProj = async (updatedPr: Project) => {
    const targetId = ensureUUID(updatedPr.id);
    const item = { ...updatedPr, id: targetId };
    const email = currentUser?.email?.toLowerCase().trim();

    if (updatedPr.type === 'product') {
      const updatedProducts = products.map(p => (p.id === updatedPr.id || p.id === targetId) ? item : p);
      setProjects(prev => prev.filter(p => p.id !== updatedPr.id && p.id !== targetId));
      setOthers(prev => prev.filter(p => p.id !== updatedPr.id && p.id !== targetId));
      setProducts(updatedProducts);
      if (email) safeLocalStorageSetItem(`${email}_products`, JSON.stringify(updatedProducts));
      triggerToast(`Updated product assets: ${updatedPr.name}`);
      if (currentUser?.id) {
        try {
          const payload = {
            id: targetId,
            user_id: currentUser.id,
            name: updatedPr.name,
            category: updatedPr.category,
            type: 'product',
            description: updatedPr.description,
            highlights: updatedPr.highlights || [],
            tech_stack: updatedPr.techStack || [],
            live_url: updatedPr.liveUrl,
            github_url: updatedPr.githubUrl,
            pdf_url: updatedPr.pdfUrl,
            image_url: updatedPr.imageUrl,
            is_public: updatedPr.isPublic !== false,
            date: updatedPr.date
          };
          await supabase.from('products').upsert(payload);
          await supabase.from('projects').delete().eq('id', targetId).eq('user_id', currentUser.id);
          await supabase.from('others').delete().eq('id', targetId).eq('user_id', currentUser.id);
        } catch (err) { console.warn("[Supabase Update Product Error]", err); }
      }
    } else if (updatedPr.type === 'other') {
      const updatedOthers = others.map(p => (p.id === updatedPr.id || p.id === targetId) ? item : p);
      setProjects(prev => prev.filter(p => p.id !== updatedPr.id && p.id !== targetId));
      setProducts(prev => prev.filter(p => p.id !== updatedPr.id && p.id !== targetId));
      setOthers(updatedOthers);
      if (email) safeLocalStorageSetItem(`${email}_others`, JSON.stringify(updatedOthers));
      triggerToast(`Updated document: ${updatedPr.name}`);
      if (currentUser?.id) {
        try {
          const payload = {
            id: targetId,
            user_id: currentUser.id,
            name: updatedPr.name,
            category: updatedPr.category,
            type: 'other',
            doc_type: updatedPr.docType || 'Report',
            description: updatedPr.description,
            highlights: updatedPr.highlights || [],
            tech_stack: updatedPr.techStack || [],
            live_url: updatedPr.liveUrl,
            github_url: updatedPr.githubUrl,
            pdf_url: updatedPr.pdfUrl,
            image_url: updatedPr.imageUrl,
            is_public: updatedPr.isPublic !== false,
            date: updatedPr.date
          };
          await supabase.from('others').upsert(payload);
          await supabase.from('projects').delete().eq('id', targetId).eq('user_id', currentUser.id);
          await supabase.from('products').delete().eq('id', targetId).eq('user_id', currentUser.id);
        } catch (err) { console.warn("[Supabase Update Other Error]", err); }
      }
    } else {
      const updatedProjects = projects.map(p => (p.id === updatedPr.id || p.id === targetId) ? item : p);
      setProducts(prev => prev.filter(p => p.id !== updatedPr.id && p.id !== targetId));
      setOthers(prev => prev.filter(p => p.id !== updatedPr.id && p.id !== targetId));
      setProjects(updatedProjects);
      if (email) safeLocalStorageSetItem(`${email}_projects`, JSON.stringify(updatedProjects));
      triggerToast(`Updated project assets: ${updatedPr.name}`);
      if (currentUser?.id) {
        try {
          await supabase.from('projects').upsert({
            id: targetId,
            user_id: currentUser.id,
            name: updatedPr.name,
            category: updatedPr.category,
            type: 'project',
            description: updatedPr.description,
            highlights: updatedPr.highlights || [],
            tech_stack: updatedPr.techStack || [],
            live_url: updatedPr.liveUrl,
            github_url: updatedPr.githubUrl,
            pdf_url: updatedPr.pdfUrl,
            image_url: updatedPr.imageUrl,
            is_public: updatedPr.isPublic !== false,
            date: updatedPr.date
          });
          await supabase.from('products').delete().eq('id', targetId).eq('user_id', currentUser.id);
          await supabase.from('others').delete().eq('id', targetId).eq('user_id', currentUser.id);
        } catch (err) { console.warn("[Supabase Update Project Error]", err); }
      }
    }
  };

  // Portfolio Links
  const handleAddLink = async (newLk: Omit<PortfolioLink, 'id'>) => {
    const id = generateUUID();
    const link: PortfolioLink = { ...newLk, id };
    setLinks(prev => [link, ...prev]);
    triggerToast(`Published portal entry: ${newLk.label}`);

    if (currentUser?.id) {
      try {
        await supabase.from('portfolio_links').insert({
          id,
          user_id: currentUser.id,
          platform: newLk.platform,
          label: newLk.label,
          url: newLk.url,
          is_public: newLk.isPublic !== false
        });
      } catch (err) { console.warn("[Supabase Add Link Error]", err); }
    }
  };

  const handleDeleteLink = async (id: string) => {
    const targetItem = links.find(l => l.id === id);
    const targetId = toUUID(id);
    const updated = links.filter(l => l.id !== id && l.id !== targetId);
    setLinks(updated);

    if (currentUser?.email) {
      safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_links`, JSON.stringify(updated));
    }
    triggerToast(`Closed link coordinates.`);

    if (currentUser?.id) {
      try {
        await supabase.from('portfolio_links').delete().eq('id', targetId).eq('user_id', currentUser.id);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('portfolio_links').delete().eq('id', id).eq('user_id', currentUser.id);
        }
        if (targetItem?.url) {
          await supabase.from('portfolio_links').delete().eq('url', targetItem.url).eq('user_id', currentUser.id);
        }
      } catch (err) { console.warn("[Supabase Delete Link Error]", err); }
    }
  };

  const handleUpdateLink = async (updatedLk: PortfolioLink) => {
    const targetId = ensureUUID(updatedLk.id);
    const item = { ...updatedLk, id: targetId };
    setLinks(prev => prev.map(l => l.id === updatedLk.id ? item : l));
    triggerToast(`Updated portal entry: ${updatedLk.label}`);

    if (currentUser?.id) {
      try {
        await supabase.from('portfolio_links').upsert({
          id: targetId,
          user_id: currentUser.id,
          platform: updatedLk.platform,
          label: updatedLk.label,
          url: updatedLk.url,
          is_public: updatedLk.isPublic !== false
        });
      } catch (err) { console.warn("[Supabase Update Link Error]", err); }
    }
  };

  // Resume Links Handlers
  const handleAddResumeLink = (newLk: Omit<PortfolioLink, 'id'>) => {
    const link: PortfolioLink = { ...newLk, id: generateUUID() };
    setResumeLinks(prev => [link, ...prev]);
    triggerToast(`Added resume link: ${newLk.label}`);
  };

  const handleDeleteResumeLink = (id: string) => {
    setResumeLinks(prev => prev.filter(l => l.id !== id));
    triggerToast(`Removed resume link.`);
  };

  const handleUpdateResumeLink = (updatedLk: PortfolioLink) => {
    setResumeLinks(prev => prev.map(l => l.id === updatedLk.id ? updatedLk : l));
    triggerToast(`Updated resume link: ${updatedLk.label}`);
  };



  const handleDeleteMilestone = async (id: string) => {
    const targetItem = milestones.find(m => m.id === id);
    const targetId = toUUID(id);
    const updated = milestones.filter(m => m.id !== id && m.id !== targetId);
    setMilestones(updated);

    if (currentUser?.email) {
      safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_milestones`, JSON.stringify(updated));
    }
    triggerToast(`Purged timeline checkpoint.`);

    if (currentUser?.id) {
      try {
        await supabase.from('career_timeline').delete().eq('id', targetId).eq('user_id', currentUser.id);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('career_timeline').delete().eq('id', id).eq('user_id', currentUser.id);
        }
        if (targetItem?.title) {
          await supabase.from('career_timeline').delete().eq('title', targetItem.title).eq('user_id', currentUser.id);
        }
      } catch (err) { console.warn("[Supabase Delete Milestone Error]", err); }
    }
  };

  // Contacts CRM
  const handleAddContact = async (newCt: Omit<Contact, 'id' | 'interactionLogs'>) => {
    const id = generateUUID();
    const contact: Contact = { ...newCt, id, interactionLogs: [] };
    setContacts(prev => [contact, ...prev]);
    triggerToast(`Added pipeline network coordinate: ${newCt.name}`);

    if (currentUser?.id) {
      try {
        const { error } = await supabase.from('contacts').insert({
          id,
          user_id: currentUser.id,
          name: newCt.name,
          email: newCt.email || '',
          phone: newCt.phone || '',
          role: newCt.role || '',
          company: newCt.company || '',
          relationship: newCt.relationship || newCt.category || 'Professional',
          category: newCt.category || newCt.relationship || 'Professional',
          location: newCt.location || '',
          notes: newCt.notes || '',
          last_interacted: newCt.lastInteracted || new Date().toISOString().substring(0, 10),
          interaction_logs: []
        });
        if (error) console.error("[Supabase Add Contact Error]", error);
      } catch (err) { console.warn("[Supabase Add Contact Error]", err); }
    }
  };

  const handleDeleteContact = async (id: string) => {
    const targetItem = contacts.find(c => c.id === id);
    const targetId = toUUID(id);
    const updated = contacts.filter(c => c.id !== id && c.id !== targetId);
    setContacts(updated);

    if (currentUser?.email) {
      safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_contacts`, JSON.stringify(updated));
    }
    triggerToast(`Transferred contact records off-grid.`);

    if (currentUser?.id) {
      try {
        await supabase.from('contacts').delete().eq('id', targetId).eq('user_id', currentUser.id);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('contacts').delete().eq('id', id).eq('user_id', currentUser.id);
        }
        if (targetItem?.name) {
          await supabase.from('contacts').delete().eq('name', targetItem.name).eq('user_id', currentUser.id);
        }
      } catch (err) { console.warn("[Supabase Delete Contact Error]", err); }
    }
  };

  const handleUpdateContact = async (updatedCt: Contact) => {
    const targetId = ensureUUID(updatedCt.id);
    const item = { ...updatedCt, id: targetId };
    setContacts(prev => prev.map(c => c.id === updatedCt.id ? item : c));
    triggerToast(`Updated connection coordinates for: ${updatedCt.name}`);

    if (currentUser?.id) {
      try {
        const { error } = await supabase.from('contacts').upsert({
          id: targetId,
          user_id: currentUser.id,
          name: updatedCt.name,
          email: updatedCt.email || '',
          phone: updatedCt.phone || '',
          role: updatedCt.role || '',
          company: updatedCt.company || '',
          relationship: updatedCt.relationship || updatedCt.category || 'Professional',
          category: updatedCt.category || updatedCt.relationship || 'Professional',
          location: updatedCt.location || '',
          notes: updatedCt.notes || '',
          last_interacted: updatedCt.lastInteracted || '',
          interaction_logs: updatedCt.interactionLogs || []
        });
        if (error) console.error("[Supabase Update Contact Error]", error);
      } catch (err) { console.warn("[Supabase Update Contact Error]", err); }
    }
  };

  const handleAddInteraction = async (contactId: string, log: { type: 'email' | 'call' | 'meeting' | 'note'; summary: string }) => {
    let updatedContact: Contact | null = null;
    setContacts(prev => prev.map(ct => {
      if (ct.id === contactId) {
        const fullLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          ...log
        };
        updatedContact = {
          ...ct,
          lastInteracted: new Date().toISOString().substring(0, 10),
          interactionLogs: [fullLog, ...(ct.interactionLogs || [])]
        };
        return updatedContact;
      }
      return ct;
    }));
    triggerToast(`Logged connection sync transaction.`);

    if (currentUser?.id && updatedContact) {
      const targetId = ensureUUID((updatedContact as Contact).id);
      try {
        const { error } = await supabase.from('contacts').upsert({
          id: targetId,
          user_id: currentUser.id,
          name: (updatedContact as Contact).name,
          email: (updatedContact as Contact).email || '',
          phone: (updatedContact as Contact).phone || '',
          role: (updatedContact as Contact).role || '',
          company: (updatedContact as Contact).company || '',
          relationship: (updatedContact as Contact).relationship || (updatedContact as Contact).category || 'Professional',
          category: (updatedContact as Contact).category || (updatedContact as Contact).relationship || 'Professional',
          location: (updatedContact as Contact).location || '',
          notes: (updatedContact as Contact).notes || '',
          last_interacted: (updatedContact as Contact).lastInteracted || '',
          interaction_logs: (updatedContact as Contact).interactionLogs || []
        });
        if (error) console.error("[Supabase Interaction Contact Error]", error);
      } catch (err) { console.warn("[Supabase Interaction Contact Exception]", err); }
    }
  };

  // Achievements
  const handleAddAchievement = async (newAch: Omit<Achievement, 'id'>) => {
    const id = generateUUID();
    const ach: Achievement = { ...newAch, id };
    setAchievements(prev => [ach, ...prev]);
    triggerToast(`Acquired industry award validation!`);

    if (currentUser?.id) {
      try {
        await supabase.from('achievements').insert({
          id,
          user_id: currentUser.id,
          title: newAch.title,
          issuer: newAch.issuer,
          date: newAch.date,
          description: newAch.description,
          badge_url: newAch.badgeUrl,
          is_public: newAch.isPublic !== false
        });
      } catch (err) { console.warn("[Supabase Add Achievement Error]", err); }
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    const targetItem = achievements.find(a => a.id === id);
    const targetId = toUUID(id);
    const updated = achievements.filter(a => a.id !== id && a.id !== targetId);
    setAchievements(updated);

    if (currentUser?.email) {
      safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_achievements`, JSON.stringify(updated));
    }
    triggerToast(`Purged award snapshot.`);

    if (currentUser?.id) {
      try {
        await supabase.from('achievements').delete().eq('id', targetId).eq('user_id', currentUser.id);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('achievements').delete().eq('id', id).eq('user_id', currentUser.id);
        }
        if (targetItem?.title) {
          await supabase.from('achievements').delete().eq('title', targetItem.title).eq('user_id', currentUser.id);
        }
      } catch (err) { console.warn("[Supabase Delete Achievement Error]", err); }
    }
  };

  const handleUpdateAchievement = async (updatedAch: Achievement) => {
    const targetId = ensureUUID(updatedAch.id);
    const item = { ...updatedAch, id: targetId };
    setAchievements(prev => prev.map(a => a.id === updatedAch.id ? item : a));
    triggerToast(`Updated achievement details: ${updatedAch.title}`);

    if (currentUser?.id) {
      try {
        await supabase.from('achievements').upsert({
          id: targetId,
          user_id: currentUser.id,
          title: updatedAch.title,
          issuer: updatedAch.issuer,
          date: updatedAch.date,
          description: updatedAch.description,
          badge_url: updatedAch.badgeUrl,
          is_public: updatedAch.isPublic !== false
        });
      } catch (err) { console.warn("[Supabase Update Achievement Error]", err); }
    }
  };

  // Testimonials
  const handleAddTestimonial = async (newRec: Omit<Testimonial, 'id'>) => {
    const id = generateUUID();
    const rec: Testimonial = { ...newRec, id };
    setTestimonials(prev => [rec, ...prev]);
    triggerToast(`Published peer quote endorsement.`);

    if (currentUser?.id) {
      try {
        await supabase.from('testimonials').insert({
          id,
          user_id: currentUser.id,
          name: newRec.name,
          company: newRec.company,
          role: newRec.role,
          text: newRec.text,
          relationship: newRec.relationship,
          avatar_color: newRec.avatarColor,
          is_public: newRec.isPublic !== false
        });
      } catch (err) { console.warn("[Supabase Add Testimonial Error]", err); }
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    const targetItem = testimonials.find(t => t.id === id);
    const targetId = toUUID(id);
    const updated = testimonials.filter(t => t.id !== id && t.id !== targetId);
    setTestimonials(updated);

    if (currentUser?.email) {
      safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_testimonials`, JSON.stringify(updated));
    }
    triggerToast(`Removed endorsement quote.`);

    if (currentUser?.id) {
      try {
        await supabase.from('testimonials').delete().eq('id', targetId).eq('user_id', currentUser.id);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('testimonials').delete().eq('id', id).eq('user_id', currentUser.id);
        }
        if (targetItem?.name) {
          await supabase.from('testimonials').delete().eq('name', targetItem.name).eq('user_id', currentUser.id);
        }
      } catch (err) { console.warn("[Supabase Delete Testimonial Error]", err); }
    }
  };

  // Documents
  const handleAddDocument = async (newDoc: Omit<VaultDocument, 'id'>) => {
    const isDuplicate = documents.some(d => d.name === newDoc.name && d.size === newDoc.size);
    if (isDuplicate) return;

    const id = generateUUID();
    const doc: VaultDocument = { ...newDoc, id };
    setDocuments(prev => [doc, ...prev]);
    triggerToast(`Secured vault backup file: ${newDoc.name}`);

    if (currentUser?.id) {
      try {
        await supabase.from('documents').insert({
          id,
          user_id: currentUser.id,
          title: newDoc.title || newDoc.name,
          category: newDoc.category || 'other',
          description: newDoc.description || '',
          file_name: newDoc.name,
          file_type: newDoc.fileType || 'application/pdf',
          file_size: newDoc.size || newDoc.fileSize || '',
          file_url: newDoc.fileUrl || '',
          storage_path: newDoc.storagePath || '',
          expiry_date: newDoc.expiryDate || null,
          tags: newDoc.tags || [newDoc.category || 'vault'],
          visibility: newDoc.visibility || 'private'
        });
      } catch (err) { console.warn("[Supabase Add Document Error]", err); }
    }
  };

  const handleDeleteDocument = async (id: string) => {
    const docToDelete = documents.find(d => d.id === id);
    const docName = docToDelete ? docToDelete.name : "document";
    const targetId = toUUID(id);
    const updated = documents.filter(d => d.id !== id && d.id !== targetId);
    setDocuments(updated);

    if (currentUser?.email) {
      safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_documents`, JSON.stringify(updated));
    }
    triggerToast(`Removed "${docName}" from document vault.`);

    if (currentUser?.id) {
      try {
        await supabase.from('documents').delete().eq('id', targetId).eq('user_id', currentUser.id);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('documents').delete().eq('id', id).eq('user_id', currentUser.id);
        }
        if (docToDelete?.name) {
          await supabase.from('documents').delete().eq('file_name', docToDelete.name).eq('user_id', currentUser.id);
          await supabase.from('documents').delete().eq('title', docToDelete.name).eq('user_id', currentUser.id);
        }
      } catch (err) { console.warn("[Supabase Delete Document Error]", err); }
    }
  };

  const handleUpdateDocument = async (updatedDoc: VaultDocument) => {
    setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
    triggerToast(`Updated visibility for document: ${updatedDoc.name}`);

    if (currentUser?.id) {
      try {
        await supabase.from('documents').upsert({
          id: updatedDoc.id,
          user_id: currentUser.id,
          title: updatedDoc.title || updatedDoc.name,
          category: updatedDoc.category || 'other',
          description: updatedDoc.description || '',
          file_name: updatedDoc.name,
          file_type: updatedDoc.fileType || 'application/pdf',
          file_size: updatedDoc.size || updatedDoc.fileSize || '',
          file_url: updatedDoc.fileUrl || '',
          storage_path: updatedDoc.storagePath || '',
          expiry_date: updatedDoc.expiryDate || null,
          tags: updatedDoc.tags || [updatedDoc.category || 'vault'],
          visibility: updatedDoc.visibility || 'private'
        });
      } catch (err) { console.warn("[Supabase Update Document Error]", err); }
    }
  };

  // Calendar Events
  const handleAddCalendarEvent = async (newEvt: Omit<CalendarEvent, 'id'>) => {
    const id = generateUUID();
    const evt: CalendarEvent = { ...newEvt, id };
    setCalendarEvents(prev => [evt, ...prev]);
    triggerToast(`Added scheduled event: "${newEvt.title}"`);

    if (currentUser?.id) {
      try {
        await supabase.from('calendar_events').insert({
          id,
          user_id: currentUser.id,
          title: newEvt.title,
          date: newEvt.date,
          start_time: newEvt.startTime,
          end_time: newEvt.endTime,
          type: newEvt.type,
          description: newEvt.description,
          is_public: newEvt.isPublic !== false
        });
      } catch (err) { console.warn("[Supabase Add Calendar Event Error]", err); }
    }
  };

  const handleUpdateCalendarEvent = async (updatedEvt: CalendarEvent) => {
    const targetId = ensureUUID(updatedEvt.id);
    const item = { ...updatedEvt, id: targetId };
    setCalendarEvents(prev => prev.map(evt => evt.id === updatedEvt.id ? item : evt));
    triggerToast(`Updated scheduled event: "${updatedEvt.title}"`);

    if (currentUser?.id) {
      try {
        await supabase.from('calendar_events').upsert({
          id: targetId,
          user_id: currentUser.id,
          title: updatedEvt.title,
          date: updatedEvt.date,
          start_time: updatedEvt.startTime,
          end_time: updatedEvt.endTime,
          type: updatedEvt.type,
          description: updatedEvt.description,
          is_public: updatedEvt.isPublic !== false
        });
      } catch (err) { console.warn("[Supabase Update Calendar Event Error]", err); }
    }
  };

  const handleDeleteCalendarEvent = async (id: string) => {
    const evtToDelete = calendarEvents.find(e => e.id === id);
    const titleVal = evtToDelete ? evtToDelete.title : "event";
    const targetId = toUUID(id);
    const updated = calendarEvents.filter(e => e.id !== id && e.id !== targetId);
    setCalendarEvents(updated);

    if (currentUser?.email) {
      safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_calendar_events`, JSON.stringify(updated));
    }
    triggerToast(`Deleted scheduled event: "${titleVal}"`);

    if (currentUser?.id) {
      try {
        await supabase.from('calendar_events').delete().eq('id', targetId).eq('user_id', currentUser.id);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('calendar_events').delete().eq('id', id).eq('user_id', currentUser.id);
        }
        if (evtToDelete?.title) {
          await supabase.from('calendar_events').delete().eq('title', evtToDelete.title).eq('user_id', currentUser.id);
        }
      } catch (err) { console.warn("[Supabase Delete Calendar Event Error]", err); }
    }
  };

  // Resumes update handler
  const handleUpdateResumes = async (newResumes: ResumeItem[]) => {
    const deletedResumes = resumes.filter(oldR => !newResumes.some(newR => newR.id === oldR.id));
    setResumes(newResumes);

    if (currentUser?.email) {
      safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_nexus_vault_resumes`, JSON.stringify(newResumes));
    }

    if (currentUser?.id) {
      for (const del of deletedResumes) {
        const targetId = toUUID(del.id);
        try {
          await supabase.from('resumes').delete().eq('id', targetId).eq('user_id', currentUser.id);
          if (del.id && del.id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(del.id)) {
            await supabase.from('resumes').delete().eq('id', del.id).eq('user_id', currentUser.id);
          }
          if (del.fileName || del.name) {
            const fn = del.fileName || del.name;
            await supabase.from('resumes').delete().eq('file_name', fn).eq('user_id', currentUser.id);
            await supabase.from('resumes').delete().eq('title', fn).eq('user_id', currentUser.id);
          }
        } catch (err) { console.warn("[Supabase Delete Resume Error]", err); }
      }

      if (newResumes.length > 0) {
        for (const r of newResumes) {
          const targetId = ensureUUID(r.id);
          try {
            // Convert string size (e.g. "120 KB") to integer for PostgreSQL BIGINT
            let numericSize = 0;
            if (typeof r.size === 'number') {
              numericSize = r.size;
            } else if (typeof r.size === 'string') {
              const parsed = parseInt(r.size.replace(/[^0-9]/g, ''), 10);
              numericSize = isNaN(parsed) ? 0 : parsed;
            } else if (r.fileSize) {
              const parsed = parseInt(String(r.fileSize).replace(/[^0-9]/g, ''), 10);
              numericSize = isNaN(parsed) ? 0 : parsed;
            }

            const { error } = await supabase.from('resumes').upsert({
              id: targetId,
              user_id: currentUser.id,
              title: r.name || r.title || 'Resume',
              file_name: r.fileName || r.name || 'resume.pdf',
              file_url: r.fileUrl || r.fileDataUrl || r.linkUrl || 'https://example.com/resume.pdf',
              storage_path: r.storagePath || '',
              file_size: numericSize,
              file_type: r.type || r.fileType || 'Resume',
              is_primary: r.isPrimary || false,
              is_public: r.visibility === 'public' || r.isPublic !== false
            });
            if (error) {
              console.error("[Supabase Resume Upsert Error]", error);
            }
          } catch (err) { console.warn("[Supabase Resume Upsert Error]", err); }
        }
      }
    }
  };

  // Notes update handler
  const handleUpdateNotes = async (newNotes: NotepadNote[]) => {
    const deletedNotes = notes.filter(oldN => !newNotes.some(newN => newN.id === oldN.id));
    setNotes(newNotes);

    if (currentUser?.email) {
      safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_notepad_notes`, JSON.stringify(newNotes));
    }

    if (currentUser?.id) {
      for (const del of deletedNotes) {
        const targetId = toUUID(del.id);
        try {
          await supabase.from('notes').delete().eq('id', targetId).eq('user_id', currentUser.id);
          if (del.id && del.id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(del.id)) {
            await supabase.from('notes').delete().eq('id', del.id).eq('user_id', currentUser.id);
          }
          if (del.title) {
            await supabase.from('notes').delete().eq('title', del.title).eq('user_id', currentUser.id);
          }
        } catch (err) { console.warn("[Supabase Delete Note Error]", err); }
      }

      if (newNotes.length > 0) {
        for (const n of newNotes) {
          const targetId = ensureUUID(n.id);
          try {
            await supabase.from('notes').upsert({
              id: targetId,
              user_id: currentUser.id,
              title: n.title || 'Untitled Document',
              content: n.content || '',
              tags: n.category ? [n.category] : [],
              is_public: n.isPublic !== false,
              updated_at: n.updatedAt || new Date().toISOString()
            });
          } catch (err) { console.warn("[Supabase Note Upsert Error]", err); }
        }
      }
    }
  };

  // Restores defaults
  const handleRestoreDefaults = () => {
    setConfirmDialog({
      title: "Restore Default Database",
      message: "Are you sure you want to restore all values to Ramachandra Murthy Mamidipalli ('Murthy AM') professional database? This overwrites custom configurations.",
      onConfirm: () => {
        setProfile(INITIAL_PROFILE);
        setSkills(INITIAL_SKILLS);
        setEducation(INITIAL_EDUCATION);
        setCertifications(INITIAL_CERTIFICATIONS);
        setExperience(INITIAL_EXPERIENCE);
        setCurrentJob(INITIAL_CURRENT_JOB);
        
        // Split defaults
        const demoProjects = INITIAL_PROJECTS.filter(p => p.type !== 'product');
        const demoProducts = INITIAL_PROJECTS.filter(p => p.type === 'product');
        setProjects(demoProjects);
        setProducts(demoProducts);

        setLinks(INITIAL_LINKS);
        setResumeLinks([]);

        setMilestones(INITIAL_TIMELINE);
        setContacts(INITIAL_CONTACTS);
        setAchievements(INITIAL_ACHIEVEMENTS);
        setTestimonials(INITIAL_TESTIMONIALS);
        setDocuments(INITIAL_DOCUMENTS);
        setCalendarEvents(INITIAL_CALENDAR_EVENTS);
        setConfirmDialog(null);
        triggerToast("Career intelligence matrices restored successfully.");
      }
    });
  };

  const handleWipeData = () => {
    setProfile({ name: '', headline: '', email: '', phone: '', location: '', bio: '', avatarUrl: '' });
    setSkills([]);
    setEducation([]);
    setCertifications([]);
    setExperience([]);
    setCurrentJob({ employer: '', role: '', startDate: '', department: '', currentProjects: [], dailyStandupText: '', weeklyGoals: [] });
    setProjects([]);
    setProducts([]);
    setLinks([]);
    setResumeLinks([]);
    setMilestones([]);
    setContacts([]);
    setAchievements([]);
    setTestimonials([]);
    setDocuments([]);
    triggerToast("All stored structures cleaned.");
  };

  // Recursively strips heavy base64 items (e.g. uploaded PDFs or massive image files)
  // to ensure URLs fit comfortably within standard browser URL limits (approx. 2000-8000 characters).
  const stripLargeBase64 = (obj: any, key?: string): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
      if (obj.startsWith('data:') && obj.length > 500) {
        if (key === 'avatarUrl') {
          // Allow profile picture base64 up to 1,500,000 characters (approx 1.1MB)
          if (obj.length > 1500000) {
            return '[Large avatar truncated for size limits]';
          }
          return obj;
        }
        return '[Large attachment truncated for optimization]';
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => stripLargeBase64(item));
    }
    if (typeof obj === 'object') {
      const newObj: any = {};
      for (const k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          newObj[k] = stripLargeBase64(obj[k], k);
        }
      }
      return newObj;
    }
    return obj;
  };

  const getFullShareUrl = () => {
    const shareSlug = profile.shareSlug || (profile.name ? profile.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'ramachandra-murthy');
    const origin = (import.meta as any).env?.VITE_PUBLIC_URL || window.location.origin;
    return `${origin}/${shareSlug}`;
  };

  // Check if current view is a public share URL (either by path, hash, or query parameter)
  const isPublicShareView = (() => {
    const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (hash.startsWith('#/portfolio/') || hash.startsWith('#/share/') || hash.startsWith('#/public/')) return true;
    if (path.startsWith('/portfolio/') || path.startsWith('/share/') || path.startsWith('/public/')) return true;
    if (window.location.search.includes('share=')) return true;

    const firstSegment = path.substring(1).split('/')[0];
    if (firstSegment && 
        !VALID_APP_TABS.includes(firstSegment) && 
        !['api', 'assets', 'vite', 'index.html', 'favicon.ico'].includes(firstSegment)) {
      return true;
    }
    return false;
  })();

  // Automated public cloud synchronization effect
  useEffect(() => {
    if (!currentUser) return;
    const email = currentUser.email.toLowerCase().trim();
    if (lastLoadedEmailRef.current !== email) return;

    // 1. Save to local storage synchronously and immediately as offline backup
    safeLocalStorageSetItem(`${email}_profile`, JSON.stringify(profile));
    safeLocalStorageSetItem(`${email}_skills`, JSON.stringify(skills));
    safeLocalStorageSetItem(`${email}_education`, JSON.stringify(education));
    safeLocalStorageSetItem(`${email}_certs`, JSON.stringify(certifications));
    safeLocalStorageSetItem(`${email}_experience`, JSON.stringify(experience));
    safeLocalStorageSetItem(`${email}_current_job`, JSON.stringify(currentJob));
    safeLocalStorageSetItem(`${email}_projects`, JSON.stringify(projects));
    safeLocalStorageSetItem(`${email}_products`, JSON.stringify(products));
    safeLocalStorageSetItem(`${email}_others`, JSON.stringify(others));
    safeLocalStorageSetItem(`${email}_links`, JSON.stringify(links));
    safeLocalStorageSetItem(`${email}_resume_links`, JSON.stringify(resumeLinks));
    safeLocalStorageSetItem(`${email}_milestones`, JSON.stringify(milestones));
    safeLocalStorageSetItem(`${email}_contacts`, JSON.stringify(contacts));
    safeLocalStorageSetItem(`${email}_achievements`, JSON.stringify(achievements));
    safeLocalStorageSetItem(`${email}_testimonials`, JSON.stringify(testimonials));
    safeLocalStorageSetItem(`${email}_documents`, JSON.stringify(documents));
    safeLocalStorageSetItem(`${email}_calendar_events`, JSON.stringify(calendarEvents));
    safeLocalStorageSetItem(`${email}_notepad_notes`, JSON.stringify(notes));
    safeLocalStorageSetItem(`${email}_nexus_vault_resumes`, JSON.stringify(resumes));

    // 2. debounce to avoid excessive REST request flooding on fast inputs
    const timer = setTimeout(() => {
      const shareSlug = profile.shareSlug || (profile.name ? profile.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'ramachandra-murthy');
      
      // CRITICAL SECURITY ENHANCEMENT: Filter out anything that the user selected as "private"
      // so that private items are STRICTLY excluded from the public serialized payload.
      const publicSkillsOnly = skills.filter(s => s.visibility === 'public');
      const publicCertsOnly = certifications.filter(c => c.visibility === 'public').map(c => {
        // Strip out large attachments for serialization to protect link size limits and speed optimization
        if (c.fileUrl && c.fileUrl.startsWith('data:')) {
          return { ...c, fileUrl: '[Uploaded Document Cached]' };
        }
        return c;
      });
      const publicCalendarOnly = calendarEvents.filter(evt => evt.isPublic !== false);
      const publicLinksOnly = [...links, ...resumeLinks].filter(lk => lk.isPublic !== false);
      const publicProjectsOnly = [...projects, ...products, ...others].filter(proj => proj.isPublic !== false);

      // Deduplicate arrays with a precise key comparison to prevent payload duplicates
      const deduplicatePayloadArray = <T extends { id?: string }>(arr: T[], getFallbackKey: (item: any) => string): T[] => {
        if (!arr || !Array.isArray(arr)) return [];
        const seenIds = new Set<string>();
        const seenKeys = new Set<string>();
        const result: T[] = [];
        for (const item of arr) {
          if (!item) continue;
          const id = item.id ? String(item.id).trim() : '';
          const fallbackKey = getFallbackKey(item) ? getFallbackKey(item).toLowerCase().trim() : '';

          if (id && seenIds.has(id)) continue;
          if (fallbackKey && seenKeys.has(fallbackKey)) continue;

          if (id) seenIds.add(id);
          if (fallbackKey) seenKeys.add(fallbackKey);
          result.push(item);
        }
        return result;
      };

      const deduplicatedSkills = deduplicatePayloadArray(publicSkillsOnly, sk => sk.name || '');
      const deduplicatedExperience = deduplicatePayloadArray(experience, exp => `${exp.role || ''}-${exp.company || ''}`);
      const deduplicatedCerts = deduplicatePayloadArray(publicCertsOnly, c => c.title || '');
      const deduplicatedProjects = deduplicatePayloadArray(publicProjectsOnly, proj => proj.name || '');
      const deduplicatedEducation = deduplicatePayloadArray(education, edu => `${edu.degree || ''}-${edu.institution || ''}`);
      const deduplicatedAchievements = deduplicatePayloadArray(achievements, ach => ach.title || '');
      const deduplicatedTestimonials = deduplicatePayloadArray(testimonials, rec => `${rec.name || ''}-${rec.company || ''}`);
      const deduplicatedLinks = deduplicatePayloadArray(publicLinksOnly, lk => lk.url || '');
      const deduplicatedPlatformEvents = deduplicatePayloadArray(publicCalendarOnly, evt => `${evt.title || ''}-${evt.date || ''}`);

      const payload = {
        p: profile,
        s: deduplicatedSkills,
        e: deduplicatedExperience,
        c: deduplicatedCerts,
        pr: deduplicatedProjects,
        ed: deduplicatedEducation,
        a: deduplicatedAchievements,
        t: deduplicatedTestimonials,
        l: deduplicatedLinks,
        cal: deduplicatedPlatformEvents
      };
      
      const serialized = encodePortfolioData(stripLargeBase64(payload));

      // Private complete user database payload for flawless cross-device backup recovery
      const completeUserData = {
        profile,
        skills,
        education,
        certifications,
        experience,
        currentJob,
        projects,
        products,
        others,
        links,
        resumeLinks,
        milestones,
        contacts,
        achievements,
        testimonials,
        documents,
        calendarEvents,
        notes,
        resumes
      };

      const publishToCloud = async () => {
        // First, backup full user profile catalog to the userdata endpoint
        try {
          await apiFetch(`/api/userdata/${encodeURIComponent(email)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: JSON.stringify(completeUserData) })
          });
          console.log(`[Backup Sync] Full userdata backup persisted successfully for email ${email}`);
          // Clear pending sync on successful upload
          localStorage.removeItem(`nexus_pending_sync_${email}`);
        } catch (e) {
          console.log("[Backup Sync] Failed to sync full userdata to server:", e);
          // Store in pending queue to sync later
          localStorage.setItem(`nexus_pending_sync_${email}`, JSON.stringify({
            email,
            data: completeUserData,
            timestamp: Date.now()
          }));
        }

        // Clean sync directly to our custom Express backend API relative path
        try {
          await apiFetch(`/api/share/${shareSlug}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serialized })
          });
          console.log(`[Auto-Publish] Synced successfully with server cache service for slug: ${shareSlug}`);
        } catch (err) {
          console.log(`[Auto-Publish] Express Sync deferred for ${shareSlug}.`);
        }
      };

      publishToCloud();
    }, 1500);

    return () => clearTimeout(timer);
  }, [profile, skills, experience, certifications, projects, products, education, achievements, testimonials, links, resumeLinks, calendarEvents, notes, resumes, currentUser]);

  // Async loader side effect for clean multi-device shared URLs
  useEffect(() => {
    if (!isPublicShareView) return;

    let active = true;

    // Parse slug from URL (path or hash)
    let rawSlug = 'ramachandra-murthy';
    const currentHash = window.location.hash || '';
    const currentPathname = window.location.pathname || '';
    
    if (currentHash.startsWith('#/portfolio/')) {
      const parts = currentHash.split('?');
      rawSlug = parts[0].replace('#/portfolio/', '');
    } else if (currentHash.startsWith('#/share/')) {
      const parts = currentHash.split('?');
      rawSlug = parts[0].replace('#/share/', '');
    } else if (currentHash.startsWith('#/public/')) {
      const parts = currentHash.split('?');
      rawSlug = parts[0].replace('#/public/', '');
    } else if (currentHash.startsWith('#/profile/')) {
      const parts = currentHash.split('?');
      rawSlug = parts[0].replace('#/profile/', '');
    } else if (currentPathname.startsWith('/portfolio/')) {
      const parts = currentPathname.split('?');
      rawSlug = parts[0].replace('/portfolio/', '');
    } else if (currentPathname.startsWith('/share/')) {
      const parts = currentPathname.split('?');
      rawSlug = parts[0].replace('/share/', '');
    } else if (currentPathname.startsWith('/public/')) {
      const parts = currentPathname.split('?');
      rawSlug = parts[0].replace('/public/', '');
    } else if (currentPathname.startsWith('/profile/')) {
      const parts = currentPathname.split('?');
      rawSlug = parts[0].replace('/profile/', '');
    } else if (currentPathname.length > 1) {
      const seg = currentPathname.slice(1).split('/')[0].split('?')[0].trim();
      if (seg && !VALID_APP_TABS.includes(seg.toLowerCase()) && !['api', 'assets', 'vite', 'index.html', 'favicon.ico'].includes(seg.toLowerCase())) {
        rawSlug = seg;
      }
    }
    rawSlug = rawSlug.split('/')[0].trim().toLowerCase();
    let slug = rawSlug;

    const isDemo = slug === 'demo' || slug === 'template';

    // Baseline shared variables (starts with default fallback or empty depending on owner)
    let sharedProfile: PersonalProfile = isDemo ? { ...INITIAL_PROFILE, publicProfile: true } : { ...EMPTY_PROFILE, publicProfile: true };
    let sharedSkills: Skill[] = isDemo ? INITIAL_SKILLS : [];
    let sharedExperience: Experience[] = isDemo ? INITIAL_EXPERIENCE : [];
    let sharedCertifications: Certification[] = isDemo ? INITIAL_CERTIFICATIONS : [];
    let sharedProjects: Project[] = isDemo ? INITIAL_PROJECTS : [];
    let sharedEducation: Education[] = isDemo ? INITIAL_EDUCATION : [];
    let sharedAchievements: Achievement[] = isDemo ? INITIAL_ACHIEVEMENTS : [];
    let sharedTestimonials: Testimonial[] = isDemo ? INITIAL_TESTIMONIALS : [];
    let sharedLinks: PortfolioLink[] = isDemo ? INITIAL_LINKS : [];
    let sharedCalendarEvents: CalendarEvent[] = isDemo ? INITIAL_CALENDAR_EVENTS : [];

    // Find if any registered user matches this slug
    let matchedEmail: string | null = null;
    const registeredUsers: any[] = [];
    const savedUsersJSON = localStorage.getItem('nexus_registered_users');
    if (savedUsersJSON) {
      try {
        const parsed = JSON.parse(savedUsersJSON);
        if (Array.isArray(parsed)) {
          registeredUsers.push(...parsed);
        }
      } catch (e) {}
    }

    // Also include currently logged-in user if not already in the list
    const currentEmail = getCurrentUserEmail();
    if (currentEmail && !registeredUsers.some(u => u.email === currentEmail)) {
      registeredUsers.push({ email: currentEmail, isMailOnly: false });
    }

    // Scan all possible profiles on this machine to find the one matching the current slug
    for (const u of registeredUsers) {
      const savedProfileStr = localStorage.getItem(`${u.email}_profile`);
      if (savedProfileStr) {
        try {
          const p = JSON.parse(savedProfileStr);
          if (p && p.name) {
            const candidateSlug = p.name.toLowerCase().replace(/\s+/g, '-');
            if (candidateSlug === slug) {
              matchedEmail = u.email;
              break;
            }
          }
        } catch (e) {}
      }
    }

    // Fallback to current user if slug matches current user's profile
    if (!matchedEmail && currentEmail) {
      const savedProfileStr = localStorage.getItem(`${currentEmail}_profile`);
      if (savedProfileStr) {
        try {
          const p = JSON.parse(savedProfileStr);
          if (p && p.name && p.name.toLowerCase().replace(/\s+/g, '-') === slug) {
            matchedEmail = currentEmail;
          }
        } catch (e) {}
      }
    }

    // Try loading actual local edits from localStorage first (for zero-latency on native creator machine)
    if (matchedEmail) {
      const getLocalData = (keySuffix: string) => {
        const saved = localStorage.getItem(`${matchedEmail}_${keySuffix}`);
        if (saved) {
          try { return JSON.parse(saved); } catch (e) {}
        }
        return null;
      };
      
      const locP = getLocalData('profile');
      const locS = getLocalData('skills');
      const locE = getLocalData('experience');
      const locC = getLocalData('certs');
      const locPr = getLocalData('projects');
      const locProd = getLocalData('products');
      const locOth = getLocalData('others');
      const locEd = getLocalData('education');
      const locA = getLocalData('achievements');
      const locT = getLocalData('testimonials');
      const locL = getLocalData('links');
      const locResL = getLocalData('resume_links');
      const locCal = getLocalData('calendar_events');

      sharedProfile = locP !== null ? { ...locP, publicProfile: locP.publicProfile !== false } : (isDemo ? { ...INITIAL_PROFILE, publicProfile: true } : { ...EMPTY_PROFILE, publicProfile: true });
      sharedSkills = locS !== null ? locS : (isDemo ? INITIAL_SKILLS : []);
      sharedExperience = locE !== null ? locE : (isDemo ? INITIAL_EXPERIENCE : []);
      sharedCertifications = locC !== null ? locC : (isDemo ? INITIAL_CERTIFICATIONS : []);
      sharedProjects = (locPr !== null || locProd !== null || locOth !== null) 
        ? [...(locPr || []), ...(locProd || []), ...(locOth || [])] 
        : (isDemo ? INITIAL_PROJECTS : []);
      sharedEducation = locEd !== null ? locEd : (isDemo ? INITIAL_EDUCATION : []);
      sharedAchievements = locA !== null ? locA : (isDemo ? INITIAL_ACHIEVEMENTS : []);
      sharedTestimonials = locT !== null ? locT : (isDemo ? INITIAL_TESTIMONIALS : []);
      sharedLinks = (locL !== null || locResL !== null) ? [...(locL || []), ...(locResL || [])] : (isDemo ? INITIAL_LINKS : []);
      sharedCalendarEvents = locCal !== null ? locCal : (isDemo ? INITIAL_CALENDAR_EVENTS : []);
    } else {
      // Direct offline read-only local storage fallback
      const cachedProfileStr = localStorage.getItem(`nexus_cache_profile_${slug}`);
      if (cachedProfileStr) {
        try {
          sharedProfile = { ...JSON.parse(cachedProfileStr), publicProfile: true };
          const getCachedData = (keySuffix: string, fallback: any) => {
            const saved = localStorage.getItem(`nexus_cache_${keySuffix}_${slug}`);
            if (saved) {
              try { return JSON.parse(saved); } catch (e) {}
            }
            return fallback;
          };
          sharedSkills = getCachedData('skills', sharedSkills);
          sharedExperience = getCachedData('experience', sharedExperience);
          sharedCertifications = getCachedData('certs', sharedCertifications);
          sharedProjects = getCachedData('projects', sharedProjects);
          sharedEducation = getCachedData('education', sharedEducation);
          sharedAchievements = getCachedData('achievements', sharedAchievements);
          sharedTestimonials = getCachedData('testimonials', sharedTestimonials);
          sharedLinks = getCachedData('links', sharedLinks);
          sharedCalendarEvents = getCachedData('calendar_events', sharedCalendarEvents);
        } catch (e) {}
      }
    }

    // Set immediate cached/sync state so ui feels instant
    if (active) {
      setRemoteShareData({
        profile: sharedProfile,
        skills: sharedSkills,
        experience: sharedExperience,
        certifications: sharedCertifications,
        projects: sharedProjects,
        education: sharedEducation,
        achievements: sharedAchievements,
        testimonials: sharedTestimonials,
        links: sharedLinks,
        calendarEvents: sharedCalendarEvents
      });
    }

    // Sync Query param as fallback override
    const getQueryParamFromUrl = (param: string): string | null => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        let val = searchParams.get(param);
        if (val) return val;
        
        const hash = window.location.hash;
        const parts = hash.split('?');
        if (parts.length > 1) {
          const hashParams = new URLSearchParams(parts[1]);
          return hashParams.get(param);
        }
      } catch (e) {
        console.error(e);
      }
      return null;
    };

    let lastFetchedText = "";

    const applyDecodedTextPayload = (text: string) => {
      if (!active || !text || text === lastFetchedText) return;
      
      const decoded = decodePortfolioData(text);
      if (decoded) {
        lastFetchedText = text;
        const finalData = {
          profile: decoded.p ? { ...decoded.p, publicProfile: true } : { ...sharedProfile, publicProfile: true },
          skills: decoded.s || sharedSkills,
          experience: decoded.e || sharedExperience,
          certifications: decoded.c || sharedCertifications,
          projects: decoded.pr || sharedProjects,
          education: decoded.ed || sharedEducation,
          achievements: decoded.a || sharedAchievements,
          testimonials: decoded.t || sharedTestimonials,
          links: decoded.l || sharedLinks,
          calendarEvents: decoded.cal || []
        };
        setRemoteShareData(finalData);

        // Back up Cache for future offline review
        try {
          localStorage.setItem(`nexus_cache_profile_${slug}`, JSON.stringify(finalData.profile));
          localStorage.setItem(`nexus_cache_skills_${slug}`, JSON.stringify(finalData.skills));
          localStorage.setItem(`nexus_cache_experience_${slug}`, JSON.stringify(finalData.experience));
          localStorage.setItem(`nexus_cache_certs_${slug}`, JSON.stringify(finalData.certifications));
          localStorage.setItem(`nexus_cache_projects_${slug}`, JSON.stringify(finalData.projects));
          localStorage.setItem(`nexus_cache_education_${slug}`, JSON.stringify(finalData.education));
          localStorage.setItem(`nexus_cache_achievements_${slug}`, JSON.stringify(finalData.achievements));
          localStorage.setItem(`nexus_cache_testimonials_${slug}`, JSON.stringify(finalData.testimonials));
          localStorage.setItem(`nexus_cache_links_${slug}`, JSON.stringify(finalData.links));
          localStorage.setItem(`nexus_cache_calendar_events_${slug}`, JSON.stringify(finalData.calendarEvents));
        } catch (e) {}
      }
    };

    const dParam = getQueryParamFromUrl('d');
    if (dParam) {
      applyDecodedTextPayload(dParam);
      // We set loadingRemoteShare to false so the user immediately gets a rendered page from dParam snapshot.
      setLoadingRemoteShare(false);
    }

    // Async Fetch from our server-side database with sequential fallback layers for bulletproof availability
    if (!dParam) {
      setLoadingRemoteShare(true);
    }
    
    const fetchWithFallback = async () => {
      // 1. Direct Supabase Public Profile Query
      try {
        console.log(`[Supabase Share Query] Fetching public profile for slug: '${slug}'`);
        
        let pRow: any = null;

        // Try exact match by share_slug
        const { data: exactRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('share_slug', slug)
          .maybeSingle();

        pRow = exactRow;

        // Fallback: match by candidate name slug or email handle
        if (!pRow) {
          const { data: allP } = await supabase.from('profiles').select('*');
          if (allP && allP.length > 0) {
            pRow = allP.find((p: any) => {
              if (p.share_slug && p.share_slug.toLowerCase() === slug) return true;
              if (p.name) {
                const candidate = p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                if (candidate === slug) return true;
              }
              if (p.email) {
                const handle = p.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
                if (handle === slug) return true;
              }
              return false;
            });
          }
        }

        if (pRow) {
          if (pRow.public_profile === false) {
            setRemoteShareData({
              profile: { ...sharedProfile, publicProfile: false },
              skills: [], experience: [], certifications: [], projects: [], education: [], achievements: [], testimonials: [], links: [], calendarEvents: []
            });
            return "";
          }

          const uId = pRow.user_id;

          const [
            { data: sData },
            { data: eData },
            { data: cData },
            { data: expData },
            { data: prData },
            { data: prodData },
            { data: othData },
            { data: aData },
            { data: tData },
            { data: lData },
            { data: calData },
            { data: docData },
            { data: resData },
            { data: cjData }
          ] = await Promise.all([
            supabase.from('skills').select('*').eq('user_id', uId),
            supabase.from('education').select('*').eq('user_id', uId),
            supabase.from('certifications').select('*').eq('user_id', uId),
            supabase.from('experience').select('*').eq('user_id', uId),
            supabase.from('projects').select('*').eq('user_id', uId),
            supabase.from('products').select('*').eq('user_id', uId),
            supabase.from('others').select('*').eq('user_id', uId),
            supabase.from('achievements').select('*').eq('user_id', uId),
            supabase.from('testimonials').select('*').eq('user_id', uId),
            supabase.from('portfolio_links').select('*').eq('user_id', uId),
            supabase.from('calendar_events').select('*').eq('user_id', uId),
            supabase.from('documents').select('*').eq('user_id', uId).eq('visibility', 'public'),
            supabase.from('resumes').select('*').eq('user_id', uId),
            supabase.from('current_jobs').select('*').eq('user_id', uId).maybeSingle()
          ]);

          const publicProfileObj: PersonalProfile = {
            ...EMPTY_PROFILE,
            name: pRow.name || `${pRow.first_name || ''} ${pRow.last_name || ''}`.trim() || 'User Profile',
            firstName: pRow.first_name || '',
            lastName: pRow.last_name || '',
            headline: pRow.headline || '',
            bio: pRow.bio || '',
            email: pRow.email || '',
            phone: pRow.phone || '',
            location: pRow.location || '',
            avatarUrl: pRow.avatar_url || '',
            publicProfile: true,
            shareSlug: pRow.share_slug || slug
          };

          const hasCustomSkills = sData && sData.length > 0;
          const hasCustomExp = expData && expData.length > 0;
          const hasCustomCerts = cData && cData.length > 0;
          const hasCustomProjects = (prData && prData.length > 0) || (prodData && prodData.length > 0) || (othData && othData.length > 0);
          const hasCustomEdu = eData && eData.length > 0;

          const publicSharePayload = {
            profile: publicProfileObj,
            skills: hasCustomSkills ? sData.map((s: any) => ({ id: s.id, name: s.name, category: s.category, yearsOfExp: s.years_of_exp, visibility: s.visibility || 'public' })) : (isDemo ? INITIAL_SKILLS : []),
            experience: hasCustomExp ? expData.map((exp: any) => ({ id: exp.id, company: exp.company, role: exp.role, startDate: exp.start_date, endDate: exp.end_date, description: exp.description, skillsUsed: exp.skills_used, links: exp.links, pdfUrl: exp.pdf_url })) : (isDemo ? INITIAL_EXPERIENCE : []),
            certifications: hasCustomCerts ? cData.map((c: any) => ({ id: c.id, title: c.title, issuer: c.issuer, dateIssued: c.issue_date, credentialUrl: c.credential_url, visibility: c.visibility || 'public' })) : (isDemo ? INITIAL_CERTIFICATIONS : []),
            projects: hasCustomProjects ? [
              ...(prData || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                description: p.description,
                highlights: p.highlights,
                techStack: p.tech_stack,
                liveUrl: p.live_url,
                githubUrl: p.github_url,
                pdfUrl: p.pdf_url,
                imageUrl: p.image_url,
                date: p.date,
                isPublic: p.is_public !== false,
                type: p.type || (p.category === 'products' || p.category === 'product' ? 'product' : p.category === 'others' || p.category === 'other' || p.doc_type ? 'other' : 'project'),
                docType: p.doc_type || p.category
              })),
              ...(prodData || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                description: p.description,
                highlights: p.highlights,
                techStack: p.tech_stack,
                liveUrl: p.live_url,
                githubUrl: p.github_url,
                pdfUrl: p.pdf_url,
                imageUrl: p.image_url,
                date: p.date,
                isPublic: p.is_public !== false,
                type: 'product'
              })),
              ...(othData || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                description: p.description,
                highlights: p.highlights,
                techStack: p.tech_stack,
                liveUrl: p.live_url,
                githubUrl: p.github_url,
                pdfUrl: p.pdf_url,
                imageUrl: p.image_url,
                date: p.date,
                isPublic: p.is_public !== false,
                type: 'other',
                docType: p.doc_type || p.category || 'Report'
              }))
            ] : (isDemo ? INITIAL_PROJECTS : []),
            education: hasCustomEdu ? eData.map((e: any) => ({ id: e.id, degree: e.degree, institution: e.institution, fieldOfStudy: e.field_of_study, startYear: e.start_year, endYear: e.end_year, grade: e.grade })) : (isDemo ? INITIAL_EDUCATION : []),
            achievements: (aData && aData.length > 0) ? aData.map((a: any) => ({ id: a.id, title: a.title, issuer: a.issuer, date: a.date, description: a.description, isPublic: a.is_public !== false })) : (isDemo ? INITIAL_ACHIEVEMENTS : []),
            testimonials: (tData && tData.length > 0) ? tData.map((t: any) => ({ id: t.id, name: t.name, company: t.company, role: t.role, text: t.text, relationship: t.relationship, avatarColor: t.avatar_color })) : (isDemo ? INITIAL_TESTIMONIALS : []),
            links: (lData && lData.length > 0) ? lData.map((l: any) => ({ id: l.id, platform: l.platform, label: l.label, url: l.url, isPublic: l.is_public !== false })) : (isDemo ? INITIAL_LINKS : []),
            calendarEvents: (calData && calData.length > 0) ? calData.map((cal: any) => ({ id: cal.id, title: cal.title, date: cal.date, startTime: cal.start_time, endTime: cal.end_time, type: cal.type, isPublic: cal.is_public !== false })) : (isDemo ? INITIAL_CALENDAR_EVENTS : []),
            documents: (docData && docData.length > 0) ? docData.map((d: any) => ({
              id: d.id,
              name: d.file_name || d.title,
              title: d.title,
              category: d.category,
              description: d.description,
              fileType: d.file_type,
              size: d.file_size ? `${Math.round(d.file_size / 1024)} KB` : 'Document',
              fileUrl: d.file_url,
              storagePath: d.storage_path,
              expiryDate: d.expiry_date,
              tags: d.tags,
              visibility: d.visibility || 'public'
            })) : [],
            resumes: (resData && resData.length > 0) ? resData.filter((r: any) => r.is_public !== false).map((r: any) => ({
              id: r.id,
              name: r.title || r.file_name,
              uploadDate: r.created_at ? r.created_at.substring(0, 10) : 'Verified',
              fileDataUrl: r.file_url,
              visibility: 'public',
              type: 'Resume'
            })) : [],
            currentJob: cjData ? {
              employer: cjData.company,
              company: cjData.company,
              role: cjData.role,
              department: cjData.department,
              joiningDate: cjData.joining_date,
              startDate: cjData.joining_date,
              location: cjData.location,
              employmentType: cjData.employment_type,
              description: cjData.description,
              isPublic: true,
              currentProjects: [],
              dailyStandupText: '',
              weeklyGoals: []
            } : undefined
          };

          setRemoteShareData(publicSharePayload);
          console.log("[Supabase Share Query] Loaded public profile payload successfully!");
          return "";
        }
      } catch (err) {
        console.warn("[Supabase Share Query Error]", err);
      }

      try {
        console.log(`[Sync] Reading share data for slug '${slug}' from unified storage...`);
        const res = await apiFetch(`/api/share/${slug}`);
        if (!res.ok) {
          throw new Error(`HTTP Error ${res.status}`);
        }
        const data = await res.json();
        const serializedText = data?.serialized;
        if (serializedText && serializedText.trim().length > 10) {
          console.log(`[Sync] Success: Primary App Server API`);
          return serializedText;
        } else {
          throw new Error("Invalid or empty payload value");
        }
      } catch (err: any) {
        console.log(`[Sync] Failed: Primary App Server API - ${err.message || err}`);
      }

      // 2. Fallback to cache
      console.log(`[Sync] Falling back to local offline cache...`);
      try {
        const cachedProfile = localStorage.getItem(`nexus_cache_profile_${slug}`);
        if (cachedProfile) {
          const finalData = {
            profile: { ...JSON.parse(cachedProfile), publicProfile: true },
            skills: JSON.parse(localStorage.getItem(`nexus_cache_skills_${slug}`) || "[]"),
            experience: JSON.parse(localStorage.getItem(`nexus_cache_experience_${slug}`) || "[]"),
            certifications: JSON.parse(localStorage.getItem(`nexus_cache_certs_${slug}`) || "[]"),
            projects: JSON.parse(localStorage.getItem(`nexus_cache_projects_${slug}`) || "[]"),
            education: JSON.parse(localStorage.getItem(`nexus_cache_education_${slug}`) || "[]"),
            achievements: JSON.parse(localStorage.getItem(`nexus_cache_achievements_${slug}`) || "[]"),
            testimonials: JSON.parse(localStorage.getItem(`nexus_cache_testimonials_${slug}`) || "[]"),
            links: JSON.parse(localStorage.getItem(`nexus_cache_links_${slug}`) || "[]"),
            calendarEvents: JSON.parse(localStorage.getItem(`nexus_cache_calendar_events_${slug}`) || "[]")
          };
          setRemoteShareData(finalData);
          console.log(`[Sync] Successfully restored from local offline Cache backup.`);
          return "";
        }
      } catch (cacheErr) {
        console.log("[Sync] Stale local offline cache failed:", cacheErr);
      }

      // Ensure fallback payload is set so visitor never sees Access Restricted
      setRemoteShareData(prev => prev || {
        profile: sharedProfile,
        skills: sharedSkills,
        experience: sharedExperience,
        certifications: sharedCertifications,
        projects: sharedProjects,
        education: sharedEducation,
        achievements: sharedAchievements,
        testimonials: sharedTestimonials,
        links: sharedLinks,
        calendarEvents: sharedCalendarEvents
      });

      return "";
    };

    // Initial load live fetch
    fetchWithFallback()
      .then(text => {
        if (text) {
          applyDecodedTextPayload(text);
        }
      })
      .catch(e => {
        console.log("KV cloud payload fetch error (falling back to local layout cache):", e);
      })
      .finally(() => {
        if (active) {
          setLoadingRemoteShare(false);
        }
      });

    // Smart background interval to dynamically auto-sync real-time edits while visitor has page open
    const interval = setInterval(() => {
      fetchWithFallback()
        .then(text => {
          if (text) {
            applyDecodedTextPayload(text);
          }
        })
        .catch(e => {
          console.log("[Sync] Background polling check failed:", e);
        });
    }, 7500); // Check for real-time CRM updates every 7.5 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isPublicShareView]);

  if (isPublicShareView) {
    if (loadingRemoteShare && (!remoteShareData || !remoteShareData.profile.name)) {
      return (
        <div className="min-h-screen bg-[#07080b] flex flex-col justify-center items-center font-sans select-none relative overflow-hidden" id="nexus-share-loader">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] bg-emerald-500/10 pointer-events-none" />
          <div className="z-10 text-center space-y-6 max-w-sm px-6 animate-pulse">
            <div className="relative inline-flex">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/10 animate-ping" />
              <div className="relative rounded-full border border-emerald-500/30 p-4 bg-slate-950/80 shadow-2xl">
                <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-white font-extrabold text-[10px] tracking-widest uppercase font-mono">Consuming Nexus Registries</h2>
              <p className="text-xs text-gray-500 font-mono leading-relaxed">
                Loading secure high-contrast career database telemetry files...
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!remoteShareData) {
      return (
        <div className="min-h-screen bg-[#07080b] flex flex-col justify-center items-center font-sans select-none relative overflow-hidden" id="nexus-share-error">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] bg-red-500/10 pointer-events-none" />
          <div className="z-10 text-center space-y-6 max-w-sm px-6">
            <div className="relative inline-flex">
              <div className="relative rounded-full border border-red-500/30 p-4 bg-slate-950/80 shadow-2xl">
                <AlertTriangle className="w-8 h-8 text-red-400 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-white font-extrabold text-xs tracking-widest uppercase font-mono">Registry Retrieval Error</h2>
              <p className="text-xs text-gray-400 font-mono leading-relaxed bg-slate-950/60 p-3.5 border border-slate-900 rounded-xl">
                The network was unable to pull secure resume telemetry files from cloud databases.
              </p>
            </div>
            <button 
              type="button"
              onClick={() => {
                setLoadingRemoteShare(true);
              }}
              className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer select-none bg-slate-900 border border-slate-800 py-1.5 px-4 rounded-xl mx-auto active:scale-95"
            >
              <span>Retry Sync</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <PublicPortfolioView 
        profile={remoteShareData.profile}
        skills={remoteShareData.skills}
        experience={remoteShareData.experience}
        certifications={remoteShareData.certifications}
        projects={remoteShareData.projects}
        education={remoteShareData.education}
        achievements={remoteShareData.achievements}
        testimonials={remoteShareData.testimonials}
        links={remoteShareData.links}
        documents={remoteShareData.documents || documents}
        calendarEvents={remoteShareData.calendarEvents || []}
        currentJob={remoteShareData.currentJob || currentJob}
        onGoToConsole={() => {
          window.history.replaceState(null, '', window.location.pathname + '#overview');
          setActiveTab('overview');
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <div className="relative">
        <AuthPage onLoginSuccess={handleUserLogin} triggerToast={triggerToast} />
        {/* Render persistent toast for auth feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-[#0d0e12] border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2 z-50 shadow-xl animate-fade-in" id="nexus-auth-toast">
            <span className="font-sans font-semibold text-gray-200">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Clean Sidebar items rendering configuration
  const sidebarItems = [
    { id: 'overview', label: 'Home Page', icon: Home },
    { id: 'profile', label: 'Personal Profile', icon: User },
    { id: 'skills', label: 'Skills', icon: Cpu },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'current-job', label: 'Current Job', icon: Laptop },
    { id: 'projects', label: 'Projects & Products', icon: Rocket },
    { id: 'resume', label: 'Resume / CV', icon: FileText },
    { id: 'portfolios', label: 'Portfolios & Links', icon: Link2 },
    { id: 'timeline', label: 'Career Timeline', icon: GitBranch },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'achievements', label: 'Achievements & Awards', icon: Star },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
    { id: 'vault', label: 'Document Vault', icon: FolderLock },
    { id: 'notepad', label: 'Note Pad', icon: StickyNote }
  ];

  const getActiveTabBreadcrumb = () => {
    const matched = sidebarItems.find(item => item.id === activeTab);
    return matched ? matched.label : 'Home Page';
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-gray-300 flex flex-col md:flex-row font-sans relative antialiased" id="nexus-crm-shell">
      
      {/* 1. CYBER NAVIGATION SIDEBAR (Desktop) */}
      <aside className="w-64 bg-[#0a0b0d] border-r border-slate-900 flex-col hidden md:flex shrink-0 z-10 select-none">
        
        {/* Sidebar Brand header */}
        <div className="p-6 border-b border-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl border border-emerald-500/25">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-sm tracking-tight text-white leading-none">MyDocVault</h1>
              <span className="text-[9px] text-gray-500 font-mono tracking-wider font-semibold">Personal Document Saver</span>
            </div>
          </div>
        </div>

        {/* Navigation Sidebar links */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1 custom-scrollbar text-xs">
          {sidebarItems.map(nav => {
            const Icon = nav.icon;
            const isActive = activeTab === nav.id;

            return (
              <button
                key={nav.id}
                id={`sidebar-nav-${nav.id}`}
                onClick={() => setActiveTab(nav.id)}
                className={`w-full flex items-center gap-3.5 py-2.5 px-3 rounded-xl transition duration-150 font-semibold cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900/80 text-emerald-400 font-bold border border-slate-800/60' 
                    : 'text-gray-400 hover:text-white hover:bg-slate-900/20'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span className="truncate">{nav.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Settings Option at absolute bottom */}
        <div className="p-4 border-t border-slate-900/80 bg-slate-950/20 space-y-1.5">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3.5 py-2.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition ${
              activeTab === 'settings' 
                ? 'bg-slate-900/80 text-emerald-400 font-bold border border-slate-800/60' 
                : 'text-gray-400 hover:text-white hover:bg-slate-900/20'
            }`}
          >
            <Settings className="w-4 h-4 text-gray-500 shrink-0" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => {
              setConfirmDialog({
                title: "Confirm Sign Out",
                message: "Are you sure you want to log out of MyDocVault? Your details will be securely preserved.",
                onConfirm: () => {
                  handleUserLogout();
                  setConfirmDialog(null);
                  triggerToast("Logged out successfully.");
                }
              });
            }}
            className="w-full flex items-center gap-3.5 py-2.5 px-3 rounded-xl text-xs font-semibold text-rose-450 hover:text-rose-450 hover:bg-rose-950/20 cursor-pointer transition"
          >
            <LogOut className="w-4 h-4 text-gray-500 shrink-0" />
            <span>Logout</span>
          </button>
        </div>

      </aside>

      {/* 2. MOBILE TOP HEADER */}
      <header className="md:hidden bg-[#0a0b0d] text-white border-b border-slate-900 px-4 py-3 flex items-center justify-between z-30 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded-lg border border-emerald-500/20">
            <Sparkles className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-xs tracking-tight text-white leading-none">MyDocVault</h1>
            <span className="text-[8px] text-gray-500 font-mono tracking-wider font-semibold">Personal Document Saver</span>
          </div>
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg hover:bg-slate-900 border border-slate-850/80 text-gray-300 transition shrink-0"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </header>

      {/* MOBILE EXPANDED MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-[52px] bg-[#0a0b0d] border-b border-slate-900 z-20 flex flex-col p-4 max-h-[80vh] overflow-y-auto space-y-1.5 shadow-2xl md:hidden">
          {sidebarItems.map(nav => {
            const Icon = nav.icon;
            const isActive = activeTab === nav.id;

            return (
              <button
                key={nav.id}
                onClick={() => {
                  setActiveTab(nav.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg transition text-xs font-semibold cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-emerald-400 font-bold' 
                    : 'text-gray-400 hover:text-white hover:bg-slate-900/20'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{nav.label}</span>
              </button>
            );
          })}
          
          <div className="border-t border-slate-900 pt-3 mt-2 space-y-1">
            <button
              onClick={() => {
                setActiveTab('settings');
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 py-2 px-3 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-slate-900/20 cursor-pointer"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => {
                setConfirmDialog({
                  title: "Confirm Sign Out",
                  message: "Are you sure you want to log out? Your details will be safely preserved.",
                  onConfirm: () => {
                    handleUserLogout();
                    setIsMobileMenuOpen(false);
                    setConfirmDialog(null);
                    triggerToast("Logged out successfully.");
                  }
                });
              }}
              className="w-full flex items-center gap-3 py-2 px-3 rounded-lg text-xs font-semibold text-rose-450 hover:text-rose-400 hover:bg-rose-950/20 cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN PANE CONTENT LAYER */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#08090d]">
        
        {/* Navigation Breadcrumbs & Top details header (exactly matches user profile section in screenshot) */}
        <header className="bg-[#0a0b0d] border-b border-slate-900 hidden md:flex items-center justify-between px-8 py-3.5 shadow-sm select-none z-10">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-mono text-xs">Breadcrumb:</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wide">
              <span>🏠</span>
              <span>Home Page</span>
              <span className="text-gray-650 font-normal">/</span>
              <span className="text-emerald-400">{getActiveTabBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 font-sans">
            <button
              onClick={() => {
                const shareUrl = getFullShareUrl();
                navigator.clipboard.writeText(shareUrl);
                triggerToast("Public profile link copied!");
              }}
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-gray-300 hover:text-white transition py-1 px-3 rounded-xl text-[10px] font-semibold cursor-pointer active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copy Public Link</span>
            </button>

            <div className="flex items-center gap-1 bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-0.5" />
              Operational cloud synced
            </div>
            
            {/* User profile detail block as seen in top right of screenshot */}
            <div className="flex items-center gap-2.5 border-l border-slate-900 pl-4">
              <div className="text-right max-w-[150px]">
                <p className="font-bold text-white text-[11px] truncate leading-none" title={profile.name || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email || 'User'}>
                  {profile.name || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[9px] text-gray-400 font-mono truncate mt-0.5 font-medium max-w-[135px]" title={currentUser?.email || profile.email || 'user@example.com'}>
                  {currentUser?.email || profile.email || 'user@example.com'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 font-bold flex items-center justify-center text-emerald-400 select-none shrink-0 text-xs">
                {getAvatarInitials(profile)}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic State tab routing area */}
        <div className="p-4 sm:p-6 md:p-8 flex-1 max-w-6xl w-full mx-auto overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab 
              profile={profile}
              skills={skills}
              experience={experience}
              certifications={certifications}
              contacts={contacts}
              currentJob={currentJob}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab 
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              shareUrl={getFullShareUrl()}
            />
          )}

          {activeTab === 'skills' && (
            <SkillsTab 
              skills={skills}
              onAddSkill={handleAddSkill}
              onUpdateSkill={handleUpdateSkill}
              onDeleteSkill={handleDeleteSkill}
            />
          )}

          {activeTab === 'education' && (
            <EducationTab 
              education={education}
              onAddEducation={handleAddEdu}
              onDeleteEducation={handleDeleteEdu}
              onUpdateEducation={handleUpdateEdu}
            />
          )}

          {activeTab === 'certifications' && (
            <CertificationsTab 
              certifications={certifications}
              onAddCertification={handleAddCert}
              onDeleteCertification={handleDeleteCert}
              onUpdateCertification={handleUpdateCert}
            />
          )}

          {activeTab === 'experience' && (
            <ExperienceTab 
              experience={experience}
              onAddExperience={handleAddExp}
              onDeleteExperience={handleDeleteExp}
            />
          )}

          {activeTab === 'current-job' && (
            <CurrentJobTab 
              currentJob={currentJob}
              onUpdateCurrentJob={handleUpdateCurrentJob}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsTab 
              projects={projects}
              products={products}
              others={others}
              onAddProject={handleAddProj}
              onDeleteProject={handleDeleteProj}
              onUpdateProject={handleUpdateProj}
            />
          )}

          {activeTab === 'resume' && (
            <ResumeTab 
              profile={profile}
              skills={skills}
              education={education}
              certifications={certifications}
              experience={experience}
              links={resumeLinks}
              onAddLink={handleAddResumeLink}
              onDeleteLink={handleDeleteResumeLink}
              onUpdateLink={handleUpdateResumeLink}
              resumes={resumes}
              onUpdateResumes={handleUpdateResumes}
            />
          )}

          {activeTab === 'portfolios' && (
            <PortfoliosTab 
              links={links}
              onAddLink={handleAddLink}
              onDeleteLink={handleDeleteLink}
              onUpdateLink={handleUpdateLink}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineTab 
              milestones={milestones}
              onAddMilestone={handleAddMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              experience={experience}
              currentJob={currentJob}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsTab 
              contacts={contacts}
              onAddContact={handleAddContact}
              onDeleteContact={handleDeleteContact}
              onUpdateContact={handleUpdateContact}
              onAddInteraction={handleAddInteraction}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarTab 
              events={calendarEvents}
              userEmail={profile.email}
              onAddEvent={handleAddCalendarEvent}
              onUpdateEvent={handleUpdateCalendarEvent}
              onDeleteEvent={handleDeleteCalendarEvent}
            />
          )}

          {activeTab === 'achievements' && (
            <AchievementsTab 
              achievements={achievements}
              onAddAchievement={handleAddAchievement}
              onDeleteAchievement={handleDeleteAchievement}
              onUpdateAchievement={handleUpdateAchievement}
            />
          )}

          {activeTab === 'testimonials' && (
            <TestimonialsTab 
              testimonials={testimonials}
              onAddTestimonial={handleAddTestimonial}
              onDeleteTestimonial={handleDeleteTestimonial}
            />
          )}

          {activeTab === 'vault' && (
            <DocumentVaultTab 
              documents={documents}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
              onUpdateDocument={handleUpdateDocument}
            />
          )}

          {activeTab === 'notepad' && (
            <NotepadTab 
              currentUserEmail={currentUser?.email}
              triggerToast={triggerToast}
              notes={notes}
              onUpdateNotes={handleUpdateNotes}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab 
              onRestoreDefaults={handleRestoreDefaults}
              onWipeData={handleWipeData}
            />
          )}
        </div>

      </main>

      {/* 4. NOTIFICATION MARGIN TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white py-3 px-5 rounded-2xl shadow-xl flex items-center justify-between gap-4 max-w-sm font-sans select-none animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0 animate-pulse" />
            <p className="text-xs font-semibold leading-normal">{toastMessage}</p>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG MODAL (Iframe Safe) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" id="nexus-confirm-overlay">
          <div className="bg-[#0e1014] border border-slate-850 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">{confirmDialog.title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/10"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
