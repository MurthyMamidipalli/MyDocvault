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
  AlertTriangle,
  CreditCard,
  Layers,
  Target,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { 
  PersonalProfile, 
  Skill, 
  Education, 
  Specialization,
  Certification, 
  Experience, 
  DeletedItem, 
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
  formatSlugToName,
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
  toUUID,
  isDemoId,
  isDemoTitle,
  isDemoItem
} from './types';

// Tab Components
import OverviewTab from './components/OverviewTab';
import ProfileTab from './components/ProfileTab';
import SkillsTab from './components/SkillsTab';
import EducationTab from './components/EducationTab';
import SpecializationTab from './components/SpecializationTab';
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
import DigitalVisitingCardTab from './components/DigitalVisitingCardTab';
import PublicPortfolioView from './components/PublicPortfolioView';
import AuthPage from './components/AuthPage';
import { heavyStorage } from './lib/heavyStorage';
import { handleOAuthCallback } from './lib/googleDrive';
import { supabase, STORAGE_BUCKETS, uploadFileToSupabaseStorage } from './lib/supabase';


// ==========================================
// UNIFIED DEDUPLICATION UTILITIES ACROSS ALL ENTITIES
// ==========================================
const checkIsUserLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('nexus_current_user');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && (parsed.email || parsed.id));
  } catch (e) {
    return false;
  }
};

export const deduplicateCertifications = (items?: Certification[]): Certification[] => {
  if (!items || !Array.isArray(items)) return [];
  const isUserLoggedIn = checkIsUserLoggedIn();
  const result: Certification[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    if (!item) continue;
    if (isUserLoggedIn && isDemoItem(item)) continue;

    const rawId = (item.id || '').trim();
    const idKey = rawId ? toUUID(rawId) : '';

    let matchIdx = -1;
    if (idKey && seenIds.has(idKey)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (rawId && seenIds.has(`raw:${rawId}`)) {
      matchIdx = result.findIndex(r => r.id === rawId);
    }

    if (matchIdx >= 0) {
      const existing = result[matchIdx];
      result[matchIdx] = {
        ...existing,
        ...item,
        id: existing.id || item.id,
        fileUrl: item.fileUrl || existing.fileUrl || '',
        fileName: item.fileName || existing.fileName || '',
        credentialId: item.credentialId || existing.credentialId || '',
        credentialUrl: item.credentialUrl || existing.credentialUrl || '',
        dateIssued: item.dateIssued || item.issueDate || existing.dateIssued || existing.issueDate || '',
        issueDate: item.issueDate || item.dateIssued || existing.issueDate || existing.dateIssued || '',
        percentage: item.percentage || existing.percentage || '',
        description: item.description || existing.description || '',
        type: item.type || existing.type || 'study'
      };
    } else {
      if (idKey) seenIds.add(idKey);
      if (rawId) seenIds.add(`raw:${rawId}`);
      result.push(item);
    }
  }
  return result;
};

export const deduplicateEducation = (items?: Education[]): Education[] => {
  if (!items || !Array.isArray(items)) return [];
  const isUserLoggedIn = checkIsUserLoggedIn();
  const result: Education[] = [];
  const seenKeys = new Set<string>();

  const normalizeDegree = (deg?: string): string => {
    const d = (deg || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (d.includes('btech') || d.includes('bachelor') || d.includes('be')) return 'btech';
    if (d.includes('mba') || d.includes('master') || d.includes('pg')) return 'mba';
    if (d.includes('inter') || d.includes('12th') || d.includes('plus2') || d.includes('mpc')) return 'intermediate';
    if (d.includes('school') || d.includes('ssc') || d.includes('10th') || d.includes('matric')) return 'schooling';
    return d;
  };

  for (const item of items) {
    if (!item) continue;
    if (isUserLoggedIn && isDemoItem(item)) continue;

    const normDeg = normalizeDegree(item.degree);
    const idKey = item.id ? toUUID(item.id) : '';

    let matchIdx = -1;
    if (idKey && seenKeys.has(`id:${idKey}`)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (normDeg && seenKeys.has(`deg:${normDeg}`)) {
      matchIdx = result.findIndex(r => normalizeDegree(r.degree) === normDeg);
    }

    if (matchIdx >= 0) {
      const existing = result[matchIdx];
      result[matchIdx] = {
        ...existing,
        ...item,
        id: existing.id || item.id,
        degree: item.degree || existing.degree,
        institution: item.institution || existing.institution,
        fieldOfStudy: item.fieldOfStudy || existing.fieldOfStudy || '',
        startYear: item.startYear || existing.startYear || '',
        endYear: item.endYear || existing.endYear || '',
        enrollmentId: item.enrollmentId || existing.enrollmentId || '',
        startDate: item.startDate || existing.startDate || '',
        endDate: item.endDate || existing.endDate || '',
        grade: item.grade || existing.grade || '',
        percentage: item.percentage || existing.percentage || '',
        activities: item.activities || existing.activities || '',
        specialization: item.specialization || existing.specialization || '',
        description: item.description || existing.description || ''
      };
    } else {
      if (idKey) seenKeys.add(`id:${idKey}`);
      if (normDeg) seenKeys.add(`deg:${normDeg}`);
      result.push(item);
    }
  }
  return result;
};

export const deduplicateSpecializations = (items?: Specialization[]): Specialization[] => {
  if (!items || !Array.isArray(items)) return [];
  const result: Specialization[] = [];
  const seenKeys = new Set<string>();

  for (const item of items) {
    if (!item || !item.name) continue;
    const normName = item.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const idKey = item.id ? toUUID(item.id) : '';

    let matchIdx = -1;
    if (idKey && seenKeys.has(`id:${idKey}`)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (normName && seenKeys.has(`name:${normName}`)) {
      matchIdx = result.findIndex(r => (r.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normName);
    }

    if (matchIdx >= 0) {
      result[matchIdx] = {
        ...result[matchIdx],
        ...item,
        id: result[matchIdx].id || item.id,
        name: item.name || result[matchIdx].name
      };
    } else {
      if (idKey) seenKeys.add(`id:${idKey}`);
      if (normName) seenKeys.add(`name:${normName}`);
      result.push(item);
    }
  }
  return result;
};

export const deduplicateSkills = (items?: Skill[]): Skill[] => {
  if (!items || !Array.isArray(items)) return [];
  const isUserLoggedIn = checkIsUserLoggedIn();
  const result: Skill[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (!item || !item.name) continue;
    if (isUserLoggedIn && isDemoItem(item)) continue;

    const nameKey = item.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const idKey = item.id ? toUUID(item.id) : '';

    let matchIdx = -1;
    if (idKey && seen.has(`id:${idKey}`)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (nameKey && seen.has(`name:${nameKey}`)) {
      matchIdx = result.findIndex(r => (r.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') === nameKey);
    }

    if (matchIdx >= 0) {
      const existing = result[matchIdx];
      result[matchIdx] = {
        ...existing,
        ...item,
        id: existing.id || item.id,
        yearsOfExp: item.yearsOfExp !== undefined ? item.yearsOfExp : existing.yearsOfExp,
        endorsements: item.endorsements !== undefined ? item.endorsements : existing.endorsements,
        description: item.description || existing.description,
        proficiency: item.proficiency || existing.proficiency
      };
    } else {
      if (idKey) seen.add(`id:${idKey}`);
      if (nameKey) seen.add(`name:${nameKey}`);
      result.push(item);
    }
  }
  return result;
};

export const deduplicateExperience = (items?: Experience[]): Experience[] => {
  if (!items || !Array.isArray(items)) return [];
  const isUserLoggedIn = checkIsUserLoggedIn();
  const result: Experience[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (!item) continue;
    if (isUserLoggedIn && isDemoItem(item)) continue;

    const roleKey = (item.role || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const compKey = (item.company || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const idKey = item.id ? toUUID(item.id) : '';
    const contentKey = `${compKey}__${roleKey}`;

    let matchIdx = -1;
    if (idKey && seen.has(`id:${idKey}`)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (compKey && seen.has(contentKey)) {
      matchIdx = result.findIndex(r => {
        const rComp = (r.company || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const rRole = (r.role || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return rComp === compKey && (rRole === roleKey || !roleKey || !rRole);
      });
    }

    if (matchIdx >= 0) {
      result[matchIdx] = { ...result[matchIdx], ...item, id: result[matchIdx].id || item.id };
    } else {
      if (idKey) seen.add(`id:${idKey}`);
      if (compKey) seen.add(contentKey);
      result.push(item);
    }
  }
  return result;
};

export const deduplicateProjects = (items?: Project[]): Project[] => {
  if (!items || !Array.isArray(items)) return [];
  const isUserLoggedIn = checkIsUserLoggedIn();
  const result: Project[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    if (!item) continue;
    if (isUserLoggedIn && isDemoItem(item)) continue;

    const rawId = (item.id || '').trim();
    const idKey = rawId ? toUUID(rawId) : '';

    let matchIdx = -1;
    if (idKey && seenIds.has(idKey)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (rawId && seenIds.has(`raw:${rawId}`)) {
      matchIdx = result.findIndex(r => r.id === rawId);
    }

    if (matchIdx >= 0) {
      const existing = result[matchIdx];
      result[matchIdx] = {
        ...existing,
        ...item,
        id: existing.id || item.id,
        pdfUrl: item.pdfUrl || existing.pdfUrl,
        imageUrl: item.imageUrl || existing.imageUrl,
        highlights: (item.highlights && item.highlights.length > 0) ? item.highlights : existing.highlights,
        techStack: (item.techStack && item.techStack.length > 0) ? item.techStack : existing.techStack
      };
    } else {
      if (idKey) seenIds.add(idKey);
      if (rawId) seenIds.add(`raw:${rawId}`);
      result.push(item);
    }
  }
  return result;
};

export const deduplicateContacts = (items?: Contact[]): Contact[] => {
  if (!items || !Array.isArray(items)) return [];
  const isUserLoggedIn = checkIsUserLoggedIn();
  const result: Contact[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    if (!item) continue;
    if (isUserLoggedIn && isDemoItem(item)) continue;

    const rawId = (item.id || '').trim();
    const idKey = rawId ? toUUID(rawId) : '';

    let matchIdx = -1;
    if (idKey && seenIds.has(idKey)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (rawId && seenIds.has(`raw:${rawId}`)) {
      matchIdx = result.findIndex(r => r.id === rawId);
    }

    if (matchIdx >= 0) {
      result[matchIdx] = { ...result[matchIdx], ...item, id: result[matchIdx].id || item.id };
    } else {
      if (idKey) seenIds.add(idKey);
      if (rawId) seenIds.add(`raw:${rawId}`);
      result.push(item);
    }
  }
  return result;
};

export const deduplicateCalendarEvents = (items?: CalendarEvent[]): CalendarEvent[] => {
  if (!items || !Array.isArray(items)) return [];
  const isUserLoggedIn = checkIsUserLoggedIn();
  const result: CalendarEvent[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (!item) continue;
    if (isUserLoggedIn && isDemoItem(item)) continue;

    const idKey = item.id ? toUUID(item.id) : '';
    const titleKey = (item.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const dateKey = (item.date || '').trim();
    const timeKey = (item.startTime || '').trim();
    const contentKey = `${titleKey}__${dateKey}__${timeKey}`;

    let matchIdx = -1;
    if (idKey && seen.has(`id:${idKey}`)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (titleKey && dateKey && seen.has(contentKey)) {
      matchIdx = result.findIndex(r => {
        const rTitle = (r.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const rDate = (r.date || '').trim();
        const rTime = (r.startTime || '').trim();
        return rTitle === titleKey && rDate === dateKey && rTime === timeKey;
      });
    }

    if (matchIdx >= 0) {
      result[matchIdx] = { ...result[matchIdx], ...item, id: result[matchIdx].id || item.id };
    } else {
      if (idKey) seen.add(`id:${idKey}`);
      if (titleKey && dateKey) seen.add(contentKey);
      result.push(item);
    }
  }
  return result;
};

export const deduplicateNotes = (items?: NotepadNote[]): NotepadNote[] => {
  if (!items || !Array.isArray(items)) return [];
  const result: NotepadNote[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    if (!item) continue;
    const rawId = (item.id || '').trim();
    const idKey = rawId ? toUUID(rawId) : '';

    let matchIdx = -1;
    if (idKey && seenIds.has(idKey)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (rawId && seenIds.has(`raw:${rawId}`)) {
      matchIdx = result.findIndex(r => r.id === rawId);
    }

    if (matchIdx >= 0) {
      const existing = result[matchIdx];
      result[matchIdx] = {
        ...existing,
        ...item,
        id: existing.id || item.id,
        content: (item.content || '').length >= (existing.content || '').length ? item.content : existing.content,
        title: item.title || existing.title,
        isPinned: item.isPinned !== undefined ? item.isPinned : existing.isPinned,
        type: item.type || existing.type,
        completed: item.completed !== undefined ? item.completed : existing.completed
      };
    } else {
      if (idKey) seenIds.add(idKey);
      if (rawId) seenIds.add(`raw:${rawId}`);
      result.push(item);
    }
  }
  return result;
};

export const deduplicateResumes = (items?: ResumeItem[]): ResumeItem[] => {
  if (!items || !Array.isArray(items)) return [];
  const isUserLoggedIn = checkIsUserLoggedIn();
  const result: ResumeItem[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    if (!item) continue;
    if (isUserLoggedIn && isDemoItem(item)) continue;

    const rawId = (item.id || '').trim();
    const idKey = rawId ? toUUID(rawId) : '';

    let matchIdx = -1;
    if (idKey && seenIds.has(idKey)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (rawId && seenIds.has(`raw:${rawId}`)) {
      matchIdx = result.findIndex(r => r.id === rawId);
    }

    if (matchIdx >= 0) {
      result[matchIdx] = { ...result[matchIdx], ...item, id: result[matchIdx].id || item.id };
    } else {
      if (idKey) seenIds.add(idKey);
      if (rawId) seenIds.add(`raw:${rawId}`);
      result.push(item);
    }
  }
  return result;
};

export const normalizeLinkUrl = (u?: string): string => {
  if (!u) return '';
  return u.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
};

export const deduplicateLinks = (items?: PortfolioLink[]): PortfolioLink[] => {
  if (!items || !Array.isArray(items)) return [];
  const isUserLoggedIn = checkIsUserLoggedIn();
  const result: PortfolioLink[] = [];
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();

  for (const item of items) {
    if (!item) continue;
    if (isUserLoggedIn && isDemoItem(item)) continue;

    const rawId = (item.id || '').trim();
    const idKey = rawId ? toUUID(rawId) : '';
    const normUrl = normalizeLinkUrl(item.url);

    let matchIdx = -1;
    if (idKey && seenIds.has(idKey)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (rawId && seenIds.has(`raw:${rawId}`)) {
      matchIdx = result.findIndex(r => r.id === rawId);
    } else if (normUrl && seenUrls.has(normUrl)) {
      matchIdx = result.findIndex(r => normalizeLinkUrl(r.url) === normUrl);
    }

    if (matchIdx >= 0) {
      const existing = result[matchIdx];
      const bestId = (existing.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existing.id))
        ? existing.id
        : (item.id || existing.id);

      result[matchIdx] = {
        ...existing,
        ...item,
        id: bestId,
        label: existing.label || item.label || existing.platform || item.platform || 'Link',
        platform: existing.platform || item.platform || 'Link',
        url: existing.url || item.url,
        isPublic: existing.isPublic !== false && item.isPublic !== false
      };
    } else {
      if (idKey) seenIds.add(idKey);
      if (rawId) seenIds.add(`raw:${rawId}`);
      if (normUrl) seenUrls.add(normUrl);
      result.push(item);
    }
  }
  return result;
};

export const deduplicateMilestones = (items?: TimelineMilestone[]): TimelineMilestone[] => {
  if (!items || !Array.isArray(items)) return [];
  const isUserLoggedIn = checkIsUserLoggedIn();
  const result: TimelineMilestone[] = [];
  const seenKeys = new Set<string>();

  const getMilestoneKeys = (m: TimelineMilestone): string[] => {
    const keys: string[] = [];
    const rawTitle = (m.title || '').toLowerCase()
      .replace(/\(active engagement\)/gi, '')
      .replace(/\(current job engagement\)/gi, '')
      .replace(/\(score\/grade:[^)]*\)/gi, '')
      .replace(/\(score:[^)]*\)/gi, '')
      .trim();

    const alphaTitle = rawTitle.replace(/[^a-z0-9]/g, '');
    const yearMatch = (m.date || '').match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : '';

    if (m.id) {
      keys.push(`id_${toUUID(m.id)}`);
      keys.push(`rawid_${m.id}`);
    }

    if (rawTitle.includes(' at ')) {
      const parts = rawTitle.split(' at ');
      if (parts.length >= 2) {
        const roleOrDegree = parts[0].replace(/[^a-z0-9]/g, '');
        const companyOrInst = parts[1].replace(/[^a-z0-9]/g, '');
        if (roleOrDegree && companyOrInst) {
          keys.push(`pair_${roleOrDegree}_${companyOrInst}`);
          if (year) {
            keys.push(`pair_yr_${year}_${roleOrDegree}_${companyOrInst}`);
          }
        }
      }
    }

    if (alphaTitle) {
      if (year) {
        keys.push(`yr_title_${year}_${alphaTitle}`);
      }
      keys.push(`title_${alphaTitle}`);
    }

    return keys;
  };

  for (const item of items) {
    if (!item) continue;
    if (isUserLoggedIn && (isDemoItem(item) || isDemoId(item.id) || isDemoTitle(item.title))) continue;

    const keys = getMilestoneKeys(item);
    const matchIdx = result.findIndex(r => {
      const rKeys = getMilestoneKeys(r);
      return keys.some(k => rKeys.includes(k));
    });

    if (matchIdx >= 0) {
      const existing = result[matchIdx];
      const hasRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
      result[matchIdx] = {
        ...existing,
        ...item,
        id: hasRealUuid ? item.id : (existing.id || item.id),
        description: (item.description || '').length > (existing.description || '').length ? item.description : existing.description,
        intensity: item.intensity || existing.intensity
      };
      keys.forEach(k => seenKeys.add(k));
    } else {
      keys.forEach(k => seenKeys.add(k));
      result.push(item);
    }
  }
  return result;
};

export const deduplicateAchievements = (items?: Achievement[]): Achievement[] => {
  if (!items || !Array.isArray(items)) return [];
  const isUserLoggedIn = checkIsUserLoggedIn();
  const result: Achievement[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (!item) continue;
    if (isUserLoggedIn && isDemoItem(item)) continue;

    const idKey = item.id ? toUUID(item.id) : '';
    const cleanTitle = (item.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanIssuer = (item.issuer || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const contentKey = `${cleanTitle}__${cleanIssuer}`;

    let matchIdx = -1;
    if (idKey && seen.has(`id:${idKey}`)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (cleanTitle && seen.has(contentKey)) {
      matchIdx = result.findIndex(r => {
        const rTitle = (r.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const rIssuer = (r.issuer || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return rTitle === cleanTitle && (!cleanIssuer || !rIssuer || cleanIssuer === rIssuer);
      });
    }

    if (matchIdx >= 0) {
      result[matchIdx] = { ...result[matchIdx], ...item, id: result[matchIdx].id || item.id };
    } else {
      if (idKey) seen.add(`id:${idKey}`);
      if (cleanTitle) seen.add(contentKey);
      result.push(item);
    }
  }
  return result;
};

export const deduplicateTestimonials = (items?: Testimonial[]): Testimonial[] => {
  if (!items || !Array.isArray(items)) return [];
  const isUserLoggedIn = checkIsUserLoggedIn();
  const result: Testimonial[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (!item) continue;
    if (isUserLoggedIn && isDemoItem(item)) continue;

    const idKey = item.id ? toUUID(item.id) : '';
    const cleanName = (item.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanComp = (item.company || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const contentKey = `${cleanName}__${cleanComp}`;

    let matchIdx = -1;
    if (idKey && seen.has(`id:${idKey}`)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (cleanName && seen.has(contentKey)) {
      matchIdx = result.findIndex(r => {
        const rName = (r.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const rComp = (r.company || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return rName === cleanName && (!cleanComp || !rComp || cleanComp === rComp);
      });
    }

    if (matchIdx >= 0) {
      result[matchIdx] = { ...result[matchIdx], ...item, id: result[matchIdx].id || item.id };
    } else {
      if (idKey) seen.add(`id:${idKey}`);
      if (cleanName) seen.add(contentKey);
      result.push(item);
    }
  }
  return result;
};

export const deduplicateDocuments = (items?: VaultDocument[]): VaultDocument[] => {
  if (!items || !Array.isArray(items)) return [];
  const isUserLoggedIn = checkIsUserLoggedIn();
  const result: VaultDocument[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (!item) continue;
    if (isUserLoggedIn && isDemoItem(item)) continue;

    const idKey = item.id ? toUUID(item.id) : '';
    const nameKey = (item.fileName || item.name || item.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    let matchIdx = -1;
    if (idKey && seen.has(`id:${idKey}`)) {
      matchIdx = result.findIndex(r => r.id && toUUID(r.id) === idKey);
    } else if (nameKey && seen.has(`name:${nameKey}`)) {
      matchIdx = result.findIndex(r => {
        const rName = (r.fileName || r.name || r.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return rName === nameKey;
      });
    }

    if (matchIdx >= 0) {
      result[matchIdx] = { ...result[matchIdx], ...item, id: result[matchIdx].id || item.id };
    } else {
      if (idKey) seen.add(`id:${idKey}`);
      if (nameKey) seen.add(`name:${nameKey}`);
      result.push(item);
    }
  }
  return result;
};

export const parseFileSizeToBytes = (sizeVal?: string | number): number => {
  if (typeof sizeVal === 'number') return Math.round(sizeVal);
  if (!sizeVal) return 0;
  const str = String(sizeVal).trim();
  const match = str.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);
  if (!match) {
    const num = parseInt(str.replace(/[^\d]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  if (unit === 'KB') return Math.round(val * 1024);
  if (unit === 'MB') return Math.round(val * 1024 * 1024);
  if (unit === 'GB') return Math.round(val * 1024 * 1024 * 1024);
  return Math.round(val);
};

export default function App() {
  
  // Helper to merge array records by ID or unique key without dropping any records
  const mergeArrayRecords = <T extends { id?: string; name?: string; title?: string }>(incoming?: T[], existing?: T[]): T[] => {
    const inc = Array.isArray(incoming) ? incoming : [];
    const ext = Array.isArray(existing) ? existing : [];
    if (inc.length === 0) return ext;
    if (ext.length === 0) return inc;

    const map = new Map<string, T>();
    // First keep existing records
    for (const item of ext) {
      const key = item.id || (item.name ? item.name.toLowerCase().trim() : (item.title ? item.title.toLowerCase().trim() : `item_${Math.random()}`));
      map.set(key, item);
    }
    // Then merge/update incoming records
    for (const item of inc) {
      const key = item.id || (item.name ? item.name.toLowerCase().trim() : (item.title ? item.title.toLowerCase().trim() : `item_${Math.random()}`));
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
        const email = parsed?.email?.toLowerCase()?.trim() || null;
        if (email && email.includes('urthymamidipalli@gmail.com')) {
          return 'ramachandramurthymamidipalli@gmail.com';
        }
        return email;
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
          if (Array.isArray(parsed)) return deduplicateSkills(parsed);
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
          if (Array.isArray(parsed)) return deduplicateEducation(parsed);
        } catch (e) {}
      }
    }
    return [];
  });

  const [specializations, setSpecializations] = useState<Specialization[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_specializations`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return deduplicateSpecializations(parsed);
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
          if (Array.isArray(parsed)) return deduplicateCertifications(parsed);
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
          if (Array.isArray(parsed)) return deduplicateExperience(parsed);
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
          if (parsed) return { ...EMPTY_CURRENT_JOB, ...parsed };
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
          if (Array.isArray(parsed)) return deduplicateProjects(parsed);
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
          if (Array.isArray(parsed)) return deduplicateProjects(parsed);
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
          if (Array.isArray(parsed)) return deduplicateProjects(parsed);
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
          if (Array.isArray(parsed)) return deduplicateLinks(parsed);
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
          if (Array.isArray(parsed)) return deduplicateLinks(parsed);
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
          if (Array.isArray(parsed)) return deduplicateMilestones(parsed);
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
          if (Array.isArray(parsed)) return deduplicateContacts(parsed);
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
          if (Array.isArray(parsed)) return deduplicateAchievements(parsed);
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
          if (Array.isArray(parsed)) return deduplicateTestimonials(parsed);
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
          if (Array.isArray(parsed)) return deduplicateDocuments(parsed);
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
          if (Array.isArray(parsed)) return deduplicateCalendarEvents(parsed);
        } catch (e) {}
      }
    }
    return [];
  });

  const [notes, setNotes] = useState<NotepadNote[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_notepad_notes`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return deduplicateNotes(parsed);
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
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const sanitized = parsed.filter((r: any) => {
              if (!r) return false;
              if (r.fileName === 'Simulated_Document.pdf') return false;
              const nameLower = (r.name || r.fileName || '').toLowerCase();
              return !nameLower.includes('simulated') && !nameLower.includes('ai-generated');
            }).map((r: any) => ({
              ...r,
              fileUrl: (r.fileUrl && !r.fileUrl.includes('example.com')) ? r.fileUrl : '',
              fileDataUrl: (r.fileDataUrl && !r.fileDataUrl.includes('example.com')) ? r.fileDataUrl : ''
            }));
            return deduplicateResumes(sanitized);
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const [oldData, setOldData] = useState<DeletedItem[]>(() => {
    const email = getCurrentUserEmail();
    if (email) {
      const saved = localStorage.getItem(`${email}_old_data`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const now = Date.now();
            return parsed.filter((item: any) => item && item.expiresAt && new Date(item.expiresAt).getTime() > now);
          }
        } catch (e) {}
      }
    }
    return [];
  });

  const VALID_APP_TABS = [
    'overview', 'profile', 'skills', 'education', 'certifications', 'experience',
    'current-job', 'projects', 'resume', 'portfolios', 'timeline', 'contacts',
    'calendar', 'achievements', 'testimonials', 'vault', 'notepad', 'digital-visiting-card', 'settings'
  ];

  // Active navigation sidebar link with persistence
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      // If user is not logged in, always start at overview (Home Page)
      const user = localStorage.getItem('nexus_current_user');
      if (!user) {
        return 'overview';
      }
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

  // Desktop sidebar open/close state with local persistence
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_sidebar_open');
      if (saved !== null) return saved !== 'false';
    }
    return true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('nexus_sidebar_open', String(next));
      } catch (_) {}
      return next;
    });
  };

  // Current logged in user state
  const [currentUser, setCurrentUser] = useState<{ id?: string; email: string; firstName?: string; lastName?: string } | null>(() => {
    const saved = localStorage.getItem('nexus_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (parsed.email && parsed.email.includes('urthymamidipalli@gmail.com')) {
            parsed.email = 'ramachandramurthymamidipalli@gmail.com';
            parsed.id = parsed.id || 'f2efad04-8105-4169-8dcb-c9411e553cc0';
            parsed.firstName = parsed.firstName || 'Ramachandra Murthy';
            parsed.lastName = parsed.lastName || 'Mamidipalli';
          }
          return parsed;
        }
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
        const email = mappedUser.email.toLowerCase().trim();
        if (email) {
          lastLoadedEmailRef.current = email;
          resetUserDataState(email, `${mappedUser.firstName || ''} ${mappedUser.lastName || ''}`.trim());
        }
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
        const email = mappedUser.email.toLowerCase().trim();
        if (email) {
          lastLoadedEmailRef.current = email;
          resetUserDataState(email, `${mappedUser.firstName || ''} ${mappedUser.lastName || ''}`.trim());
        }
        setCurrentUser(mappedUser);
        localStorage.setItem('nexus_current_user', JSON.stringify(mappedUser));
      } else if (_event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('nexus_current_user');
        localStorage.setItem('nexus_active_tab', 'overview');
        setActiveTab('overview');
        if (window.location.hash && !window.location.hash.startsWith('#/public/') && !window.location.hash.startsWith('#/portfolio/') && !window.location.hash.startsWith('#/share/')) {
          window.history.replaceState(null, '', `${window.location.pathname}#overview`);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserLogin = (user: { id?: string; email: string; firstName?: string; lastName?: string }) => {
    const email = user?.email ? user.email.toLowerCase().trim() : '';
    if (email) {
      lastLoadedEmailRef.current = email;
      // Immediately hydrate all user states from local cache in 0ms!
      resetUserDataState(email, `${user.firstName || ''} ${user.lastName || ''}`.trim());
    }
    setCurrentUser(user);
    localStorage.setItem('nexus_current_user', JSON.stringify(user));
    setActiveTab('overview');
    localStorage.setItem('nexus_active_tab', 'overview');
    if (window.location.hash && !window.location.hash.startsWith('#/public/') && !window.location.hash.startsWith('#/portfolio/') && !window.location.hash.startsWith('#/share/')) {
      window.history.replaceState(null, '', `${window.location.pathname}#overview`);
    }
  };

  const resetUserDataState = (userEmail?: string, userName?: string) => {
    const emailKey = userEmail ? userEmail.toLowerCase().trim() : '';
    const isUserLoggedIn = Boolean(emailKey);
    if (emailKey) {
      lastLoadedEmailRef.current = emailKey;
    }

    const getLocal = <T,>(key: string, fallback: T): T => {
      if (emailKey) {
        const raw = localStorage.getItem(`${emailKey}_${key}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed as any;
            if (parsed && typeof parsed === 'object') return parsed as any;
          } catch (e) {}
        }
      }
      return fallback;
    };

    const defaultProfile: PersonalProfile = {
      name: userName || (userEmail ? userEmail.split('@')[0] : 'User'),
      firstName: userName ? userName.split(' ')[0] : 'User',
      lastName: userName ? userName.split(' ').slice(1).join(' ') : '',
      email: userEmail || '',
      phone: '',
      location: '',
      headline: '',
      bio: '',
      avatarUrl: '',
      shareSlug: userEmail ? userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'my-profile',
      publicProfile: true
    };

    const loadedProf = getLocal('profile', defaultProfile);
    setProfile(loadedProf);
    setSkills(deduplicateSkills(getLocal('skills', isUserLoggedIn ? [] : INITIAL_SKILLS)));
    setExperience(deduplicateExperience(getLocal('experience', isUserLoggedIn ? [] : INITIAL_EXPERIENCE)));
    setCertifications(deduplicateCertifications(getLocal('certs', isUserLoggedIn ? [] : INITIAL_CERTIFICATIONS)));
    setProjects(deduplicateProjects(getLocal('projects', isUserLoggedIn ? [] : INITIAL_PROJECTS)));
    setProducts(deduplicateProjects(getLocal('products', [])));
    setOthers(deduplicateProjects(getLocal('others', [])));
    setEducation(deduplicateEducation(getLocal('education', isUserLoggedIn ? [] : INITIAL_EDUCATION)));
    setSpecializations(deduplicateSpecializations(getLocal('specializations', [])));
    setAchievements(deduplicateAchievements(getLocal('achievements', isUserLoggedIn ? [] : INITIAL_ACHIEVEMENTS)));
    setTestimonials(deduplicateTestimonials(getLocal('testimonials', isUserLoggedIn ? [] : INITIAL_TESTIMONIALS)));
    setLinks(deduplicateLinks(getLocal('links', isUserLoggedIn ? [] : INITIAL_LINKS)));
    setResumes(deduplicateResumes(getLocal('nexus_vault_resumes', [])));
    setDocuments(deduplicateDocuments(getLocal('documents', INITIAL_DOCUMENTS)));
    setCalendarEvents(deduplicateCalendarEvents(getLocal('calendar_events', [])));
    setNotes(deduplicateNotes(getLocal('notepad_notes', [])));
    setMilestones(deduplicateMilestones(getLocal('milestones', isUserLoggedIn ? [] : INITIAL_TIMELINE)));
    setContacts(deduplicateContacts(getLocal('contacts', isUserLoggedIn ? [] : INITIAL_CONTACTS)));
    const loadedOldData = getLocal('old_data', []);
    if (Array.isArray(loadedOldData)) {
      const now = Date.now();
      setOldData(loadedOldData.filter((item: any) => item && item.expiresAt && new Date(item.expiresAt).getTime() > now));
    } else {
      setOldData([]);
    }
    const localJob = getLocal('current_job', isUserLoggedIn ? EMPTY_CURRENT_JOB : {
      employer: 'Photonx Technologies',
      company: 'Photonx Technologies',
      role: 'Tester',
      department: 'Testing',
      joiningDate: '2026-05-14',
      startDate: '2026-05-14',
      location: 'on-site',
      description: '',
      employmentType: 'internship',
      isPublic: true
    });
    if (isUserLoggedIn && localJob && (localJob.company?.toLowerCase().includes('photonx') || localJob.employer?.toLowerCase().includes('photonx'))) {
      setCurrentJob(EMPTY_CURRENT_JOB);
    } else {
      setCurrentJob(localJob);
    }
  };

  const handleUserLogout = () => {
    // 1. Immediately reset state locally with 0ms latency
    setCurrentUser(null);
    localStorage.removeItem('nexus_current_user');
    localStorage.setItem('nexus_active_tab', 'overview');
    setActiveTab('overview');
    if (window.location.hash && !window.location.hash.startsWith('#/public/') && !window.location.hash.startsWith('#/portfolio/') && !window.location.hash.startsWith('#/share/')) {
      window.history.replaceState(null, '', `${window.location.pathname}#overview`);
    }
    resetUserDataState();
    triggerToast('Logged off successfully.');

    // 2. Perform remote signOut in background without blocking UI
    supabase.auth.signOut().catch((e) => {
      console.warn("Background sign out:", e);
    });
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
    // 1. Save to high-capacity IndexedDB database first to guarantee permanent persistence of 100% full data (unlimited items & size)
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

    // 2. High-capacity safeguard: sanitize bulky base64 data strings for localStorage to prevent hitting browser 5MB quota
    // while keeping 100% of records, metadata, titles, dates, IDs, fields intact.
    let storageValue = value;
    if (parsedData) {
      try {
        const sanitizeNode = (node: any, parentKey?: string): any => {
          if (!node) return node;
          if (typeof node === 'string') {
            if (node.startsWith('data:') && node.length > 500) {
              if (parentKey === 'avatarUrl' && node.length < 1500000) return node;
              return '';
            }
            return node;
          }
          if (Array.isArray(node)) {
            return node.map(item => sanitizeNode(item, parentKey));
          }
          if (typeof node === 'object') {
            const out: any = {};
            for (const k of Object.keys(node)) {
              const v = node[k];
              if (typeof v === 'string' && v.startsWith('data:') && v.length > 500) {
                if (k === 'avatarUrl' && v.length < 1500000) {
                  out[k] = v;
                } else {
                  out[k] = '';
                }
              } else if (v && typeof v === 'object') {
                out[k] = sanitizeNode(v, k);
              } else {
                out[k] = v;
              }
            }
            return out;
          }
          return node;
        };
        const sanitized = sanitizeNode(parsedData);
        storageValue = JSON.stringify(sanitized);
      } catch (_) {}
    }

    // 3. Save configuration and sanitized data to localStorage with graceful fallback
    try {
      localStorage.setItem(key, storageValue);
    } catch (error) {
      if (error instanceof DOMException && (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        try {
          // Clear legacy temporary sync keys to free quota
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('nexus_pending_sync_')) {
              localStorage.removeItem(k);
            }
          }
          localStorage.setItem(key, storageValue);
        } catch (_) {
          // If still out of localStorage quota, IndexedDB (heavyStorage) holds the full authoritative dataset
        }
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
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_profile`, JSON.stringify(profile));
      heavyStorage.set(`${email}_profile`, profile).catch(e => {});
    }
  }, [profile, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_skills`, JSON.stringify(skills));
      heavyStorage.set(`${email}_skills`, skills).catch(e => {});
    }
  }, [skills, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_education`, JSON.stringify(education));
      heavyStorage.set(`${email}_education`, education).catch(e => {});
    }
  }, [education, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      if (isCertsRestoringRef.current) return;
      safeLocalStorageSetItem(`${email}_certs`, JSON.stringify(certifications));
      heavyStorage.set(`${email}_certs`, certifications).catch(e => {});
    }
  }, [certifications, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_experience`, JSON.stringify(experience));
      heavyStorage.set(`${email}_experience`, experience).catch(e => {});
    }
  }, [experience, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_old_data`, JSON.stringify(oldData));
      heavyStorage.set(`${email}_old_data`, oldData).catch(e => {});
    }
  }, [oldData, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_current_job`, JSON.stringify(currentJob));
      heavyStorage.set(`${email}_current_job`, currentJob).catch(e => {});
    }
  }, [currentJob, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      if (isProjsRestoringRef.current) return;
      safeLocalStorageSetItem(`${email}_projects`, JSON.stringify(projects));
      heavyStorage.set(`${email}_projects`, projects).catch(e => {});
    }
  }, [projects, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      if (isProjsRestoringRef.current) return;
      safeLocalStorageSetItem(`${email}_products`, JSON.stringify(products));
      heavyStorage.set(`${email}_products`, products).catch(e => {});
    }
  }, [products, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      if (!isProjsRestoringRef.current) {
        safeLocalStorageSetItem(`${email}_others`, JSON.stringify(others));
        heavyStorage.set(`${email}_others`, others).catch(e => {});
      }
    }
  }, [others, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_nexus_vault_resumes`, JSON.stringify(resumes));
      heavyStorage.set(`${email}_nexus_vault_resumes`, resumes).catch(e => {});
    }
  }, [resumes, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_links`, JSON.stringify(links));
      heavyStorage.set(`${email}_links`, links).catch(e => {});
    }
  }, [links, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_resume_links`, JSON.stringify(resumeLinks));
      heavyStorage.set(`${email}_resume_links`, resumeLinks).catch(e => {});
    }
  }, [resumeLinks, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_milestones`, JSON.stringify(milestones));
      heavyStorage.set(`${email}_milestones`, milestones).catch(e => {});
    }
  }, [milestones, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_contacts`, JSON.stringify(contacts));
      heavyStorage.set(`${email}_contacts`, contacts).catch(e => {});
    }
  }, [contacts, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_notepad_notes`, JSON.stringify(notes));
      heavyStorage.set(`${email}_notepad_notes`, notes).catch(e => {});
    }
  }, [notes, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_achievements`, JSON.stringify(achievements));
      heavyStorage.set(`${email}_achievements`, achievements).catch(e => {});
    }
  }, [achievements, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_testimonials`, JSON.stringify(testimonials));
      heavyStorage.set(`${email}_testimonials`, testimonials).catch(e => {});
    }
  }, [testimonials, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      if (!isDocsRestoringRef.current) {
        safeLocalStorageSetItem(`${email}_documents`, JSON.stringify(documents));
        heavyStorage.set(`${email}_documents`, documents).catch(e => {});
      }
    }
  }, [documents, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase().trim();
      safeLocalStorageSetItem(`${email}_calendar_events`, JSON.stringify(calendarEvents));
      heavyStorage.set(`${email}_calendar_events`, calendarEvents).catch(e => {});
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
          setDocuments(prev => {
            const existing = prev || [];
            const merged = existing.map(pDoc => {
              const match = dDocs.find((d: any) => d.id === pDoc.id || d.fileName === pDoc.fileName || d.name === pDoc.name);
              return match?.fileDataUrl && !pDoc.fileDataUrl ? { ...pDoc, fileDataUrl: match.fileDataUrl } : pDoc;
            });
            const extra = dDocs.filter(d => !existing.some(p => p.id === d.id));
            return deduplicateDocuments([...merged, ...extra]);
          });
        }
      } catch (err) {
        console.warn("Async restoration of documents deferred:", err);
      } finally {
        isDocsRestoringRef.current = false;
      }

      try {
        const [
          dProf, dJob, dCerts, dProjs, dProds, dOthers,
          dEdu, dSpec, dSkills, dExp, dCt, dCal, dNotes,
          dRes, dLinks, dMil, dAch, dTest, dOldData
        ] = await Promise.all([
          heavyStorage.get(`${email}_profile`).catch(() => null),
          heavyStorage.get(`${email}_current_job`).catch(() => null),
          heavyStorage.get(`${email}_certs`).catch(() => null),
          heavyStorage.get(`${email}_projects`).catch(() => null),
          heavyStorage.get(`${email}_products`).catch(() => null),
          heavyStorage.get(`${email}_others`).catch(() => null),
          heavyStorage.get(`${email}_education`).catch(() => null),
          heavyStorage.get(`${email}_specializations`).catch(() => null),
          heavyStorage.get(`${email}_skills`).catch(() => null),
          heavyStorage.get(`${email}_experience`).catch(() => null),
          heavyStorage.get(`${email}_contacts`).catch(() => null),
          heavyStorage.get(`${email}_calendar_events`).catch(() => null),
          heavyStorage.get(`${email}_notepad_notes`).catch(() => null),
          heavyStorage.get(`${email}_nexus_vault_resumes`).catch(() => null),
          heavyStorage.get(`${email}_links`).catch(() => null),
          heavyStorage.get(`${email}_milestones`).catch(() => null),
          heavyStorage.get(`${email}_achievements`).catch(() => null),
          heavyStorage.get(`${email}_testimonials`).catch(() => null),
          heavyStorage.get(`${email}_old_data`).catch(() => null)
        ]);

        if (dProf && typeof dProf === 'object') {
          setProfile(prev => ({
            ...prev,
            ...dProf,
            company: dProf.company || prev.company || '',
            publicProfile: prev.publicProfile !== undefined ? prev.publicProfile : (dProf.publicProfile ?? true),
            avatarUrl: dProf.avatarUrl || prev.avatarUrl || ''
          }));
        }

        if (dJob && typeof dJob === 'object') {
          setCurrentJob(prev => ({
            ...prev,
            ...dJob,
            weeklyGoals: Array.isArray(dJob.weeklyGoals) ? dJob.weeklyGoals : (prev.weeklyGoals || []),
            currentProjects: Array.isArray(dJob.currentProjects) ? dJob.currentProjects : (prev.currentProjects || [])
          }));
        }

        if (dCerts && Array.isArray(dCerts) && dCerts.length > 0) {
          setCertifications(prev => {
            const existing = prev || [];
            const merged = existing.map(pCert => {
              const match = dCerts.find((d: any) => d.id === pCert.id || d.title === pCert.title || (d as any).name === (pCert as any).name);
              return match?.fileDataUrl && !(pCert as any).fileDataUrl ? { ...pCert, fileDataUrl: match.fileDataUrl } : pCert;
            });
            const extra = dCerts.filter(d => !existing.some(p => p.id === d.id));
            return deduplicateCertifications([...merged, ...extra]);
          });
        }

        if (dProjs && Array.isArray(dProjs) && dProjs.length > 0) {
          setProjects(prev => deduplicateProjects([...(prev || []), ...dProjs]));
        }

        if (dProds && Array.isArray(dProds) && dProds.length > 0) {
          setProducts(prev => deduplicateProjects([...(prev || []), ...dProds]));
        }

        if (dOthers && Array.isArray(dOthers) && dOthers.length > 0) {
          setOthers(prev => deduplicateProjects([...(prev || []), ...dOthers]));
        }

        if (dEdu && Array.isArray(dEdu) && dEdu.length > 0) {
          setEducation(prev => deduplicateEducation([...(prev || []), ...dEdu]));
        }

        if (dSpec && Array.isArray(dSpec) && dSpec.length > 0) {
          setSpecializations(prev => deduplicateSpecializations([...(prev || []), ...dSpec]));
        }

        if (dSkills && Array.isArray(dSkills) && dSkills.length > 0) {
          setSkills(prev => deduplicateSkills([...(prev || []), ...dSkills]));
        }

        if (dExp && Array.isArray(dExp) && dExp.length > 0) {
          setExperience(prev => deduplicateExperience([...(prev || []), ...dExp]));
        }

        if (dCt && Array.isArray(dCt) && dCt.length > 0) {
          setContacts(prev => deduplicateContacts([...(prev || []), ...dCt]));
        }

        if (dCal && Array.isArray(dCal) && dCal.length > 0) {
          setCalendarEvents(prev => deduplicateCalendarEvents([...(prev || []), ...dCal]));
        }

        if (dNotes && Array.isArray(dNotes) && dNotes.length > 0) {
          setNotes(prev => deduplicateNotes([...(prev || []), ...dNotes]));
        }

        if (dRes && Array.isArray(dRes) && dRes.length > 0) {
          setResumes(prev => {
            const existing = prev || [];
            const sanitizedDRes = dRes.filter((d: any) => {
              if (!d) return false;
              if (d.fileName === 'Simulated_Document.pdf') return false;
              const nameLower = (d.name || d.fileName || '').toLowerCase();
              return !nameLower.includes('simulated') && !nameLower.includes('ai-generated');
            }).map((d: any) => ({
              ...d,
              fileUrl: (d.fileUrl && !d.fileUrl.includes('example.com')) ? d.fileUrl : '',
              fileDataUrl: (d.fileDataUrl && !d.fileDataUrl.includes('example.com')) ? d.fileDataUrl : ''
            }));
            const merged = existing.map(pRes => {
              const match = sanitizedDRes.find((d: any) => d.id === pRes.id || d.fileName === pRes.fileName || d.name === pRes.name);
              return match?.fileDataUrl && !pRes.fileDataUrl ? { ...pRes, fileDataUrl: match.fileDataUrl } : pRes;
            });
            const extra = sanitizedDRes.filter((d: any) => !existing.some(p => p.id === d.id));
            return deduplicateResumes([...merged, ...extra]);
          });
        }

        if (dLinks && Array.isArray(dLinks) && dLinks.length > 0) {
          setLinks(prev => deduplicateLinks([...(prev || []), ...dLinks]));
        }

        if (dMil && Array.isArray(dMil) && dMil.length > 0) {
          setMilestones(prev => deduplicateMilestones([...(prev || []), ...dMil]));
        }

        if (dAch && Array.isArray(dAch) && dAch.length > 0) {
          setAchievements(prev => deduplicateAchievements([...(prev || []), ...dAch]));
        }

        if (dTest && Array.isArray(dTest) && dTest.length > 0) {
          setTestimonials(prev => deduplicateTestimonials([...(prev || []), ...dTest]));
        }

        if (dOldData && Array.isArray(dOldData) && dOldData.length > 0) {
          const now = Date.now();
          const validOld = dOldData.filter((item: any) => item && item.expiresAt && new Date(item.expiresAt).getTime() > now);
          setOldData(prev => {
            const existingIds = new Set((prev || []).map(p => p.id));
            const merged = [...(prev || []), ...validOld.filter(v => !existingIds.has(v.id))];
            return merged;
          });
        }
      } catch (err) {
        console.warn("Async restoration of heavy storage data deferred:", err);
      } finally {
        isDocsRestoringRef.current = false;
        isCertsRestoringRef.current = false;
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
    if (!currentUser) {
      resetUserDataState();
      return;
    }

    let email = currentUser.email ? currentUser.email.toLowerCase().trim() : '';
    if (email.includes('urthymamidipalli@gmail.com')) {
      email = 'ramachandramurthymamidipalli@gmail.com';
    }

    lastLoadedEmailRef.current = email;
    resetUserDataState(email, `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim());

    const loadSupabaseUserData = async () => {
      // Ensure Supabase Auth session is active so auth token is attached to requests
      let userId: string | null = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) userId = session.user.id;
      } catch (e) {}

      if (!userId && currentUser?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id)) {
        userId = currentUser.id;
      }

      if (!userId && email) {
        try {
          const { data: p } = await supabase.from('profiles').select('user_id').eq('email', email).maybeSingle();
          if (p?.user_id) {
            userId = p.user_id;
          }
        } catch (e) {}
      }

      if (!userId && (email === 'ramachandramurthymamidipalli@gmail.com' || email === 'ramachandramurthymamidipalli1@gmail.com')) {
        userId = 'f2efad04-8105-4169-8dcb-c9411e553cc0';
      }

      if (!userId) return;

      console.log(`[Supabase DB] Loading records for authenticated user: ${userId} (${email})`);
      
      try {
        const [
          pRes, sRes, eRes, cRes, expRes, jobRes,
          projRes, prodRes, othRes, resRes, docRes,
          nRes, lRes, tmRes, ctRes, calRes, aRes, tRes,
          docCatRes, rlkRes
        ] = await Promise.allSettled([
          supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('skills').select('*').eq('user_id', userId),
          supabase.from('education').select('*').eq('user_id', userId),
          supabase.from('certifications').select('*').eq('user_id', userId),
          supabase.from('experience').select('*').eq('user_id', userId),
          supabase.from('current_jobs').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('projects').select('*').eq('user_id', userId),
          supabase.from('products').select('*').eq('user_id', userId),
          supabase.from('others').select('*').eq('user_id', userId),
          supabase.from('resumes').select('*').eq('user_id', userId),
          supabase.from('documents').select('*').eq('user_id', userId),
          supabase.from('notes').select('*').eq('user_id', userId),
          supabase.from('portfolio_links').select('*').eq('user_id', userId),
          supabase.from('career_timeline').select('*').eq('user_id', userId),
          supabase.from('contacts').select('*').eq('user_id', userId),
          supabase.from('calendar_events').select('*').eq('user_id', userId),
          supabase.from('achievements').select('*').eq('user_id', userId),
          supabase.from('testimonials').select('*').eq('user_id', userId),
          supabase.from('document_categories').select('*').eq('user_id', userId),
          supabase.from('resume_links').select('*').eq('user_id', userId)
        ]);

        const resumeLinksFromDb: PortfolioLink[] = [];

        // 1. Profile
        try {
          const pData = pRes.status === 'fulfilled' ? pRes.value.data : null;
          if (pData) {
            const localSavedStr = email ? localStorage.getItem(`${email}_profile`) : null;
            let localSaved: PersonalProfile | null = null;
            if (localSavedStr) {
              try { localSaved = JSON.parse(localSavedStr); } catch (_) {}
            }
            const localAvatar = (email ? localStorage.getItem(`${email}_avatar_cache`) : '') || localSaved?.avatarUrl || profile.avatarUrl || '';
            const restoredAvatar = pData.avatar_url || localAvatar;

            if (restoredAvatar && email) {
              try {
                safeLocalStorageSetItem(`${email}_avatar_cache`, restoredAvatar);
              } catch (_) {}
            }

            // Strictly preserve user's explicit publicProfile setting so background Supabase sync doesn't flip it to private
            const localPublicProfile = localSaved?.publicProfile !== undefined ? localSaved.publicProfile : profile.publicProfile;
            const resolvedPublicProfile = localPublicProfile !== undefined ? localPublicProfile : (pData.public_profile ?? true);

            const updatedProfile: PersonalProfile = {
              name: pData.name ?? localSaved?.name ?? '',
              firstName: pData.first_name ?? localSaved?.firstName ?? '',
              lastName: pData.last_name ?? localSaved?.lastName ?? '',
              company: localSaved?.company || profile.company || '',
              headline: pData.headline ?? localSaved?.headline ?? '',
              bio: pData.bio ?? localSaved?.bio ?? '',
              email: pData.email || email || '',
              phone: pData.phone ?? localSaved?.phone ?? '',
              secondaryEmail: pData.secondary_email ?? localSaved?.secondaryEmail ?? '',
              secondaryPhone: pData.secondary_phone ?? localSaved?.secondaryPhone ?? '',
              location: pData.location ?? localSaved?.location ?? '',
              avatarUrl: restoredAvatar,
              publicProfile: resolvedPublicProfile,
              shareSlug: pData.share_slug || localSaved?.shareSlug || (pData.name ? pData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'user')
            };

            setProfile(updatedProfile);

            if (email) {
              safeLocalStorageSetItem(`${email}_profile`, JSON.stringify(updatedProfile));
              heavyStorage.set(`${email}_profile`, updatedProfile).catch(() => {});
              if (updatedProfile.shareSlug) {
                safeLocalStorageSetItem(`nexus_cache_profile_${updatedProfile.shareSlug}`, JSON.stringify(updatedProfile));
              }
            }
          }
        } catch (err) { console.warn("[Supabase Profiles Load]", err); }

        // 2. Skills
        try {
          const sData = sRes.status === 'fulfilled' ? sRes.value.data : null;
          if (sRes.status === 'fulfilled' && Array.isArray(sData)) {
            const mapped = sData.map(s => {
              const expVal = typeof s.years_of_exp === 'number' ? s.years_of_exp : (s.years_of_exp !== null && s.years_of_exp !== undefined ? (parseInt(s.years_of_exp, 10) || 0) : 0);
              return {
                id: s.id,
                name: s.name,
                category: s.category || 'Technical',
                proficiency: s.proficiency || 'Intermediate',
                yearsOfExp: expVal,
                endorsements: s.endorsements || 0,
                description: s.description || '',
                visibility: s.visibility || 'public'
              };
            });
            const updatedSkills = deduplicateSkills(mapped);
            setSkills(updatedSkills);
            if (currentUser?.email) {
              const em = currentUser.email.toLowerCase().trim();
              safeLocalStorageSetItem(`${em}_skills`, JSON.stringify(updatedSkills));
              heavyStorage.set(`${em}_skills`, updatedSkills).catch(() => {});
            }
          }
        } catch (err) { console.warn("[Supabase Skills Load]", err); }

        // 3. Education
        try {
          const eData = eRes.status === 'fulfilled' ? eRes.value.data : null;
          if (eRes.status === 'fulfilled' && Array.isArray(eData)) {
            const mapped = eData.map(e => {
              let extraMeta: any = {};
              if (e.description && typeof e.description === 'string' && e.description.startsWith('{')) {
                try { extraMeta = JSON.parse(e.description); } catch (err) {}
              }
              return {
                id: e.id,
                degree: e.degree,
                institution: e.institution,
                fieldOfStudy: e.field_of_study || e.fieldOfStudy || '',
                specialization: e.specialization || extraMeta.specialization || '',
                startYear: e.start_year || e.startYear || '',
                endYear: e.end_year || e.endYear || '',
                grade: e.grade || '',
                percentage: e.percentage || '',
                description: e.description || '',
                enrollmentId: e.enrollment_id || e.enrollmentId || e.enrollment_number || extraMeta.enrollmentId || '',
                startDate: e.start_date || e.startDate || extraMeta.startDate || '',
                endDate: e.end_date || e.endDate || extraMeta.endDate || '',
                isCurrentlyPursuing: e.is_currently_pursuing ?? e.isCurrentlyPursuing ?? extraMeta.isCurrentlyPursuing ?? (e.end_year === 'Present' || e.end_date === 'Present'),
                activities: e.activities || extraMeta.activities || (e.description && !e.description.startsWith('{') ? e.description : '')
              };
            });
            const updatedEdu = deduplicateEducation(mapped);
            setEducation(updatedEdu);
            if (currentUser?.email) {
              const em = currentUser.email.toLowerCase().trim();
              safeLocalStorageSetItem(`${em}_education`, JSON.stringify(updatedEdu));
              heavyStorage.set(`${em}_education`, updatedEdu).catch(() => {});
            }
          }
        } catch (err) { console.warn("[Supabase Education Load]", err); }

        // 4. Certifications
        try {
          const cData = cRes.status === 'fulfilled' ? cRes.value.data : null;
          if (cRes.status === 'fulfilled' && Array.isArray(cData)) {
            const mapped = cData.map(c => {
              const dVal = c.issue_date || c.date_issued || c.dateIssued || c.issueDate || '';
              let certType = c.type;
              let certPct = c.percentage || '';
              let certDesc = c.description || '';
              if (c.description && typeof c.description === 'string' && c.description.startsWith('{')) {
                try {
                  const parsed = JSON.parse(c.description);
                  if (parsed.type) certType = parsed.type;
                  if (parsed.percentage) certPct = parsed.percentage;
                  if (parsed.desc !== undefined) certDesc = parsed.desc;
                } catch (_) {}
              }
              if (!certType) {
                const lowerTitle = (c.title || '').toLowerCase();
                const lowerIssuer = (c.issuer || '').toLowerCase();
                const lowerUrl = (c.credential_url || c.credentialUrl || '').toLowerCase();
                if (lowerTitle.includes('course') || lowerIssuer.includes('coursera') || lowerIssuer.includes('udemy') || lowerIssuer.includes('edx') || lowerUrl.includes('coursera') || lowerUrl.includes('udemy')) {
                  certType = 'course';
                } else if (lowerTitle.includes('memo') || lowerTitle.includes('marks') || lowerTitle.includes('grade')) {
                  certType = 'grades';
                } else {
                  certType = 'study';
                }
              }
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
                description: certDesc,
                fileName: c.file_name || c.fileName || '',
                fileUrl: c.file_url || c.fileUrl,
                storagePath: c.storage_path || c.storagePath,
                type: certType,
                percentage: certPct,
                visibility: c.visibility || 'public'
              };
            });
            const updatedCerts = deduplicateCertifications(mapped);
            setCertifications(updatedCerts);
            if (currentUser?.email) {
              safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_certs`, JSON.stringify(updatedCerts));
              heavyStorage.set(`${currentUser.email.toLowerCase().trim()}_certs`, updatedCerts).catch(() => {});
            }
          }
        } catch (err) { console.warn("[Supabase Certifications Load]", err); }

        // 5. Experience
        try {
          const expData = expRes.status === 'fulfilled' ? expRes.value.data : null;
          if (expRes.status === 'fulfilled' && Array.isArray(expData)) {
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
            const updatedExp = deduplicateExperience(mapped);
            setExperience(updatedExp);
            if (currentUser?.email) {
              const em = currentUser.email.toLowerCase().trim();
              safeLocalStorageSetItem(`${em}_experience`, JSON.stringify(updatedExp));
              heavyStorage.set(`${em}_experience`, updatedExp).catch(() => {});
            }
          }
        } catch (err) { console.warn("[Supabase Experience Load]", err); }

        // 6. Current Job
        try {
          const jobData = jobRes.status === 'fulfilled' ? jobRes.value.data : null;
          if (jobData) {
            // Read cached local job first so refresh NEVER deletes workspace board data
            let cachedLocalJob: any = null;
            if (email) {
              try {
                const raw = localStorage.getItem(`${email}_current_job`);
                if (raw) cachedLocalJob = JSON.parse(raw);
              } catch (e) {}
            }

            let parsedDesc = jobData.description || '';
            let parsedContractCompany = jobData.contract_company || cachedLocalJob?.contractCompany || '';
            let parsedWeeklyGoals = Array.isArray(jobData.weekly_goals) && jobData.weekly_goals.length > 0
              ? jobData.weekly_goals
              : (Array.isArray(cachedLocalJob?.weeklyGoals) ? cachedLocalJob.weeklyGoals : []);
            let parsedCurrentProjects = Array.isArray(jobData.current_projects) && jobData.current_projects.length > 0
              ? jobData.current_projects
              : (Array.isArray(cachedLocalJob?.currentProjects) ? cachedLocalJob.currentProjects : []);
            let parsedDailyStandup = jobData.daily_standup_text || cachedLocalJob?.dailyStandupText || '';

            // Check if description contains packed JSON metadata
            if (jobData.description && typeof jobData.description === 'string' && jobData.description.trim().startsWith('{')) {
              try {
                const meta = JSON.parse(jobData.description);
                if (meta && typeof meta === 'object') {
                  parsedDesc = meta.rawDescription !== undefined ? meta.rawDescription : (meta.description || '');
                  if (meta.contractCompany) parsedContractCompany = meta.contractCompany;
                  if (Array.isArray(meta.weeklyGoals) && meta.weeklyGoals.length > 0) parsedWeeklyGoals = meta.weeklyGoals;
                  if (Array.isArray(meta.currentProjects) && meta.currentProjects.length > 0) parsedCurrentProjects = meta.currentProjects;
                  if (meta.dailyStandupText) parsedDailyStandup = meta.dailyStandupText;
                }
              } catch (e) {}
            }

            const loadedJob: CurrentJob = {
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
              contractCompany: parsedContractCompany,
              salary: jobData.salary || '',
              manager: jobData.manager || '',
              description: parsedDesc,
              weeklyGoals: parsedWeeklyGoals,
              currentProjects: parsedCurrentProjects,
              dailyStandupText: parsedDailyStandup
            };
            setCurrentJob(loadedJob as any);
            if (email) {
              safeLocalStorageSetItem(`${email}_current_job`, JSON.stringify(loadedJob));
              heavyStorage.set(`${email}_current_job`, loadedJob).catch(() => {});
            }
          } else if (jobRes.status === 'fulfilled' && !jobData) {
            let cachedLocalJob: any = null;
            if (email) {
              try {
                const raw = localStorage.getItem(`${email}_current_job`);
                if (raw) cachedLocalJob = JSON.parse(raw);
              } catch (e) {}
            }
            if (cachedLocalJob && (cachedLocalJob.role || cachedLocalJob.employer || cachedLocalJob.company)) {
              setCurrentJob(cachedLocalJob);
            } else {
              setCurrentJob(EMPTY_CURRENT_JOB);
              if (email) {
                safeLocalStorageSetItem(`${email}_current_job`, JSON.stringify(EMPTY_CURRENT_JOB));
                heavyStorage.set(`${email}_current_job`, EMPTY_CURRENT_JOB).catch(() => {});
              }
            }
          }
        } catch (err) { console.warn("[Supabase Current Job Load]", err); }

        // 7. Projects
        try {
          const projData = projRes.status === 'fulfilled' ? projRes.value.data : null;
          let remoteProjects: Project[] = [];
          if (projData && Array.isArray(projData) && projData.length > 0) {
            remoteProjects = projData.filter(p => p.type === 'project' || (!p.type && p.category !== 'products' && p.category !== 'others')).map(p => ({
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
          }

          let localStoredProjs: Project[] = [];
          try {
            const raw = localStorage.getItem(`${email}_projects`);
            if (raw) localStoredProjs = JSON.parse(raw);
          } catch (_) {}

          const allProjs = deduplicateProjects([...remoteProjects, ...localStoredProjs, ...(projects || [])]);
          setProjects(allProjs);
          if (currentUser?.email) {
            const em = currentUser.email.toLowerCase().trim();
            safeLocalStorageSetItem(`${em}_projects`, JSON.stringify(allProjs));
            heavyStorage.set(`${em}_projects`, allProjs).catch(() => {});
          }

          // Bidirectional sync: Push all local projects up to Supabase projects table
          if (userId && allProjs.length > 0) {
            for (const pr of allProjs) {
              if (isDemoItem(pr)) continue;
              const targetId = ensureUUID(pr.id);
              const cleanPdf = (pr.pdfUrl && pr.pdfUrl.startsWith('data:') && pr.pdfUrl.length > 50000) ? '' : (pr.pdfUrl || '');
              supabase.from('projects').upsert({
                id: targetId,
                user_id: userId,
                name: pr.name,
                category: pr.category || 'projects',
                type: 'project',
                description: pr.description || '',
                highlights: pr.highlights || [],
                tech_stack: pr.techStack || [],
                live_url: pr.liveUrl || '',
                github_url: pr.githubUrl || '',
                pdf_url: cleanPdf,
                pdf_name: pr.pdfName || '',
                is_public: pr.isPublic !== false,
                date: pr.date || ''
              }).then(() => {}, (e) => console.warn("[Supabase Sync Project]", e));
            }
          }
        } catch (err) { console.warn("[Supabase Projects Load]", err); }

        // 8. Products
        try {
          const prodData = prodRes.status === 'fulfilled' ? prodRes.value.data : null;
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
            setProducts(prev => {
              const merged = deduplicateProjects([...mapped, ...(prev || [])]);
              if (currentUser?.email) {
                const em = currentUser.email.toLowerCase().trim();
                safeLocalStorageSetItem(`${em}_products`, JSON.stringify(merged));
                heavyStorage.set(`${em}_products`, merged).catch(() => {});
              }
              return merged;
            });
          }
        } catch (err) { console.warn("[Supabase Products Load]", err); }

        // 8.5 Others / Reports
        try {
          const othData = othRes.status === 'fulfilled' ? othRes.value.data : null;
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
            setOthers(prev => {
              const merged = deduplicateProjects([...mapped, ...(prev || [])]);
              if (currentUser?.email) {
                const em = currentUser.email.toLowerCase().trim();
                safeLocalStorageSetItem(`${em}_others`, JSON.stringify(merged));
                heavyStorage.set(`${em}_others`, merged).catch(() => {});
              }
              return merged;
            });
          } else {
            // Fallback: If table 'others' does not exist in Supabase yet, check projects table for type === 'other'
            const projData = projRes.status === 'fulfilled' ? projRes.value.data : null;
            if (projData && Array.isArray(projData)) {
              const fallbackOthers = projData.filter(p => p.type === 'other' || p.category === 'others' || (p.category as any) === 'other').map(p => ({
                id: p.id,
                name: p.name,
                category: p.category || 'others',
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
              if (fallbackOthers.length > 0) {
                setOthers(prev => {
                  const merged = deduplicateProjects([...fallbackOthers, ...(prev || [])]);
                  if (currentUser?.email) {
                    const em = currentUser.email.toLowerCase().trim();
                    safeLocalStorageSetItem(`${em}_others`, JSON.stringify(merged));
                    heavyStorage.set(`${em}_others`, merged).catch(() => {});
                  }
                  return merged;
                });
              }
            }
          }
        } catch (err) { console.warn("[Supabase Others Load]", err); }

        // 9. Resumes
        try {
          const resData = resRes.status === 'fulfilled' ? resRes.value.data : null;
          let remoteResumes: ResumeItem[] = [];
          if (resData && Array.isArray(resData) && resData.length > 0) {
            for (const r of resData) {
              if (r.file_type === 'Link' || r.type === 'Link') {
                resumeLinksFromDb.push({
                  id: r.id,
                  platform: r.file_name || 'Link',
                  label: r.title || 'Link',
                  url: r.file_url || '',
                  isPublic: r.is_public !== false
                });
              }
            }

            // Filter out simulated / AI generated items from Supabase and links
            const userRes = resData.filter(r => {
              if (r.file_type === 'Link' || r.type === 'Link') return false;
              if (r.file_name === 'Simulated_Document.pdf') return false;
              const clean = (r.title || r.file_name || '').toLowerCase();
              return !clean.includes('simulated') && !clean.includes('ai-generated');
            });
            remoteResumes = userRes.map(r => {
              const url = (r.file_url && !r.file_url.includes('example.com')) ? r.file_url : '';
              return {
                id: r.id,
                name: r.title || r.file_name,
                title: r.title,
                fileName: r.file_name,
                fileUrl: url,
                fileDataUrl: url,
                storagePath: r.storage_path,
                size: r.file_size,
                fileSize: r.file_size,
                type: r.file_type || 'Resume',
                fileType: r.file_type,
                isPrimary: r.is_primary,
                visibility: (r.is_public === false || r.is_public === 'false') ? ('private' as const) : ('public' as const),
                isPublic: r.is_public !== false && r.is_public !== 'false',
                uploadDate: r.created_at ? r.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10),
                category: 'SUPABASE'
              };
            });
          }

          let localResumes: ResumeItem[] = [];
          try {
            const raw = localStorage.getItem(`${email}_nexus_vault_resumes`);
            if (raw) localResumes = JSON.parse(raw);
          } catch (_) {}

          const cleanLocal = localResumes.filter(r => {
            if (!r) return false;
            if (r.fileName === 'Simulated_Document.pdf') return false;
            const clean = (r.name || r.fileName || '').toLowerCase();
            return !clean.includes('simulated') && !clean.includes('ai-generated');
          });

          // Merge: Preserve genuine local base64 fileDataUrl if remote is empty or example.com
          const merged = remoteResumes.map(rem => {
            const matchedLocal = cleanLocal.find(l => l.id === rem.id || l.fileName === rem.fileName);
            if (matchedLocal?.fileDataUrl && (!rem.fileDataUrl || rem.fileDataUrl.includes('example.com'))) {
              return { ...rem, fileDataUrl: matchedLocal.fileDataUrl, fileUrl: matchedLocal.fileDataUrl };
            }
            return rem;
          });
          const extraLocals = cleanLocal.filter(l => !merged.some(m => m.id === l.id || m.fileName === l.fileName));
          const allResumes = deduplicateResumes([...merged, ...extraLocals]);

          setResumes(allResumes);
          if (currentUser?.email) {
            const em = currentUser.email.toLowerCase().trim();
            safeLocalStorageSetItem(`${em}_nexus_vault_resumes`, JSON.stringify(allResumes));
            heavyStorage.set(`${em}_nexus_vault_resumes`, allResumes).catch(() => {});
          }
        } catch (err) { console.warn("[Supabase Resumes Load]", err); }

        // 10. Documents & Document Categories (Vault)
        try {
          // A. Document Categories
          const DEFAULT_DOC_CATEGORIES = [
            { id: 'cat-resume', name: 'Resume', icon: 'FileText', color: 'emerald' },
            { id: 'cat-transcript', name: 'Transcript', icon: 'GraduationCap', color: 'blue' },
            { id: 'cat-certificate', name: 'Certificate', icon: 'Award', color: 'purple' },
            { id: 'cat-identity', name: 'Identity', icon: 'Shield', color: 'amber' },
            { id: 'cat-educational', name: 'Educational', icon: 'BookOpen', color: 'cyan' },
            { id: 'cat-financial', name: 'Financial', icon: 'DollarSign', color: 'teal' },
            { id: 'cat-legal', name: 'Legal', icon: 'Scale', color: 'indigo' },
            { id: 'cat-medical', name: 'Medical', icon: 'Activity', color: 'rose' },
            { id: 'cat-other', name: 'Other', icon: 'Folder', color: 'slate' }
          ];

          if (userId) {
            for (const cat of DEFAULT_DOC_CATEGORIES) {
              const targetId = ensureUUID(cat.id);
              supabase.from('document_categories').upsert({
                id: targetId,
                user_id: userId,
                name: cat.name,
                icon: cat.icon,
                color: cat.color
              }).then(({ error }) => {
                if (error) console.error("[Supabase Sync Category Error]", error);
              }, (e) => console.warn("[Supabase Sync Category]", e));
            }
          }

          // B. Documents
          const docData = docRes.status === 'fulfilled' ? docRes.value.data : null;
          let remoteDocs: VaultDocument[] = [];
          if (docData && Array.isArray(docData) && docData.length > 0) {
            remoteDocs = docData.map(d => ({
              id: d.id,
              name: d.file_name || d.title,
              title: d.title,
              category: d.category || 'other',
              description: d.description || '',
              fileName: d.file_name,
              fileType: d.file_type,
              size: typeof d.file_size === 'number' && d.file_size > 0 
                ? (d.file_size > 1048576 ? `${(d.file_size / 1048576).toFixed(1)} MB` : `${Math.round(d.file_size / 1024)} KB`)
                : (d.file_size || '210 KB'),
              fileSize: typeof d.file_size === 'number' && d.file_size > 0 
                ? `${Math.round(d.file_size / 1024)} KB` 
                : (d.file_size || '210 KB'),
              fileUrl: d.file_url,
              storagePath: d.storage_path,
              expiryDate: d.expiry_date,
              uploadDate: d.created_at ? d.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10),
              tags: d.tags || [],
              visibility: d.visibility || 'private'
            }));
          }

          let localDocs: VaultDocument[] = [];
          try {
            const raw = localStorage.getItem(`${email}_documents`);
            if (raw) localDocs = JSON.parse(raw);
          } catch (_) {}

          if ((!localDocs || localDocs.length === 0) && remoteDocs.length === 0) {
            localDocs = INITIAL_DOCUMENTS;
          }

          const allDocs = deduplicateDocuments([...remoteDocs, ...localDocs, ...(documents || [])]);
          setDocuments(allDocs);
          if (currentUser?.email) {
            const em = currentUser.email.toLowerCase().trim();
            safeLocalStorageSetItem(`${em}_documents`, JSON.stringify(allDocs));
            heavyStorage.set(`${em}_documents`, allDocs).catch(() => {});
          }

          // Bidirectional sync: Push all documents to Supabase documents table
          if (userId && allDocs.length > 0) {
            for (const d of allDocs) {
              const targetId = ensureUUID(d.id);
              const cleanUrl = (d.fileUrl && d.fileUrl.startsWith('data:') && d.fileUrl.length > 50000)
                ? ''
                : (d.fileUrl || `vault://${encodeURIComponent(d.name || d.fileName || 'document.pdf')}`);
              const byteSize = parseFileSizeToBytes(d.size || d.fileSize);
              supabase.from('documents').upsert({
                id: targetId,
                user_id: userId,
                title: d.title || d.name || 'Document',
                category: d.category || 'other',
                description: d.description || '',
                file_name: d.name || d.fileName || 'document.pdf',
                file_type: d.fileType || 'application/pdf',
                file_size: byteSize,
                file_url: cleanUrl,
                storage_path: d.storagePath || '',
                expiry_date: d.expiryDate || null,
                tags: d.tags || [d.category || 'vault'],
                visibility: d.visibility || 'private'
              }).then(({ error }) => {
                if (error) console.error("[Supabase Sync Document Error]", error);
              }, (e) => console.warn("[Supabase Sync Document]", e));
            }
          }
        } catch (err) { console.warn("[Supabase Documents Load]", err); }

        // 11. Notes
        try {
          const nData = nRes.status === 'fulfilled' ? nRes.value.data : null;
          if (nData && Array.isArray(nData) && nData.length > 0) {
            const mapped = nData.map(n => {
              const tagArray = Array.isArray(n.tags) ? n.tags : [];
              const categoryTag = tagArray.find((t: string) => !t.startsWith('__')) || 'General';
              const isPinned = Boolean(n.is_pinned || tagArray.includes('__pinned__') || tagArray.includes('pinned'));
              const isTask = n.type === 'task' || tagArray.includes('__task__');
              const isCompleted = Boolean(n.completed || tagArray.includes('__completed__'));
              
              const tasksTag = tagArray.find((t: string) => t.startsWith('__tasks__:'));
              let subtasks: any[] = [];
              if (tasksTag) {
                try {
                  subtasks = JSON.parse(tasksTag.replace('__tasks__:', ''));
                } catch (_) {}
              }

              return {
                id: n.id,
                title: n.title,
                content: n.content,
                category: categoryTag,
                tags: tagArray,
                isPinned,
                type: isTask ? ('task' as const) : ('note' as const),
                completed: isCompleted,
                tasks: subtasks,
                isPublic: n.is_public !== false,
                updatedAt: n.updated_at || new Date().toISOString()
              };
            });
            const updatedNotes = deduplicateNotes(mapped);
            setNotes(updatedNotes);
            const em = currentUser?.email?.toLowerCase().trim() || email;
            if (em) {
              safeLocalStorageSetItem(`${em}_notepad_notes`, JSON.stringify(updatedNotes));
              heavyStorage.set(`${em}_notepad_notes`, updatedNotes).catch(() => {});
            }
          }
        } catch (err) { console.warn("[Supabase Notes Load]", err); }

        // 12. Portfolio Links & Resume Links
        try {
          const lData = lRes.status === 'fulfilled' ? lRes.value.data : null;
          const rlkData = rlkRes.status === 'fulfilled' ? rlkRes.value.data : null;

          // Read deleted link tombstones to prevent resurrecting deleted links on refresh
          const deletedLinkIds = new Set<string>();
          const deletedLinkUrls = new Set<string>();
          if (email) {
            try {
              const rawDel = localStorage.getItem(`${email}_deleted_links`);
              if (rawDel) {
                const parsed: { id?: string; url?: string }[] = JSON.parse(rawDel);
                parsed.forEach(d => {
                  if (d.id) {
                    deletedLinkIds.add(d.id.trim().toLowerCase());
                    deletedLinkIds.add(toUUID(d.id).toLowerCase());
                  }
                  if (d.url) {
                    deletedLinkUrls.add(normalizeLinkUrl(d.url));
                  }
                });
              }
            } catch (_) {}
          }

          const isNotDeleted = (l: PortfolioLink) => {
            if (!l) return false;
            const rawId = (l.id || '').trim().toLowerCase();
            const idKey = rawId ? toUUID(rawId).toLowerCase() : '';
            if (rawId && (deletedLinkIds.has(rawId) || (idKey && deletedLinkIds.has(idKey)))) return false;
            const normUrl = normalizeLinkUrl(l.url);
            if (normUrl && deletedLinkUrls.has(normUrl)) return false;
            return true;
          };

          // Background purge from Supabase for any links previously marked deleted
          if (userId && (deletedLinkIds.size > 0 || deletedLinkUrls.size > 0)) {
            for (const dId of deletedLinkIds) {
              if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dId)) {
                supabase.from('portfolio_links').delete().eq('user_id', userId).eq('id', dId).then(() => {}, () => {});
                supabase.from('resume_links').delete().eq('user_id', userId).eq('id', dId).then(() => {}, () => {});
                supabase.from('resumes').delete().eq('user_id', userId).eq('id', dId).then(() => {}, () => {});
              }
            }
            for (const dUrl of deletedLinkUrls) {
              supabase.from('portfolio_links').delete().eq('user_id', userId).ilike('url', `%${dUrl}%`).then(() => {}, () => {});
              supabase.from('resume_links').delete().eq('user_id', userId).ilike('url', `%${dUrl}%`).then(() => {}, () => {});
              supabase.from('resumes').delete().eq('user_id', userId).ilike('file_url', `%${dUrl}%`).then(() => {}, () => {});
            }
          }

          let remoteLinks: PortfolioLink[] = [];
          if (lData && Array.isArray(lData) && lData.length > 0) {
            remoteLinks = lData.map(l => ({
              id: l.id,
              platform: l.platform || 'Link',
              label: l.label,
              url: l.url,
              isPublic: l.is_public !== false
            }));
          }
          if (rlkData && Array.isArray(rlkData) && rlkData.length > 0) {
            const rlkMapped = rlkData.map(l => ({
              id: l.id,
              platform: l.platform || 'Link',
              label: l.label,
              url: l.url,
              isPublic: l.is_public !== false
            }));
            remoteLinks = deduplicateLinks([...remoteLinks, ...rlkMapped]);
          }
          if (resumeLinksFromDb.length > 0) {
            remoteLinks = deduplicateLinks([...remoteLinks, ...resumeLinksFromDb]);
          }

          let localLinks: PortfolioLink[] = [];
          try {
            const raw = localStorage.getItem(`${email}_links`);
            if (raw) localLinks = JSON.parse(raw);
          } catch (_) {}

          let localResumeLinks: PortfolioLink[] = [];
          try {
            const rawR = localStorage.getItem(`${email}_resume_links`);
            if (rawR) localResumeLinks = JSON.parse(rawR);
          } catch (_) {}

          // Filter out deleted links and deduplicate by ID and URL
          const filteredPool = [...remoteLinks, ...localLinks, ...localResumeLinks].filter(isNotDeleted);
          const allLinks = deduplicateLinks(filteredPool);
          setLinks(allLinks);
          setResumeLinks(allLinks);

          if (currentUser?.email) {
            const em = currentUser.email.toLowerCase().trim();
            safeLocalStorageSetItem(`${em}_links`, JSON.stringify(allLinks));
            safeLocalStorageSetItem(`${em}_resume_links`, JSON.stringify(allLinks));
            heavyStorage.set(`${em}_links`, allLinks).catch(() => {});
            heavyStorage.set(`${em}_resume_links`, allLinks).catch(() => {});
          }

          // Bidirectional sync: Push validated non-deleted links to Supabase
          if (userId && allLinks.length > 0) {
            for (const lk of allLinks) {
              if (!isNotDeleted(lk)) continue;
              const targetId = ensureUUID(lk.id);
              supabase.from('portfolio_links').upsert({
                id: targetId,
                user_id: userId,
                platform: lk.platform || 'Link',
                label: lk.label || lk.platform || 'Link',
                url: lk.url,
                is_public: lk.isPublic !== false
              }).then(({ error }) => {
                if (error) console.error("[Supabase Sync Link Error]", error);
              }, (e) => console.warn("[Supabase Sync Link]", e));

              supabase.from('resume_links').upsert({
                id: targetId,
                user_id: userId,
                platform: lk.platform || 'Link',
                label: lk.label || lk.platform || 'Link',
                url: lk.url,
                is_public: lk.isPublic !== false
              }).then(({ error }) => {
                if (error) console.error("[Supabase Sync resume_links Error]", error);
              }, (e) => console.warn("[Supabase Sync resume_links]", e));

              supabase.from('resumes').upsert({
                id: targetId,
                user_id: userId,
                title: lk.label || lk.platform || 'Link',
                file_name: lk.platform || 'Link',
                file_url: lk.url,
                storage_path: '',
                file_size: 0,
                file_type: 'Link',
                is_primary: false,
                is_public: lk.isPublic !== false
              }).then(({ error }) => {
                if (error) console.error("[Supabase Sync Resume Link Error]", error);
              }, (e) => console.warn("[Supabase Sync Resume Link]", e));
            }
          }
        } catch (err) { console.warn("[Supabase Portfolio Links Load]", err); }

        // 13. Career Timeline (Milestones)
        try {
          const tmData = tmRes.status === 'fulfilled' ? tmRes.value.data : null;
          let remoteMilestones: TimelineMilestone[] = [];
          if (tmData && Array.isArray(tmData) && tmData.length > 0) {
            // Delete demo milestones from database if present
            for (const m of tmData) {
              if (isDemoId(m.id) || isDemoTitle(m.title) || isDemoItem(m)) {
                supabase.from('career_timeline').delete().eq('id', m.id).then(() => {}, () => {});
              }
            }
            remoteMilestones = tmData.filter(m => !isDemoId(m.id) && !isDemoTitle(m.title) && !isDemoItem(m)).map(m => ({
              id: m.id,
              title: m.title,
              date: m.date,
              category: m.category || 'experience',
              type: m.category || 'experience',
              intensity: m.intensity || 'medium',
              description: m.description || ''
            }));
          }

          let localMilestones: TimelineMilestone[] = [];
          try {
            const raw = localStorage.getItem(`${email}_milestones`);
            if (raw) localMilestones = JSON.parse(raw);
          } catch (_) {}

          // Convert education items to timeline milestones
          const eduList = (eRes.status === 'fulfilled' && Array.isArray(eRes.value?.data) && eRes.value.data.length > 0)
            ? eRes.value.data
            : (education || []);
          const eduTimeline = eduList.filter((ed: any) => !isDemoItem(ed)).map((ed: any) => ({
            id: `auto-edu-${ed.id}`,
            title: `${ed.degree || 'Degree'}${ed.field_of_study || ed.fieldOfStudy ? ` in ${ed.field_of_study || ed.fieldOfStudy}` : ''} at ${ed.institution || 'University'}`,
            date: ed.start_date || ed.startDate || (ed.start_year || ed.startYear ? `${ed.start_year || ed.startYear}-06` : (ed.end_year || ed.endYear ? `${ed.end_year || ed.endYear}-05` : new Date().toISOString().substring(0, 7))),
            category: 'education' as const,
            type: 'education' as const,
            intensity: 'medium' as const,
            description: `${ed.degree || 'Degree'} program at ${ed.institution || 'Institution'}${ed.grade ? ` (Score: ${ed.grade})` : ''}.`
          }));

          // Convert experience items to timeline milestones
          const expList = (expRes.status === 'fulfilled' && Array.isArray(expRes.value?.data) && expRes.value.data.length > 0)
            ? expRes.value.data
            : (experience || []);
          const expTimeline = expList.filter((e: any) => !isDemoItem(e)).map((e: any) => ({
            id: `auto-exp-${e.id}`,
            title: `${e.role || 'Role'} at ${e.company || 'Company'}`,
            date: e.start_date || e.startDate || new Date().toISOString().substring(0, 7),
            category: 'experience' as const,
            type: 'experience' as const,
            intensity: (e.is_current || e.isCurrent ? 'high' : 'medium') as 'high' | 'medium' | 'low',
            description: Array.isArray(e.description) && e.description.length > 0 ? e.description.join(' ') : (e.role ? `${e.role} role at ${e.company || 'Company'}.` : '')
          }));

          // Current Job timeline
          const activeJob = (jobRes.status === 'fulfilled' && jobRes.value?.data) ? jobRes.value.data : currentJob;
          const curJobTimeline = (activeJob && (activeJob.company || activeJob.employer) && activeJob.role && !isDemoItem(activeJob)) ? [{
            id: 'auto-current-job',
            title: `${activeJob.role} at ${activeJob.company || activeJob.employer}`,
            date: activeJob.joining_date || activeJob.joiningDate || activeJob.startDate || new Date().toISOString().substring(0, 7),
            category: 'experience' as const,
            type: 'experience' as const,
            intensity: 'high' as const,
            description: activeJob.description || `Active role in ${activeJob.department || 'the organization'}.`
          }] : [];

          const allMilestones = deduplicateMilestones([
            ...remoteMilestones,
            ...localMilestones,
            ...(milestones || []),
            ...expTimeline,
            ...eduTimeline,
            ...curJobTimeline
          ]).filter(m => !isDemoId(m.id) && !isDemoTitle(m.title) && !isDemoItem(m));

          setMilestones(allMilestones);
          if (currentUser?.email) {
            safeLocalStorageSetItem(`${currentUser.email.toLowerCase().trim()}_milestones`, JSON.stringify(allMilestones));
            heavyStorage.set(`${currentUser.email.toLowerCase().trim()}_milestones`, allMilestones).catch(() => {});
          }

          // Bidirectional sync: Push all milestones to Supabase career_timeline table
          if (userId && allMilestones.length > 0) {
            for (const m of allMilestones) {
              const targetId = ensureUUID(m.id);
              const mDate = m.date || new Date().toISOString().substring(0, 7);
              supabase.from('career_timeline').upsert({
                id: targetId,
                user_id: userId,
                title: m.title || 'Career Milestone',
                date: mDate.length === 4 ? `${mDate}-06` : mDate,
                category: m.category || m.type || 'experience',
                intensity: m.intensity || 'medium',
                description: m.description || '',
                is_public: true
              }).then(({ error }) => {
                if (error) console.error("[Supabase Sync Milestone Error]", error);
              }, (e) => console.warn("[Supabase Sync Milestone]", e));
            }
          }
        } catch (err) { console.warn("[Supabase Timeline Load]", err); }

        // 14. Contacts
        try {
          const ctData = ctRes.status === 'fulfilled' ? ctRes.value.data : null;
          let localContacts: Contact[] = [];
          if (email) {
            try {
              const raw = localStorage.getItem(`${email}_contacts`);
              if (raw) localContacts = JSON.parse(raw);
            } catch (_) {}
          }
          const remoteContacts = (ctData && Array.isArray(ctData)) ? ctData.map(ct => ({
            id: ct.id,
            name: ct.name,
            email: ct.email,
            phone: ct.phone,
            role: ct.role,
            company: ct.company,
            relationship: ct.category,
            category: (ct.category || 'other') as 'recruiter' | 'mentor' | 'colleague' | 'client' | 'other',
            relationshipStrength: ct.relationship_strength ?? ct.relationshipStrength ?? 3,
            status: (ct.status || 'active') as 'active' | 'cold' | 'hot' | 'on-hold',
            location: ct.location,
            notes: ct.notes,
            lastInteracted: ct.last_interacted || '',
            interactionLogs: ct.interaction_logs || []
          })) : [];

          const updatedContacts = deduplicateContacts([...remoteContacts, ...localContacts, ...(contacts || [])]);
          setContacts(updatedContacts);
          if (currentUser?.email) {
            const em = currentUser.email.toLowerCase().trim();
            safeLocalStorageSetItem(`${em}_contacts`, JSON.stringify(updatedContacts));
            heavyStorage.set(`${em}_contacts`, updatedContacts).catch(() => {});
          }

          if (userId && updatedContacts.length > 0) {
            for (const ct of updatedContacts) {
              const targetId = ensureUUID(ct.id);
              supabase.from('contacts').upsert({
                id: targetId,
                user_id: userId,
                name: ct.name,
                email: ct.email || '',
                phone: ct.phone || '',
                role: ct.role || '',
                company: ct.company || '',
                relationship: ct.relationship || ct.category || 'Professional',
                category: ct.category || ct.relationship || 'Professional',
                relationship_strength: ct.relationshipStrength ?? 3,
                status: ct.status || 'active',
                location: ct.location || '',
                notes: ct.notes || '',
                last_interacted: ct.lastInteracted || '',
                interaction_logs: ct.interactionLogs || []
              }).then(({ error }) => {
                if (error) console.error("[Supabase Sync Contact Error]", error);
              }, (e) => console.warn("[Supabase Sync Contact]", e));
            }
          }
        } catch (err) { console.warn("[Supabase Contacts Load]", err); }

        // 15. Calendar Events
        try {
          const calData = calRes.status === 'fulfilled' ? calRes.value.data : null;
          if (calData && Array.isArray(calData) && calData.length > 0) {
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
            const merged = deduplicateCalendarEvents(mapped);
            setCalendarEvents(merged);
            const em = currentUser?.email?.toLowerCase().trim() || email;
            if (em) {
              safeLocalStorageSetItem(`${em}_calendar_events`, JSON.stringify(merged));
              heavyStorage.set(`${em}_calendar_events`, merged).catch(() => {});
            }
          }
        } catch (err) { console.warn("[Supabase Calendar Events Load]", err); }

        // 16. Achievements
        try {
          const aData = aRes.status === 'fulfilled' ? aRes.value.data : null;
          let localAchievements: Achievement[] = [];
          if (email) {
            try {
              const raw = localStorage.getItem(`${email}_achievements`);
              if (raw) localAchievements = JSON.parse(raw);
            } catch (_) {}
          }
          const remoteAchievements = (aData && Array.isArray(aData)) ? aData.map(a => ({
            id: a.id,
            title: a.title,
            issuer: a.issuer,
            date: a.date,
            description: a.description,
            badgeUrl: a.badge_url,
            fileName: a.file_name,
            fileUrl: a.file_url,
            isPublic: a.is_public !== false && a.is_public !== 'false' && (a.is_public as any) !== 0 && (a.is_public as any) !== '0'
          })) : [];

          const mergedAch = deduplicateAchievements([...remoteAchievements, ...localAchievements, ...(achievements || [])]);
          setAchievements(mergedAch);
          if (currentUser?.email) {
            const em = currentUser.email.toLowerCase().trim();
            safeLocalStorageSetItem(`${em}_achievements`, JSON.stringify(mergedAch));
            heavyStorage.set(`${em}_achievements`, mergedAch).catch(() => {});
          }

          if (userId && mergedAch.length > 0) {
            for (const ach of mergedAch) {
              const targetId = ensureUUID(ach.id);
              supabase.from('achievements').upsert({
                id: targetId,
                user_id: userId,
                title: ach.title,
                issuer: ach.issuer,
                date: ach.date,
                description: ach.description,
                badge_url: ach.badgeUrl,
                is_public: ach.isPublic !== false
              }).then(({ error }) => {
                if (error) console.error("[Supabase Sync Achievement Error]", error);
              }, (e) => console.warn("[Supabase Sync Achievement]", e));
            }
          }
        } catch (err) { console.warn("[Supabase Achievements Load]", err); }

        // 17. Testimonials
        try {
          const tData = tRes.status === 'fulfilled' ? tRes.value.data : null;
          let localTestimonials: Testimonial[] = [];
          if (email) {
            try {
              const raw = localStorage.getItem(`${email}_testimonials`);
              if (raw) localTestimonials = JSON.parse(raw);
            } catch (_) {}
          }
          const remoteTestimonials = (tData && Array.isArray(tData)) ? tData.map(t => ({
            id: t.id,
            name: t.name,
            company: t.company,
            role: t.role,
            text: t.text,
            relationship: t.relationship,
            avatarColor: t.avatar_color,
            isPublic: t.is_public !== false
          })) : [];

          const mergedTestimonials = deduplicateTestimonials([...remoteTestimonials, ...localTestimonials, ...(testimonials || [])]);
          setTestimonials(mergedTestimonials);
          if (currentUser?.email) {
            const em = currentUser.email.toLowerCase().trim();
            safeLocalStorageSetItem(`${em}_testimonials`, JSON.stringify(mergedTestimonials));
            heavyStorage.set(`${em}_testimonials`, mergedTestimonials).catch(() => {});
          }

          if (userId && mergedTestimonials.length > 0) {
            for (const t of mergedTestimonials) {
              const targetId = ensureUUID(t.id);
              supabase.from('testimonials').upsert({
                id: targetId,
                user_id: userId,
                name: t.name,
                company: t.company,
                role: t.role,
                text: t.text,
                relationship: t.relationship,
                avatar_color: t.avatarColor,
                is_public: t.isPublic !== false
              }).then(({ error }) => {
                if (error) console.error("[Supabase Sync Testimonial Error]", error);
              }, (e) => console.warn("[Supabase Sync Testimonial]", e));
            }
          }
        } catch (err) { console.warn("[Supabase Testimonials Load]", err); }
      } catch (globalErr) {
        console.warn("[Supabase DB] Error in batch loading records:", globalErr);
      }
    };

    loadSupabaseUserData();
  }, [currentUser]);

  const getActiveUserId = async (): Promise<string | null> => {
    if (currentUser?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id)) {
      return currentUser.id;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) return session.user.id;
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) return user.id;
    } catch (e) {}

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail()?.toLowerCase().trim();
    if (email) {
      try {
        const { data: p } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', email)
          .maybeSingle();
        if (p?.user_id) return p.user_id;
      } catch (e) {}
    }

    if (email === 'ramachandramurthymamidipalli@gmail.com' || email === 'ramachandramurthymamidipalli1@gmail.com') {
      return 'f2efad04-8105-4169-8dcb-c9411e553cc0';
    }
    return currentUser?.id || null;
  };

  // Current Job
  const handleUpdateCurrentJob = async (newJob: CurrentJob) => {
    const isDelete = !newJob.role && !newJob.company && !newJob.employer;

    if (isDelete) {
      const emptyJob: CurrentJob = {
        company: '',
        employer: '',
        role: '',
        department: '',
        employeeId: '',
        joiningDate: '',
        startDate: '',
        location: '',
        locationType: undefined,
        employmentType: undefined,
        salary: '',
        manager: '',
        description: '',
        currentProjects: [],
        dailyStandupText: '',
        weeklyGoals: []
      };
      setCurrentJob(emptyJob);
      const email = currentUser?.email?.toLowerCase().trim();
      if (email) {
        safeLocalStorageSetItem(`${email}_current_job`, JSON.stringify(emptyJob));
      }

      const userId = await getActiveUserId();
      if (userId) {
        try {
          const { error } = await supabase.from('current_jobs').delete().eq('user_id', userId);
          if (error) {
            console.error("[Supabase Current Job Delete Error]", error);
            triggerToast(`Delete error: ${error.message}`);
          } else {
            triggerToast("Current Job deleted from Supabase!");
          }
        } catch (err) { console.warn("[Supabase Current Job Delete Exception]", err); }
      } else {
        triggerToast("Current Job cleared locally.");
      }
      return;
    }

    const empName = newJob.company || newJob.employer || 'Current Employer';
    const roleTitle = newJob.role || 'Current Role';
    const joinDate = newJob.joiningDate || newJob.startDate || new Date().toISOString().substring(0, 10);
    const empType = newJob.employmentType || 'full-time';

    const normalizedJob: CurrentJob = {
      ...newJob,
      company: empName,
      employer: empName,
      role: roleTitle,
      joiningDate: joinDate,
      startDate: joinDate,
      employmentType: empType,
      contractCompany: newJob.employmentType === 'contract' ? (newJob.contractCompany || '').trim() : '',
      weeklyGoals: Array.isArray(newJob.weeklyGoals) ? newJob.weeklyGoals : [],
      currentProjects: Array.isArray(newJob.currentProjects) ? newJob.currentProjects : [],
      dailyStandupText: newJob.dailyStandupText || ''
    };

    setCurrentJob(normalizedJob);
    const email = currentUser?.email?.toLowerCase().trim();
    if (email) {
      safeLocalStorageSetItem(`${email}_current_job`, JSON.stringify(normalizedJob));
      heavyStorage.set(`${email}_current_job`, normalizedJob).catch(() => {});
    }

    const userId = await getActiveUserId();
    if (userId) {
      try {
        const metadataJson = JSON.stringify({
          rawDescription: normalizedJob.description || '',
          contractCompany: normalizedJob.contractCompany || '',
          dailyStandupText: normalizedJob.dailyStandupText || '',
          weeklyGoals: normalizedJob.weeklyGoals || [],
          currentProjects: normalizedJob.currentProjects || []
        });

        const basePayload: any = {
          user_id: userId,
          company: empName,
          role: roleTitle,
          department: normalizedJob.department || '',
          employee_id: normalizedJob.employeeId || '',
          joining_date: joinDate,
          location: normalizedJob.location || normalizedJob.locationType || '',
          employment_type: empType,
          salary: normalizedJob.salary || '',
          manager: normalizedJob.manager || '',
          description: metadataJson,
          updated_at: new Date().toISOString()
        };

        const fullPayload = {
          ...basePayload,
          contract_company: normalizedJob.contractCompany || '',
          daily_standup_text: normalizedJob.dailyStandupText || '',
          weekly_goals: normalizedJob.weeklyGoals || [],
          current_projects: normalizedJob.currentProjects || []
        };

        let upsertResult = await supabase.from('current_jobs').upsert(fullPayload, { onConflict: 'user_id' });
        if (upsertResult.error && (upsertResult.error.message?.includes('column') || (upsertResult.error as any).code === 'PGRST204')) {
          upsertResult = await supabase.from('current_jobs').upsert(basePayload, { onConflict: 'user_id' });
        }

        if (upsertResult.error) {
          console.warn("[Supabase Current Job Upsert Fallback]", upsertResult.error);
          const { data: existing } = await supabase
            .from('current_jobs')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (existing && existing.id) {
            let updateRes = await supabase.from('current_jobs').update(fullPayload).eq('id', existing.id);
            if (updateRes.error) {
              updateRes = await supabase.from('current_jobs').update(basePayload).eq('id', existing.id);
            }
            if (updateRes.error) {
              console.error("[Supabase Current Job Update Error]", updateRes.error);
              triggerToast(`Current Job Error: ${updateRes.error.message}`);
            } else {
              triggerToast("Current Job and Workspace Board saved to Supabase successfully!");
            }
          } else {
            let insRes = await supabase.from('current_jobs').insert({
              id: generateUUID(),
              ...fullPayload
            });
            if (insRes.error) {
              insRes = await supabase.from('current_jobs').insert({
                id: generateUUID(),
                ...basePayload
              });
            }
            if (insRes.error) {
              console.error("[Supabase Current Job Insert Error]", insRes.error);
              triggerToast(`Current Job Error: ${insRes.error.message}`);
            } else {
              triggerToast("Current Job inserted to Supabase successfully!");
            }
          }
        } else {
          triggerToast("Current Job synchronized with Supabase!");
        }

        const curJobMilestoneId = ensureUUID('auto-current-job');
        await supabase.from('career_timeline').upsert({
          id: curJobMilestoneId,
          user_id: userId,
          title: `${roleTitle} at ${empName}`,
          date: joinDate.substring(0, 7),
          category: 'experience',
          intensity: 'high',
          description: newJob.description || `Active role in ${newJob.department || 'the organization'}.`,
          is_public: true
        });
      } catch (err) { console.warn("[Supabase Current Job Exception]", err); }
    } else {
      triggerToast("Job updated locally (Sign in to sync with Supabase)");
    }
  };

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
    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      if (newProfile.avatarUrl) {
        try {
          safeLocalStorageSetItem(`${email}_avatar_cache`, newProfile.avatarUrl);
        } catch (_) {}
      } else {
        try {
          localStorage.removeItem(`${email}_avatar_cache`);
        } catch (_) {}
      }
      safeLocalStorageSetItem(`${email}_profile`, JSON.stringify(newProfile));
      heavyStorage.set(`${email}_profile`, newProfile).catch(() => {});
      if (newProfile.shareSlug) {
        safeLocalStorageSetItem(`nexus_cache_profile_${newProfile.shareSlug}`, JSON.stringify(newProfile));
        if (newProfile.publicProfile === false) {
          try {
            localStorage.removeItem(`nexus_cache_skills_${newProfile.shareSlug}`);
            localStorage.removeItem(`nexus_cache_experience_${newProfile.shareSlug}`);
            localStorage.removeItem(`nexus_cache_certs_${newProfile.shareSlug}`);
            localStorage.removeItem(`nexus_cache_projects_${newProfile.shareSlug}`);
            localStorage.removeItem(`nexus_cache_education_${newProfile.shareSlug}`);
            localStorage.removeItem(`nexus_cache_achievements_${newProfile.shareSlug}`);
            localStorage.removeItem(`nexus_cache_testimonials_${newProfile.shareSlug}`);
            localStorage.removeItem(`nexus_cache_links_${newProfile.shareSlug}`);
            localStorage.removeItem(`nexus_cache_calendar_events_${newProfile.shareSlug}`);
          } catch (_) {}
          apiFetch(`/api/share/${newProfile.shareSlug}`, { method: 'DELETE' }).catch(() => {});
        }
      }
    }

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('profiles').upsert({
          user_id: userId,
          email: newProfile.email || currentUser?.email || email || '',
          first_name: newProfile.firstName || '',
          last_name: newProfile.lastName || '',
          name: newProfile.name || '',
          headline: newProfile.headline || '',
          bio: newProfile.bio || '',
          phone: newProfile.phone || '',
          secondary_email: newProfile.secondaryEmail || '',
          secondary_phone: newProfile.secondaryPhone || '',
          location: newProfile.location || '',
          avatar_url: newProfile.avatarUrl || '',
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
    const sanitizedExp = typeof newSk.yearsOfExp === 'number' ? newSk.yearsOfExp : (parseInt(String(newSk.yearsOfExp), 10) || 0);
    const skill: Skill = { ...newSk, id, yearsOfExp: sanitizedExp };
    
    setSkills(prev => {
      const updatedSkills = deduplicateSkills([skill, ...prev]);
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        safeLocalStorageSetItem(`${email}_skills`, JSON.stringify(updatedSkills));
        heavyStorage.set(`${email}_skills`, updatedSkills).catch(() => {});
      }
      return updatedSkills;
    });
    triggerToast(`Added skill capability: ${newSk.name}`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('skills').insert({
          id,
          user_id: userId,
          name: newSk.name,
          category: newSk.category || 'Technical',
          proficiency: newSk.proficiency || 'Intermediate',
          years_of_exp: sanitizedExp,
          endorsements: newSk.endorsements || 0,
          description: newSk.description || '',
          visibility: newSk.visibility || 'public'
        });
      } catch (err) { console.warn("[Supabase Add Skill Error]", err); }
    }
  };

  const handleUpdateSkill = async (upSkill: Skill) => {
    const targetId = ensureUUID(upSkill.id);
    const sanitizedExp = typeof upSkill.yearsOfExp === 'number' ? upSkill.yearsOfExp : (parseInt(String(upSkill.yearsOfExp), 10) || 0);
    const updatedSkill: Skill = { ...upSkill, id: targetId, yearsOfExp: sanitizedExp };

    setSkills(prev => {
      const updatedSkills = prev.map(s => {
        const isMatch = s.id === upSkill.id || s.id === targetId || toUUID(s.id) === targetId || 
          (s.name && upSkill.name && s.name.trim().toLowerCase() === upSkill.name.trim().toLowerCase());
        return isMatch ? updatedSkill : s;
      });
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        safeLocalStorageSetItem(`${email}_skills`, JSON.stringify(updatedSkills));
        heavyStorage.set(`${email}_skills`, updatedSkills).catch(() => {});
      }
      return updatedSkills;
    });
    triggerToast(`Updated skill: ${upSkill.name}`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('skills').upsert({
          id: targetId,
          user_id: userId,
          name: upSkill.name,
          category: upSkill.category || 'Technical',
          proficiency: upSkill.proficiency || 'Intermediate',
          years_of_exp: sanitizedExp,
          endorsements: upSkill.endorsements || 0,
          description: upSkill.description || '',
          visibility: upSkill.visibility || 'public',
          updated_at: new Date().toISOString()
        });
      } catch (err) { console.warn("[Supabase Update Skill Error]", err); }
    }
  };

  // Old Data (30-day retention) preservation helper
  const addDeletedItem = (
    originalItem: any,
    itemType: DeletedItem['itemType'],
    title: string,
    subtitle?: string
  ) => {
    if (!originalItem) return;
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days retention
    const newItem: DeletedItem = {
      id: generateUUID(),
      originalId: originalItem.id || generateUUID(),
      itemType,
      title: title || 'Deleted Record',
      subtitle: subtitle || undefined,
      deletedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      data: originalItem
    };

    setOldData(prev => {
      const filtered = prev.filter(p => p.originalId !== newItem.originalId && !(p.itemType === itemType && p.title.toLowerCase() === newItem.title.toLowerCase()));
      const updated = [newItem, ...filtered];
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        safeLocalStorageSetItem(`${email}_old_data`, JSON.stringify(updated));
        heavyStorage.set(`${email}_old_data`, updated).catch(() => {});
      }
      return updated;
    });
  };

  const handleDeleteSkill = async (id: string) => {
    const targetId = toUUID(id);
    let targetSkillName = '';

    const targetItem = skills.find(s => s.id === id || s.id === targetId || toUUID(s.id) === targetId);
    if (targetItem) {
      addDeletedItem(targetItem, 'skill', targetItem.name || 'Skill', `${targetItem.yearsOfExp || 1} yrs exp`);
    }

    setSkills(prev => {
      const target = prev.find(s => s.id === id || s.id === targetId || toUUID(s.id) === targetId);
      targetSkillName = target?.name ? target.name.trim().toLowerCase() : '';
      
      const updated = prev.filter(s => {
        if (s.id === id || s.id === targetId || toUUID(s.id) === targetId) return false;
        if (targetSkillName && s.name && s.name.trim().toLowerCase() === targetSkillName) return false;
        return true;
      });

      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        safeLocalStorageSetItem(`${email}_skills`, JSON.stringify(updated));
        heavyStorage.set(`${email}_skills`, updated).catch(() => {});
      }
      return updated;
    });

    triggerToast(`Skill removed successfully.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('skills').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('skills').delete().eq('id', id).eq('user_id', userId);
        }
        if (targetSkillName) {
          await supabase.from('skills').delete().ilike('name', targetSkillName).eq('user_id', userId);
        }
      } catch (err) { console.warn("[Supabase Delete Skill Error]", err); }
    }
  };

  // Education
  const handleAddEdu = async (newEd: Omit<Education, 'id'>) => {
    const id = generateUUID();
    const eduItem: Education = { ...newEd, id };
    setEducation(prev => {
      const updated = deduplicateEducation([eduItem, ...prev]);
      if (currentUser?.email) {
        const email = currentUser.email.toLowerCase().trim();
        safeLocalStorageSetItem(`${email}_education`, JSON.stringify(updated));
        heavyStorage.set(`${email}_education`, updated).catch(e => {});
      }
      return updated;
    });
    triggerToast(`Appended academic credential: ${newEd.degree}`);

    const userId = await getActiveUserId();
    if (userId) {
      const descPayload = JSON.stringify({
        activities: newEd.activities || '',
        enrollmentId: newEd.enrollmentId || '',
        startDate: newEd.startDate || '',
        endDate: newEd.endDate || '',
        specialization: newEd.specialization || '',
        isCurrentlyPursuing: !!newEd.isCurrentlyPursuing
      });
      const cleanPayload: any = {
        id,
        user_id: userId,
        degree: newEd.degree,
        institution: newEd.institution,
        field_of_study: newEd.fieldOfStudy,
        start_year: newEd.startYear,
        end_year: newEd.endYear,
        grade: newEd.grade,
        percentage: newEd.percentage,
        description: descPayload
      };
      const extendedPayload: any = {
        ...cleanPayload,
        enrollment_id: newEd.enrollmentId || '',
        start_date: newEd.startDate || '',
        end_date: newEd.endDate || '',
        specialization: newEd.specialization || '',
        is_currently_pursuing: !!newEd.isCurrentlyPursuing,
        activities: newEd.activities || ''
      };
      try {
        const { error } = await supabase.from('education').insert(extendedPayload);
        if (error) {
          console.warn("[Supabase Add Edu extended schema error, falling back to clean payload]", error);
          const { error: fallbackErr } = await supabase.from('education').insert(cleanPayload);
          if (fallbackErr) {
            console.warn("[Supabase Add Edu fallback error]", fallbackErr);
          }
        }
      } catch (err) {
        try {
          await supabase.from('education').insert(cleanPayload);
        } catch (e) { console.warn("[Supabase Add Edu Error]", e); }
      }

      // Sync milestone to career_timeline
      try {
        const milestoneDate = newEd.startDate || (newEd.startYear ? `${newEd.startYear}-06` : (newEd.endYear ? `${newEd.endYear}-05` : new Date().toISOString().substring(0, 7)));
        await supabase.from('career_timeline').upsert({
          id: ensureUUID(`auto-edu-${id}`),
          user_id: userId,
          title: `${newEd.degree}${newEd.fieldOfStudy ? ` in ${newEd.fieldOfStudy}` : ''} at ${newEd.institution}`,
          date: milestoneDate.length === 4 ? `${milestoneDate}-06` : milestoneDate,
          category: 'education',
          intensity: 'medium',
          description: `${newEd.degree} program at ${newEd.institution}${newEd.grade ? ` (Score: ${newEd.grade})` : ''}.`,
          is_public: true
        });
      } catch (mErr) { console.warn("[Supabase Career Timeline Edu Sync Error]", mErr); }
    }
  };

  const handleDeleteEdu = async (id: string) => {
    const targetId = toUUID(id);
    let targetDegree = '';
    let targetInst = '';

    const targetItem = education.find(e => e.id === id || e.id === targetId || toUUID(e.id) === targetId);
    if (targetItem) {
      addDeletedItem(targetItem, 'education', targetItem.degree || 'Education', targetItem.institution);
    }

    setEducation(prev => {
      const target = prev.find(e => e.id === id || e.id === targetId || toUUID(e.id) === targetId);
      targetDegree = (target?.degree || '').trim().toLowerCase();
      targetInst = (target?.institution || '').trim().toLowerCase();

      const updated = prev.filter(e => {
        if (e.id === id || e.id === targetId || toUUID(e.id) === targetId) return false;
        if (targetDegree && targetInst && (e.degree || '').trim().toLowerCase() === targetDegree && (e.institution || '').trim().toLowerCase() === targetInst) {
          return false;
        }
        return true;
      });

      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        safeLocalStorageSetItem(`${email}_education`, JSON.stringify(updated));
        heavyStorage.set(`${email}_education`, updated).catch(e => {});
      }
      return updated;
    });

    triggerToast(`Removed academic snapshot.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('education').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('education').delete().eq('id', id).eq('user_id', userId);
        }
        if (targetDegree && targetInst) {
          await supabase.from('education').delete().ilike('degree', targetDegree).ilike('institution', targetInst).eq('user_id', userId);
        }
        await supabase.from('career_timeline').delete().eq('id', ensureUUID(`auto-edu-${id}`)).eq('user_id', userId);
        if (targetId) await supabase.from('career_timeline').delete().eq('id', ensureUUID(`auto-edu-${targetId}`)).eq('user_id', userId);
      } catch (err) { console.warn("[Supabase Delete Edu Error]", err); }
    }
  };

  const handleUpdateEdu = async (updatedEd: Education) => {
    const targetId = ensureUUID(updatedEd.id);
    const item = { ...updatedEd, id: targetId };
    setEducation(prev => {
      const updated = prev.map(e => (e.id === updatedEd.id || e.id === targetId || (e.degree === updatedEd.degree && e.institution === updatedEd.institution)) ? item : e);
      if (currentUser?.email) {
        const email = currentUser.email.toLowerCase().trim();
        safeLocalStorageSetItem(`${email}_education`, JSON.stringify(updated));
        heavyStorage.set(`${email}_education`, updated).catch(e => {});
      }
      return updated;
    });
    triggerToast(`Updated academic credential: ${updatedEd.degree}`);

    const userId = await getActiveUserId();
    if (userId) {
      const descPayload = JSON.stringify({
        activities: updatedEd.activities || '',
        enrollmentId: updatedEd.enrollmentId || '',
        startDate: updatedEd.startDate || '',
        endDate: updatedEd.endDate || '',
        specialization: updatedEd.specialization || '',
        isCurrentlyPursuing: !!updatedEd.isCurrentlyPursuing
      });
      const cleanPayload: any = {
        id: targetId,
        user_id: userId,
        degree: updatedEd.degree,
        institution: updatedEd.institution,
        field_of_study: updatedEd.fieldOfStudy,
        start_year: updatedEd.startYear,
        end_year: updatedEd.endYear,
        grade: updatedEd.grade,
        percentage: updatedEd.percentage,
        description: descPayload
      };
      const extendedPayload: any = {
        ...cleanPayload,
        enrollment_id: updatedEd.enrollmentId || '',
        start_date: updatedEd.startDate || '',
        end_date: updatedEd.endDate || '',
        specialization: updatedEd.specialization || '',
        is_currently_pursuing: !!updatedEd.isCurrentlyPursuing,
        activities: updatedEd.activities || ''
      };
      try {
        const { error } = await supabase.from('education').upsert(extendedPayload);
        if (error) {
          console.warn("[Supabase Update Edu extended schema error, falling back to clean payload]", error);
          const { error: fallbackErr } = await supabase.from('education').upsert(cleanPayload);
          if (fallbackErr) {
            console.warn("[Supabase Update Edu fallback error]", fallbackErr);
          }
        }
      } catch (err) {
        try {
          await supabase.from('education').upsert(cleanPayload);
        } catch (e) { console.warn("[Supabase Update Edu Error]", e); }
      }

      // Sync updated milestone to career_timeline
      try {
        const milestoneDate = updatedEd.startDate || (updatedEd.startYear ? `${updatedEd.startYear}-06` : (updatedEd.endYear ? `${updatedEd.endYear}-05` : new Date().toISOString().substring(0, 7)));
        await supabase.from('career_timeline').upsert({
          id: ensureUUID(`auto-edu-${targetId}`),
          user_id: userId,
          title: `${updatedEd.degree}${updatedEd.fieldOfStudy ? ` in ${updatedEd.fieldOfStudy}` : ''} at ${updatedEd.institution}`,
          date: milestoneDate.length === 4 ? `${milestoneDate}-06` : milestoneDate,
          category: 'education',
          intensity: 'medium',
          description: `${updatedEd.degree} program at ${updatedEd.institution}${updatedEd.grade ? ` (Score: ${updatedEd.grade})` : ''}.`,
          is_public: true
        });
      } catch (mErr) { console.warn("[Supabase Career Timeline Edu Sync Error]", mErr); }
    }
  };

  // Specialization Handlers
  const handleAddSpecialization = async (name: string) => {
    const id = generateUUID();
    const item: Specialization = {
      id,
      name,
      createdAt: new Date().toISOString()
    };

    setSpecializations(prev => {
      const updated = deduplicateSpecializations([item, ...prev]);
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        safeLocalStorageSetItem(`${email}_specializations`, JSON.stringify(updated));
        heavyStorage.set(`${email}_specializations`, updated).catch(() => {});
      }
      return updated;
    });

    triggerToast(`Added specialization: ${name}`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('specializations').insert({
          id,
          user_id: userId,
          name
        });
      } catch (err) {
        console.warn("[Supabase Add Specialization Error]", err);
      }
    }
  };

  const handleUpdateSpecialization = async (updatedItem: Specialization) => {
    const targetId = ensureUUID(updatedItem.id);
    const item: Specialization = { ...updatedItem, id: targetId };

    setSpecializations(prev => {
      const updated = prev.map(s => (s.id === updatedItem.id || s.id === targetId || toUUID(s.id) === targetId || (s.name && s.name.trim().toLowerCase() === updatedItem.name.trim().toLowerCase())) ? item : s);
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        safeLocalStorageSetItem(`${email}_specializations`, JSON.stringify(updated));
        heavyStorage.set(`${email}_specializations`, updated).catch(() => {});
      }
      return updated;
    });

    triggerToast(`Updated specialization: ${updatedItem.name}`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('specializations').upsert({
          id: targetId,
          user_id: userId,
          name: updatedItem.name
        });
      } catch (err) {
        console.warn("[Supabase Update Specialization Error]", err);
      }
    }
  };

  const handleDeleteSpecialization = async (id: string) => {
    const targetId = toUUID(id);
    let targetName = '';

    const targetItem = specializations.find(s => s.id === id || s.id === targetId || toUUID(s.id) === targetId);
    if (targetItem) {
      addDeletedItem(targetItem, 'specialization', targetItem.name || 'Specialization');
    }

    setSpecializations(prev => {
      const target = prev.find(s => s.id === id || s.id === targetId || toUUID(s.id) === targetId);
      targetName = target?.name ? target.name.trim().toLowerCase() : '';

      const updated = prev.filter(s => {
        if (s.id === id || s.id === targetId || toUUID(s.id) === targetId) return false;
        if (targetName && s.name && s.name.trim().toLowerCase() === targetName) return false;
        return true;
      });

      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        safeLocalStorageSetItem(`${email}_specializations`, JSON.stringify(updated));
        heavyStorage.set(`${email}_specializations`, updated).catch(() => {});
      }
      return updated;
    });

    triggerToast(`Specialization removed.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('specializations').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('specializations').delete().eq('id', id).eq('user_id', userId);
        }
        if (targetName) {
          await supabase.from('specializations').delete().ilike('name', targetName).eq('user_id', userId);
        }
      } catch (err) {
        console.warn("[Supabase Delete Specialization Error]", err);
      }
    }
  };

  // Certifications
  const handleAddCert = async (newCert: Omit<Certification, 'id'>) => {
    const id = generateUUID();
    const dVal = newCert.dateIssued || newCert.issueDate || '';
    const cert: Certification = { ...newCert, id, dateIssued: dVal, issueDate: dVal };
    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    setCertifications(prev => {
      const updatedCerts = deduplicateCertifications([cert, ...prev]);
      if (email) {
        safeLocalStorageSetItem(`${email}_certs`, JSON.stringify(updatedCerts));
        heavyStorage.set(`${email}_certs`, updatedCerts).catch(e => {});
      }
      return updatedCerts;
    });
    triggerToast(`Added credential: ${newCert.title}`);

    const userId = await getActiveUserId();
    if (userId) {
      const payload: any = {
        id,
        user_id: userId,
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
      };
      let insertPayload = { ...payload };
      if (insertPayload.file_url && insertPayload.file_url.startsWith('data:') && insertPayload.file_url.length > 50000) {
        insertPayload.file_url = '';
      }
      try {
        const { error: insErr } = await supabase.from('certifications').upsert(insertPayload);
        if (insErr) {
          console.warn("[Supabase Add Cert Warning]", insErr);
          let retryPayload = { ...insertPayload };
          if (retryPayload.file_url) retryPayload.file_url = '';
          const { error: retryErr } = await supabase.from('certifications').upsert(retryPayload);
          if (retryErr) {
            // If schema lacks type or percentage columns, stash in description JSON
            const meta = { type: newCert.type || 'study', percentage: newCert.percentage || '', desc: newCert.description || '' };
            delete retryPayload.type;
            delete retryPayload.percentage;
            retryPayload.description = JSON.stringify(meta);
            await supabase.from('certifications').upsert(retryPayload);
          }
        }
      } catch (err) {
        console.warn("[Supabase Add Cert Exception]", err);
      }
    }
  };

  const handleDeleteCert = async (id: string) => {
    const targetId = toUUID(id);
    let targetTitle = '';
    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();

    const targetItem = certifications.find(c => c.id === id || c.id === targetId || toUUID(c.id) === targetId);
    if (targetItem) {
      addDeletedItem(targetItem, 'certification', targetItem.title || 'Certification', targetItem.issuer);
    }

    setCertifications(prev => {
      const target = prev.find(c => c.id === id || c.id === targetId || toUUID(c.id) === targetId);
      targetTitle = (target?.title || '').trim().toLowerCase();
      const updated = prev.filter(c => {
        if (c.id === id || c.id === targetId || toUUID(c.id) === targetId) return false;
        if (targetTitle && (c.title || '').trim().toLowerCase() === targetTitle) return false;
        return true;
      });
      if (email) {
        safeLocalStorageSetItem(`${email}_certs`, JSON.stringify(updated));
        heavyStorage.set(`${email}_certs`, updated).catch(e => {});
      }
      return updated;
    });
    triggerToast(`Wiped credential clearance.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('certifications').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('certifications').delete().eq('id', id).eq('user_id', userId);
        }
        if (targetTitle) {
          await supabase.from('certifications').delete().ilike('title', targetTitle).eq('user_id', userId);
        }
      } catch (err) { console.warn("[Supabase Delete Cert Error]", err); }
    }
  };

  const handleUpdateCert = async (updatedCert: Certification) => {
    const targetId = ensureUUID(updatedCert.id);
    const dVal = updatedCert.dateIssued || updatedCert.issueDate || '';
    const item = { ...updatedCert, id: targetId, dateIssued: dVal, issueDate: dVal };
    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    setCertifications(prev => {
      const updatedCerts = prev.map(c => (c.id === updatedCert.id || c.id === targetId) ? item : c);
      if (email) {
        safeLocalStorageSetItem(`${email}_certs`, JSON.stringify(updatedCerts));
        heavyStorage.set(`${email}_certs`, updatedCerts).catch(e => {});
      }
      return updatedCerts;
    });
    triggerToast(`Updated file attachment for: ${updatedCert.title}`);

    const userId = await getActiveUserId();
    if (userId) {
      const payload: any = {
        id: targetId,
        user_id: userId,
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
      };
      let updatePayload = { ...payload };
      if (updatePayload.file_url && updatePayload.file_url.startsWith('data:') && updatePayload.file_url.length > 50000) {
        updatePayload.file_url = '';
      }
      try {
        const { error: upErr } = await supabase.from('certifications').upsert(updatePayload);
        if (upErr) {
          console.warn("[Supabase Update Cert Warning]", upErr);
          let retryPayload = { ...updatePayload };
          if (retryPayload.file_url) retryPayload.file_url = '';
          const { error: retryErr } = await supabase.from('certifications').upsert(retryPayload);
          if (retryErr) {
            const meta = { type: updatedCert.type || 'study', percentage: updatedCert.percentage || '', desc: updatedCert.description || '' };
            delete retryPayload.type;
            delete retryPayload.percentage;
            retryPayload.description = JSON.stringify(meta);
            await supabase.from('certifications').upsert(retryPayload);
          }
        }
      } catch (err) {
        console.warn("[Supabase Update Cert Exception]", err);
      }
    }
  };

  // Experience
  const handleAddExp = async (newExp: Omit<Experience, 'id'>) => {
    const id = generateUUID();
    const exp: Experience = { ...newExp, id };
    setExperience(prev => deduplicateExperience([exp, ...prev]));
    triggerToast(`Registered employment tenure: ${newExp.role}`);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      const updated = deduplicateExperience([exp, ...experience]);
      safeLocalStorageSetItem(`${email}_experience`, JSON.stringify(updated));
      heavyStorage.set(`${email}_experience`, updated).catch(e => {});
    }

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('experience').insert({
          id,
          user_id: userId,
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

        // Sync milestone to career_timeline
        await supabase.from('career_timeline').upsert({
          id: ensureUUID(`auto-exp-${id}`),
          user_id: userId,
          title: `${newExp.role} at ${newExp.company}`,
          date: (newExp.startDate || new Date().toISOString().substring(0, 7)),
          category: 'experience',
          intensity: newExp.isCurrent ? 'high' : 'medium',
          description: Array.isArray(newExp.description) && newExp.description.length > 0 ? newExp.description.join(' ') : `${newExp.role} role at ${newExp.company}.`,
          is_public: true
        });
      } catch (err) { console.warn("[Supabase Add Exp Error]", err); }
    }
  };

  const handleUpdateExp = async (updatedExp: Experience) => {
    const targetId = ensureUUID(updatedExp.id);
    const item = { ...updatedExp, id: targetId };
    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();

    setExperience(prev => {
      const updated = prev.map(e => (e.id === updatedExp.id || e.id === targetId || toUUID(e.id) === targetId) ? item : e);
      if (email) {
        safeLocalStorageSetItem(`${email}_experience`, JSON.stringify(updated));
        heavyStorage.set(`${email}_experience`, updated).catch(e => {});
      }
      return updated;
    });

    triggerToast(`Updated career record: ${updatedExp.role}`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('experience').upsert({
          id: targetId,
          user_id: userId,
          company: updatedExp.company,
          role: updatedExp.role,
          employment_type: updatedExp.employmentType,
          location: updatedExp.location,
          start_date: updatedExp.startDate,
          end_date: updatedExp.endDate,
          is_current: updatedExp.isCurrent,
          description: updatedExp.description || [],
          skills_used: updatedExp.skillsUsed || [],
          links: updatedExp.links || []
        });

        // Sync milestone to career_timeline
        await supabase.from('career_timeline').upsert({
          id: ensureUUID(`auto-exp-${targetId}`),
          user_id: userId,
          title: `${updatedExp.role} at ${updatedExp.company}`,
          date: (updatedExp.startDate || new Date().toISOString().substring(0, 7)),
          category: 'experience',
          intensity: updatedExp.isCurrent ? 'high' : 'medium',
          description: Array.isArray(updatedExp.description) && updatedExp.description.length > 0 ? updatedExp.description.join(' ') : `${updatedExp.role} role at ${updatedExp.company}.`,
          is_public: true
        });
      } catch (err) {
        console.warn("[Supabase Update Exp Error]", err);
      }
    }
  };

  const handleDeleteExp = async (id: string) => {
    const targetId = toUUID(id);
    let targetRole = '';
    let targetCompany = '';

    const targetItem = experience.find(e => e.id === id || e.id === targetId || toUUID(e.id) === targetId);
    if (targetItem) {
      addDeletedItem(targetItem, 'experience', targetItem.role || 'Experience', targetItem.company);
    }

    setExperience(prev => {
      const target = prev.find(e => e.id === id || e.id === targetId || toUUID(e.id) === targetId);
      targetRole = (target?.role || '').trim().toLowerCase();
      targetCompany = (target?.company || '').trim().toLowerCase();

      const updated = prev.filter(e => {
        if (e.id === id || e.id === targetId || toUUID(e.id) === targetId) return false;
        if (targetRole && targetCompany && (e.role || '').trim().toLowerCase() === targetRole && (e.company || '').trim().toLowerCase() === targetCompany) {
          return false;
        }
        return true;
      });

      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        safeLocalStorageSetItem(`${email}_experience`, JSON.stringify(updated));
        heavyStorage.set(`${email}_experience`, updated).catch(e => {});
      }
      return updated;
    });

    triggerToast(`Cleared historic experience milestone.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('experience').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('experience').delete().eq('id', id).eq('user_id', userId);
        }
        if (targetRole && targetCompany) {
          await supabase.from('experience').delete().ilike('role', targetRole).ilike('company', targetCompany).eq('user_id', userId);
        }
        await supabase.from('career_timeline').delete().eq('id', ensureUUID(`auto-exp-${id}`)).eq('user_id', userId);
        if (targetId) await supabase.from('career_timeline').delete().eq('id', ensureUUID(`auto-edu-${targetId}`)).eq('user_id', userId);
      } catch (err) { console.warn("[Supabase Delete Exp Error]", err); }
    }
  };

  // Milestones / Career Timeline
  const handleAddMilestone = async (newMil: Omit<TimelineMilestone, 'id'>) => {
    const id = generateUUID();
    const mil: TimelineMilestone = { ...newMil, id };
    const updated = deduplicateMilestones([mil, ...milestones]);
    setMilestones(updated);
    const email = currentUser?.email?.toLowerCase().trim();
    if (email) {
      safeLocalStorageSetItem(`${email}_milestones`, JSON.stringify(updated));
    }

    const userId = await getActiveUserId();
    if (userId) {
      try {
        const payload = {
          id,
          user_id: userId,
          title: newMil.title || 'Career Milestone',
          date: newMil.date || new Date().toISOString().substring(0, 7),
          category: newMil.category || newMil.type || 'experience',
          intensity: newMil.intensity || 'medium',
          description: newMil.description || '',
          is_public: true
        };
        const { error } = await supabase.from('career_timeline').upsert(payload);
        if (error) {
          console.error("[Supabase Add Milestone Error]", error);
          triggerToast(`Milestone Error: ${error.message}`);
        } else {
          triggerToast("Career Milestone saved to Supabase!");
        }
      } catch (err) { console.warn("[Supabase Add Milestone Exception]", err); }
    } else {
      triggerToast("Milestone added locally (Sign in to sync with Supabase)");
    }
  };

  // Projects & Products & Others
  const handleAddProj = async (newPr: Omit<Project, 'id'>) => {
    const id = generateUUID();
    const proj: Project = { ...newPr, id };
    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    const userId = await getActiveUserId();

    const cleanPdf = (newPr.pdfUrl && newPr.pdfUrl.startsWith('data:') && newPr.pdfUrl.length > 50000) ? '' : (newPr.pdfUrl || '');
    const cleanImg = (newPr.imageUrl && newPr.imageUrl.startsWith('data:') && newPr.imageUrl.length > 50000) ? '' : (newPr.imageUrl || newPr.coverUrl || '');

    if (newPr.type === 'product') {
      const updatedProducts = deduplicateProjects([proj, ...products]);
      setProducts(updatedProducts);
      if (email) {
        safeLocalStorageSetItem(`${email}_products`, JSON.stringify(updatedProducts));
        heavyStorage.set(`${email}_products`, updatedProducts).catch(() => {});
      }
      triggerToast(`Published product assets: ${newPr.name}`);
      if (userId) {
        try {
          const payload = {
            id,
            user_id: userId,
            name: newPr.name,
            category: newPr.category || 'products',
            description: newPr.description || '',
            highlights: newPr.highlights || [],
            tech_stack: newPr.techStack || [],
            live_url: newPr.liveUrl || '',
            github_url: newPr.githubUrl || '',
            pdf_url: cleanPdf,
            image_url: cleanImg,
            is_public: newPr.isPublic !== false,
            date: newPr.date || ''
          };
          const { error } = await supabase.from('products').upsert(payload);
          if (error) {
            console.error("[Supabase Add Product Error]", error);
            triggerToast(`Product Error: ${error.message}`);
          }
        } catch (err) { console.warn("[Supabase Add Product Error]", err); }
      }
    } else if (newPr.type === 'other') {
      const updatedOthers = deduplicateProjects([proj, ...others]);
      setOthers(updatedOthers);
      if (email) {
        safeLocalStorageSetItem(`${email}_others`, JSON.stringify(updatedOthers));
        heavyStorage.set(`${email}_others`, updatedOthers).catch(() => {});
      }
      triggerToast(`Added document: ${newPr.name}`);
      if (userId) {
        try {
          const payload = {
            id,
            user_id: userId,
            name: newPr.name,
            category: newPr.category || 'others',
            type: 'other',
            doc_type: newPr.docType || 'Report',
            description: newPr.description || '',
            highlights: newPr.highlights || [],
            tech_stack: newPr.techStack || [],
            live_url: newPr.liveUrl || '',
            github_url: newPr.githubUrl || '',
            pdf_url: cleanPdf,
            image_url: cleanImg,
            is_public: newPr.isPublic !== false,
            date: newPr.date || ''
          };
          const { error } = await supabase.from('others').upsert(payload);
          if (error) {
            console.warn("[Supabase Add Other Fallback to projects]", error);
            const { image_url, ...projPayload } = payload;
            await supabase.from('projects').upsert(projPayload);
          }
        } catch (err) { console.warn("[Supabase Add Other Error]", err); }
      }
    } else {
      const updatedProjects = deduplicateProjects([proj, ...projects]);
      setProjects(updatedProjects);
      if (email) {
        safeLocalStorageSetItem(`${email}_projects`, JSON.stringify(updatedProjects));
        heavyStorage.set(`${email}_projects`, updatedProjects).catch(() => {});
      }
      triggerToast(`Published project assets: ${newPr.name}`);
      if (userId) {
        try {
          const payload = {
            id,
            user_id: userId,
            name: newPr.name,
            category: newPr.category || 'projects',
            type: 'project',
            description: newPr.description || '',
            highlights: newPr.highlights || [],
            tech_stack: newPr.techStack || [],
            live_url: newPr.liveUrl || '',
            github_url: newPr.githubUrl || '',
            pdf_url: cleanPdf,
            pdf_name: newPr.pdfName || '',
            is_public: newPr.isPublic !== false,
            date: newPr.date || ''
          };
          const { error } = await supabase.from('projects').upsert(payload);
          if (error) {
            console.error("[Supabase Add Project Error]", error);
            triggerToast(`Project Error: ${error.message}`);
          }
        } catch (err) { console.warn("[Supabase Add Project Error]", err); }
      }
    }
  };

  const handleDeleteProj = async (id: string) => {
    const targetId = toUUID(id);

    const targetItem = [...projects, ...products, ...others].find(p => p.id === id || p.id === targetId || toUUID(p.id) === targetId);
    if (targetItem) {
      addDeletedItem(targetItem, 'project', targetItem.name || 'Project', targetItem.category);
    }

    const updatedProj = projects.filter(p => p.id !== id && p.id !== targetId);
    const updatedProd = products.filter(p => p.id !== id && p.id !== targetId);
    const updatedOth = others.filter(p => p.id !== id && p.id !== targetId);

    setProjects(updatedProj);
    setProducts(updatedProd);
    setOthers(updatedOth);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_projects`, JSON.stringify(updatedProj));
      safeLocalStorageSetItem(`${email}_products`, JSON.stringify(updatedProd));
      safeLocalStorageSetItem(`${email}_others`, JSON.stringify(updatedOth));
      heavyStorage.set(`${email}_projects`, updatedProj).catch(() => {});
      heavyStorage.set(`${email}_products`, updatedProd).catch(() => {});
      heavyStorage.set(`${email}_others`, updatedOth).catch(() => {});
    }
    triggerToast(`Archived record.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('projects').delete().eq('id', targetId).eq('user_id', userId);
        await supabase.from('products').delete().eq('id', targetId).eq('user_id', userId);
        await supabase.from('others').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('projects').delete().eq('id', id).eq('user_id', userId);
          await supabase.from('products').delete().eq('id', id).eq('user_id', userId);
          await supabase.from('others').delete().eq('id', id).eq('user_id', userId);
        }
      } catch (err) { console.warn("[Supabase Delete Project/Product Error]", err); }
    }
  };

  const handleUpdateProj = async (updatedPr: Project) => {
    const targetId = ensureUUID(updatedPr.id);
    const item = { ...updatedPr, id: targetId };
    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    const userId = await getActiveUserId();

    const cleanPdf = (updatedPr.pdfUrl && updatedPr.pdfUrl.startsWith('data:') && updatedPr.pdfUrl.length > 50000) ? '' : (updatedPr.pdfUrl || '');
    const cleanImg = (updatedPr.imageUrl && updatedPr.imageUrl.startsWith('data:') && updatedPr.imageUrl.length > 50000) ? '' : (updatedPr.imageUrl || updatedPr.coverUrl || '');

    if (updatedPr.type === 'product') {
      const updatedProducts = deduplicateProjects(products.map(p => (p.id === updatedPr.id || p.id === targetId) ? item : p));
      setProjects(prev => prev.filter(p => p.id !== updatedPr.id && p.id !== targetId));
      setOthers(prev => prev.filter(p => p.id !== updatedPr.id && p.id !== targetId));
      setProducts(updatedProducts);
      if (email) {
        safeLocalStorageSetItem(`${email}_products`, JSON.stringify(updatedProducts));
        heavyStorage.set(`${email}_products`, updatedProducts).catch(() => {});
      }
      triggerToast(`Updated product assets: ${updatedPr.name}`);
      if (userId) {
        try {
          const payload = {
            id: targetId,
            user_id: userId,
            name: updatedPr.name,
            category: updatedPr.category || 'products',
            description: updatedPr.description || '',
            highlights: updatedPr.highlights || [],
            tech_stack: updatedPr.techStack || [],
            live_url: updatedPr.liveUrl || '',
            github_url: updatedPr.githubUrl || '',
            pdf_url: cleanPdf,
            image_url: cleanImg,
            is_public: updatedPr.isPublic !== false,
            date: updatedPr.date || ''
          };
          await supabase.from('products').upsert(payload);
          await supabase.from('projects').delete().eq('id', targetId).eq('user_id', userId);
          await supabase.from('others').delete().eq('id', targetId).eq('user_id', userId);
        } catch (err) { console.warn("[Supabase Update Product Error]", err); }
      }
    } else if (updatedPr.type === 'other') {
      const updatedOthers = deduplicateProjects(others.map(p => (p.id === updatedPr.id || p.id === targetId) ? item : p));
      setProjects(prev => prev.filter(p => p.id !== updatedPr.id && p.id !== targetId));
      setProducts(prev => prev.filter(p => p.id !== updatedPr.id && p.id !== targetId));
      setOthers(updatedOthers);
      if (email) {
        safeLocalStorageSetItem(`${email}_others`, JSON.stringify(updatedOthers));
        heavyStorage.set(`${email}_others`, updatedOthers).catch(() => {});
      }
      triggerToast(`Updated document: ${updatedPr.name}`);
      if (userId) {
        try {
          const payload = {
            id: targetId,
            user_id: userId,
            name: updatedPr.name,
            category: updatedPr.category || 'others',
            type: 'other',
            doc_type: updatedPr.docType || 'Report',
            description: updatedPr.description || '',
            highlights: updatedPr.highlights || [],
            tech_stack: updatedPr.techStack || [],
            live_url: updatedPr.liveUrl || '',
            github_url: updatedPr.githubUrl || '',
            pdf_url: cleanPdf,
            image_url: cleanImg,
            is_public: updatedPr.isPublic !== false,
            date: updatedPr.date || ''
          };
          const { error: othErr } = await supabase.from('others').upsert(payload);
          if (othErr) {
            console.warn("[Supabase Update Other Fallback to projects]", othErr);
            const { image_url, ...projPayload } = payload;
            await supabase.from('projects').upsert(projPayload);
          } else {
            await supabase.from('projects').delete().eq('id', targetId).eq('user_id', userId);
          }
          await supabase.from('products').delete().eq('id', targetId).eq('user_id', userId);
        } catch (err) { console.warn("[Supabase Update Other Error]", err); }
      }
    } else {
      const updatedProjects = deduplicateProjects(projects.map(p => (p.id === updatedPr.id || p.id === targetId) ? item : p));
      setProducts(prev => prev.filter(p => p.id !== updatedPr.id && p.id !== targetId));
      setOthers(prev => prev.filter(p => p.id !== updatedPr.id && p.id !== targetId));
      setProjects(updatedProjects);
      if (email) {
        safeLocalStorageSetItem(`${email}_projects`, JSON.stringify(updatedProjects));
        heavyStorage.set(`${email}_projects`, updatedProjects).catch(() => {});
      }
      triggerToast(`Updated project assets: ${updatedPr.name}`);
      if (userId) {
        try {
          const payload = {
            id: targetId,
            user_id: userId,
            name: updatedPr.name,
            category: updatedPr.category || 'projects',
            type: 'project',
            description: updatedPr.description || '',
            highlights: updatedPr.highlights || [],
            tech_stack: updatedPr.techStack || [],
            live_url: updatedPr.liveUrl || '',
            github_url: updatedPr.githubUrl || '',
            pdf_url: cleanPdf,
            pdf_name: updatedPr.pdfName || '',
            is_public: updatedPr.isPublic !== false,
            date: updatedPr.date || ''
          };
          await supabase.from('projects').upsert(payload);
          await supabase.from('products').delete().eq('id', targetId).eq('user_id', userId);
          await supabase.from('others').delete().eq('id', targetId).eq('user_id', userId);
        } catch (err) { console.warn("[Supabase Update Project Error]", err); }
      }
    }
  };

  // Portfolio Links
  const handleAddLink = async (newLk: Omit<PortfolioLink, 'id'>) => {
    const normNewUrl = normalizeLinkUrl(newLk.url);
    const existing = links.find(l => normalizeLinkUrl(l.url) === normNewUrl);

    if (existing) {
      // If URL already exists, update the existing entry to prevent duplicates
      await handleUpdateLink({
        ...existing,
        label: newLk.label || existing.label,
        platform: newLk.platform || existing.platform,
        url: newLk.url,
        isPublic: newLk.isPublic !== false
      });
      return;
    }

    const id = generateUUID();
    const link: PortfolioLink = { ...newLk, id, platform: newLk.platform || 'Link' };
    const updated = deduplicateLinks([link, ...links]);
    setLinks(updated);
    setResumeLinks(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_links`, JSON.stringify(updated));
      safeLocalStorageSetItem(`${email}_resume_links`, JSON.stringify(updated));
      heavyStorage.set(`${email}_links`, updated).catch(() => {});
      heavyStorage.set(`${email}_resume_links`, updated).catch(() => {});

      // Clear any past deleted tombstone for this URL if user re-added it
      try {
        const rawDel = localStorage.getItem(`${email}_deleted_links`);
        if (rawDel) {
          const delList: { id?: string; url?: string }[] = JSON.parse(rawDel);
          const filtered = delList.filter(d => normalizeLinkUrl(d.url) !== normNewUrl && d.id !== id);
          safeLocalStorageSetItem(`${email}_deleted_links`, JSON.stringify(filtered));
          heavyStorage.set(`${email}_deleted_links`, filtered).catch(() => {});
        }
      } catch (_) {}
    }
    triggerToast(`Published portal entry: ${newLk.label}`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        const { error: pErr } = await supabase.from('portfolio_links').upsert({
          id,
          user_id: userId,
          platform: newLk.platform || 'Link',
          label: newLk.label,
          url: newLk.url,
          is_public: newLk.isPublic !== false
        });
        if (pErr) {
          console.error("[Supabase Add Link Error]", pErr);
          triggerToast(`Link Sync: ${pErr.message}`);
        }

        const { error: rlkErr } = await supabase.from('resume_links').upsert({
          id,
          user_id: userId,
          platform: newLk.platform || 'Link',
          label: newLk.label,
          url: newLk.url,
          is_public: newLk.isPublic !== false
        });
        if (rlkErr) console.warn("[Supabase Add resume_links Error]", rlkErr);

        const { error: rErr } = await supabase.from('resumes').upsert({
          id,
          user_id: userId,
          title: newLk.label || newLk.platform || 'Link',
          file_name: newLk.platform || 'Link',
          file_url: newLk.url,
          storage_path: '',
          file_size: 0,
          file_type: 'Link',
          is_primary: false,
          is_public: newLk.isPublic !== false
        });
        if (rErr) console.warn("[Supabase Resume Link Warning]", rErr);
      } catch (err) { console.warn("[Supabase Add Link Error]", err); }
    }
  };

  const handleDeleteLink = async (id: string) => {
    const targetId = toUUID(id);
    const targetLink = links.find(l => l.id === id || l.id === targetId || toUUID(l.id) === targetId);
    const targetUrlNorm = targetLink ? normalizeLinkUrl(targetLink.url) : '';

    if (targetLink) {
      addDeletedItem(targetLink, 'other', targetLink.label || targetLink.platform || 'Portfolio Link', targetLink.url);
    }

    // Filter out by ID and by normalized URL
    const updated = links.filter(l => {
      if (l.id === id || l.id === targetId || toUUID(l.id) === targetId) return false;
      if (targetUrlNorm && normalizeLinkUrl(l.url) === targetUrlNorm) return false;
      return true;
    });

    setLinks(updated);
    setResumeLinks(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_links`, JSON.stringify(updated));
      safeLocalStorageSetItem(`${email}_resume_links`, JSON.stringify(updated));
      heavyStorage.set(`${email}_links`, updated).catch(() => {});
      heavyStorage.set(`${email}_resume_links`, updated).catch(() => {});

      // Record tombstone so deleted link NEVER resurfaces on refresh or login
      try {
        const rawDel = localStorage.getItem(`${email}_deleted_links`);
        const delList: { id: string; url: string }[] = rawDel ? JSON.parse(rawDel) : [];
        delList.push({ id, url: targetLink?.url || '' });
        safeLocalStorageSetItem(`${email}_deleted_links`, JSON.stringify(delList));
        heavyStorage.set(`${email}_deleted_links`, delList).catch(() => {});
      } catch (_) {}
    }
    triggerToast(`Closed link coordinates.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        // Delete from portfolio_links by ID and by URL
        await supabase.from('portfolio_links').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('portfolio_links').delete().eq('id', id).eq('user_id', userId);
        }
        if (targetLink?.url) {
          await supabase.from('portfolio_links').delete().eq('user_id', userId).eq('url', targetLink.url);
        }

        // Delete from resume_links by ID and by URL
        await supabase.from('resume_links').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('resume_links').delete().eq('id', id).eq('user_id', userId);
        }
        if (targetLink?.url) {
          await supabase.from('resume_links').delete().eq('user_id', userId).eq('url', targetLink.url);
        }

        // Delete from resumes by ID and by file_url
        await supabase.from('resumes').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('resumes').delete().eq('id', id).eq('user_id', userId);
        }
        if (targetLink?.url) {
          await supabase.from('resumes').delete().eq('user_id', userId).eq('file_url', targetLink.url);
        }
      } catch (err) { console.warn("[Supabase Delete Link Error]", err); }
    }
  };

  const handleUpdateLink = async (updatedLk: PortfolioLink) => {
    const targetId = ensureUUID(updatedLk.id);
    const item = { ...updatedLk, id: targetId, platform: updatedLk.platform || 'Link' };
    const updated = deduplicateLinks(links.map(l => (l.id === updatedLk.id || l.id === targetId || normalizeLinkUrl(l.url) === normalizeLinkUrl(updatedLk.url)) ? item : l));
    setLinks(updated);
    setResumeLinks(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_links`, JSON.stringify(updated));
      safeLocalStorageSetItem(`${email}_resume_links`, JSON.stringify(updated));
      heavyStorage.set(`${email}_links`, updated).catch(() => {});
      heavyStorage.set(`${email}_resume_links`, updated).catch(() => {});
    }
    triggerToast(`Updated portal entry: ${updatedLk.label}`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        const { error: pErr } = await supabase.from('portfolio_links').upsert({
          id: targetId,
          user_id: userId,
          platform: updatedLk.platform || 'Link',
          label: updatedLk.label,
          url: updatedLk.url,
          is_public: updatedLk.isPublic !== false
        });
        if (pErr) {
          console.error("[Supabase Update Link Error]", pErr);
          triggerToast(`Link Sync: ${pErr.message}`);
        }

        const { error: rlkErr } = await supabase.from('resume_links').upsert({
          id: targetId,
          user_id: userId,
          platform: updatedLk.platform || 'Link',
          label: updatedLk.label,
          url: updatedLk.url,
          is_public: updatedLk.isPublic !== false
        });
        if (rlkErr) console.warn("[Supabase Update resume_links Error]", rlkErr);

        const { error: rErr } = await supabase.from('resumes').upsert({
          id: targetId,
          user_id: userId,
          title: updatedLk.label || updatedLk.platform || 'Link',
          file_name: updatedLk.platform || 'Link',
          file_url: updatedLk.url,
          storage_path: '',
          file_size: 0,
          file_type: 'Link',
          is_primary: false,
          is_public: updatedLk.isPublic !== false
        });
        if (rErr) console.warn("[Supabase Resume Link Update Warning]", rErr);
      } catch (err) { console.warn("[Supabase Update Link Error]", err); }
    }
  };

  // Resume Links Handlers
  const handleAddResumeLink = async (newLk: Omit<PortfolioLink, 'id'>) => {
    await handleAddLink(newLk);
  };

  const handleDeleteResumeLink = async (id: string) => {
    await handleDeleteLink(id);
  };

  const handleUpdateResumeLink = async (updatedLk: PortfolioLink) => {
    await handleUpdateLink(updatedLk);
  };

  const handleDeleteMilestone = async (id: string) => {
    const targetId = toUUID(id);
    const updated = milestones.filter(m => m.id !== id && m.id !== targetId);
    setMilestones(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_milestones`, JSON.stringify(updated));
      heavyStorage.set(`${email}_milestones`, updated).catch(() => {});
    }
    triggerToast(`Purged timeline checkpoint.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('career_timeline').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('career_timeline').delete().eq('id', id).eq('user_id', userId);
        }
      } catch (err) { console.warn("[Supabase Delete Milestone Error]", err); }
    }
  };

  const handleUpdateMilestone = async (updatedMil: TimelineMilestone) => {
    const targetId = ensureUUID(updatedMil.id);
    const item = { ...updatedMil, id: targetId };
    const updated = milestones.map(m => (m.id === updatedMil.id || m.id === targetId || toUUID(m.id) === targetId) ? item : m);
    setMilestones(deduplicateMilestones(updated));

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_milestones`, JSON.stringify(updated));
      heavyStorage.set(`${email}_milestones`, updated).catch(() => {});
    }
    triggerToast(`Career milestone updated in Supabase.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        const mDate = updatedMil.date || new Date().toISOString().substring(0, 7);
        const { error } = await supabase.from('career_timeline').upsert({
          id: targetId,
          user_id: userId,
          title: updatedMil.title || 'Career Milestone',
          date: mDate.length === 4 ? `${mDate}-06` : mDate,
          category: updatedMil.category || updatedMil.type || 'experience',
          intensity: updatedMil.intensity || 'medium',
          description: updatedMil.description || '',
          is_public: true
        });
        if (error) {
          console.error("[Supabase Update Milestone Error]", error);
        }
      } catch (err) {
        console.warn("[Supabase Update Milestone Exception]", err);
      }
    }
  };

  // Contacts CRM
  const handleAddContact = async (newCt: Omit<Contact, 'id' | 'interactionLogs'>) => {
    const id = generateUUID();
    const contact: Contact = { ...newCt, id, interactionLogs: [] };
    const updated = deduplicateContacts([contact, ...contacts]);
    setContacts(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_contacts`, JSON.stringify(updated));
      heavyStorage.set(`${email}_contacts`, updated).catch(() => {});
    }
    triggerToast(`Added pipeline network coordinate: ${newCt.name}`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        const { error } = await supabase.from('contacts').insert({
          id,
          user_id: userId,
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
    const targetId = toUUID(id);
    const targetItem = contacts.find(c => c.id === id || c.id === targetId || toUUID(c.id) === targetId);
    if (targetItem) {
      addDeletedItem(targetItem, 'contact', targetItem.name || 'Contact', targetItem.relationship || targetItem.company);
    }
    const updated = contacts.filter(c => c.id !== id && c.id !== targetId);
    setContacts(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_contacts`, JSON.stringify(updated));
      heavyStorage.set(`${email}_contacts`, updated).catch(() => {});
    }
    triggerToast(`Transferred contact records off-grid.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('contacts').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('contacts').delete().eq('id', id).eq('user_id', userId);
        }
      } catch (err) { console.warn("[Supabase Delete Contact Error]", err); }
    }
  };

  const handleUpdateContact = async (updatedCt: Contact) => {
    const targetId = ensureUUID(updatedCt.id);
    const item = { ...updatedCt, id: targetId };
    const updated = deduplicateContacts(contacts.map(c => (c.id === updatedCt.id || c.id === targetId) ? item : c));
    setContacts(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_contacts`, JSON.stringify(updated));
      heavyStorage.set(`${email}_contacts`, updated).catch(() => {});
    }
    triggerToast(`Updated connection coordinates for: ${updatedCt.name}`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        const { error } = await supabase.from('contacts').upsert({
          id: targetId,
          user_id: userId,
          name: updatedCt.name,
          email: updatedCt.email || '',
          phone: updatedCt.phone || '',
          role: updatedCt.role || '',
          company: updatedCt.company || '',
          relationship: updatedCt.relationship || updatedCt.category || 'Professional',
          category: updatedCt.category || updatedCt.relationship || 'Professional',
          relationship_strength: updatedCt.relationshipStrength ?? 3,
          status: updatedCt.status || 'active',
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
    const updatedContacts = contacts.map(ct => {
      if (ct.id === contactId || (ct.id && toUUID(ct.id) === toUUID(contactId))) {
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
    });
    setContacts(updatedContacts);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_contacts`, JSON.stringify(updatedContacts));
      heavyStorage.set(`${email}_contacts`, updatedContacts).catch(() => {});
    }
    triggerToast(`Logged connection sync transaction.`);

    const userId = await getActiveUserId();
    if (userId && updatedContact) {
      const targetId = ensureUUID((updatedContact as Contact).id);
      try {
        const { error } = await supabase.from('contacts').upsert({
          id: targetId,
          user_id: userId,
          name: (updatedContact as Contact).name,
          email: (updatedContact as Contact).email || '',
          phone: (updatedContact as Contact).phone || '',
          role: (updatedContact as Contact).role || '',
          company: (updatedContact as Contact).company || '',
          relationship: (updatedContact as Contact).relationship || (updatedContact as Contact).category || 'Professional',
          category: (updatedContact as Contact).category || (updatedContact as Contact).relationship || 'Professional',
          relationship_strength: (updatedContact as Contact).relationshipStrength ?? 3,
          status: (updatedContact as Contact).status || 'active',
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
    const updated = deduplicateAchievements([ach, ...achievements]);
    setAchievements(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_achievements`, JSON.stringify(updated));
      heavyStorage.set(`${email}_achievements`, updated).catch(() => {});
    }
    triggerToast(`Acquired industry award validation!`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('achievements').insert({
          id,
          user_id: userId,
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
    const targetId = toUUID(id);
    const targetItem = achievements.find(a => a.id === id || a.id === targetId || toUUID(a.id) === targetId);
    if (targetItem) {
      addDeletedItem(targetItem, 'other', targetItem.title || 'Achievement', targetItem.issuer);
    }
    const updated = achievements.filter(a => a.id !== id && a.id !== targetId);
    setAchievements(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_achievements`, JSON.stringify(updated));
      heavyStorage.set(`${email}_achievements`, updated).catch(() => {});
    }
    triggerToast(`Purged award snapshot.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('achievements').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('achievements').delete().eq('id', id).eq('user_id', userId);
        }
      } catch (err) { console.warn("[Supabase Delete Achievement Error]", err); }
    }
  };

  const handleUpdateAchievement = async (updatedAch: Achievement) => {
    const targetId = ensureUUID(updatedAch.id);
    const item = { ...updatedAch, id: targetId };
    const updated = deduplicateAchievements(achievements.map(a => (a.id === updatedAch.id || a.id === targetId) ? item : a));
    setAchievements(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_achievements`, JSON.stringify(updated));
      heavyStorage.set(`${email}_achievements`, updated).catch(() => {});
    }
    triggerToast(`Updated achievement details: ${updatedAch.title}`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('achievements').upsert({
          id: targetId,
          user_id: userId,
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
    const updated = deduplicateTestimonials([rec, ...testimonials]);
    setTestimonials(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_testimonials`, JSON.stringify(updated));
      heavyStorage.set(`${email}_testimonials`, updated).catch(() => {});
    }
    triggerToast(`Published peer quote endorsement.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('testimonials').insert({
          id,
          user_id: userId,
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

  const handleUpdateTestimonial = async (updatedRec: Testimonial) => {
    const targetId = ensureUUID(updatedRec.id);
    const item = { ...updatedRec, id: targetId };
    const updated = deduplicateTestimonials(testimonials.map(t => (t.id === updatedRec.id || t.id === targetId) ? item : t));
    setTestimonials(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_testimonials`, JSON.stringify(updated));
      heavyStorage.set(`${email}_testimonials`, updated).catch(() => {});
    }
    triggerToast(`Updated peer quote endorsement: ${updatedRec.name}`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('testimonials').upsert({
          id: targetId,
          user_id: userId,
          name: updatedRec.name,
          company: updatedRec.company,
          role: updatedRec.role,
          text: updatedRec.text,
          relationship: updatedRec.relationship,
          avatar_color: updatedRec.avatarColor,
          is_public: updatedRec.isPublic !== false
        });
      } catch (err) { console.warn("[Supabase Update Testimonial Error]", err); }
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    const targetId = toUUID(id);
    const targetItem = testimonials.find(t => t.id === id || t.id === targetId || toUUID(t.id) === targetId);
    if (targetItem) {
      addDeletedItem(targetItem, 'other', targetItem.name || 'Testimonial', targetItem.company);
    }
    const updated = testimonials.filter(t => t.id !== id && t.id !== targetId);
    setTestimonials(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_testimonials`, JSON.stringify(updated));
      heavyStorage.set(`${email}_testimonials`, updated).catch(() => {});
    }
    triggerToast(`Removed endorsement quote.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('testimonials').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('testimonials').delete().eq('id', id).eq('user_id', userId);
        }
      } catch (err) { console.warn("[Supabase Delete Testimonial Error]", err); }
    }
  };

  // Documents
  const handleAddDocument = async (newDoc: Omit<VaultDocument, 'id'>) => {
    const id = generateUUID();
    const doc: VaultDocument = { ...newDoc, id };
    setDocuments(prev => deduplicateDocuments([doc, ...prev]));
    triggerToast(`Secured vault backup file: ${newDoc.name}`);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      const updated = deduplicateDocuments([doc, ...documents]);
      safeLocalStorageSetItem(`${email}_documents`, JSON.stringify(updated));
      heavyStorage.set(`${email}_documents`, updated).catch(() => {});
    }

    const userId = await getActiveUserId();
    if (userId) {
      try {
        const cleanFileUrl = (newDoc.fileUrl && newDoc.fileUrl.startsWith('data:') && newDoc.fileUrl.length > 50000) 
          ? '' 
          : (newDoc.fileUrl || `vault://${encodeURIComponent(newDoc.name || 'document.pdf')}`);
        const byteSize = parseFileSizeToBytes(newDoc.size || newDoc.fileSize);
        const { error } = await supabase.from('documents').insert({
          id,
          user_id: userId,
          title: newDoc.title || newDoc.name,
          category: newDoc.category || 'other',
          description: newDoc.description || '',
          file_name: newDoc.name,
          file_type: newDoc.fileType || 'application/pdf',
          file_size: byteSize,
          file_url: cleanFileUrl,
          storage_path: newDoc.storagePath || '',
          expiry_date: newDoc.expiryDate || null,
          tags: newDoc.tags || [newDoc.category || 'vault'],
          visibility: newDoc.visibility || 'private'
        });
        if (error) console.error("[Supabase Add Document Error]", error);

        // Also ensure category is stored in document_categories
        const catName = (newDoc.category || 'Other').charAt(0).toUpperCase() + (newDoc.category || 'Other').slice(1);
        await supabase.from('document_categories').upsert({
          id: ensureUUID('doc-cat-' + (newDoc.category || 'other').toLowerCase()),
          user_id: userId,
          name: catName,
          icon: 'Folder',
          color: 'emerald'
        });
      } catch (err) { console.warn("[Supabase Add Document Error]", err); }
    }
  };

  const handleDeleteDocument = async (id: string) => {
    const docToDelete = documents.find(d => d.id === id);
    const docName = docToDelete ? docToDelete.name : "document";
    if (docToDelete) {
      addDeletedItem(docToDelete, 'document', docToDelete.name || 'Document', docToDelete.category);
    }
    const targetId = toUUID(id);
    const updated = documents.filter(d => d.id !== id && d.id !== targetId);
    setDocuments(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${currentUser?.email?.toLowerCase().trim() || email}_documents`, JSON.stringify(updated));
      heavyStorage.set(`${email}_documents`, updated).catch(() => {});
    }
    triggerToast(`Removed "${docName}" from document vault.`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('documents').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('documents').delete().eq('id', id).eq('user_id', userId);
        }
      } catch (err) { console.warn("[Supabase Delete Document Error]", err); }
    }
  };

  const handleUpdateDocument = async (updatedDoc: VaultDocument) => {
    const targetId = ensureUUID(updatedDoc.id);
    const item = { ...updatedDoc, id: targetId };
    setDocuments(prev => deduplicateDocuments(prev.map(d => (d.id === updatedDoc.id || d.id === targetId) ? item : d)));
    triggerToast(`Updated visibility for document: ${updatedDoc.name}`);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      const updated = deduplicateDocuments(documents.map(d => (d.id === updatedDoc.id || d.id === targetId) ? item : d));
      safeLocalStorageSetItem(`${email}_documents`, JSON.stringify(updated));
      heavyStorage.set(`${email}_documents`, updated).catch(() => {});
    }

    const userId = await getActiveUserId();
    if (userId) {
      try {
        const cleanFileUrl = (updatedDoc.fileUrl && updatedDoc.fileUrl.startsWith('data:') && updatedDoc.fileUrl.length > 50000) 
          ? '' 
          : (updatedDoc.fileUrl || `vault://${encodeURIComponent(updatedDoc.name || 'document.pdf')}`);
        const byteSize = parseFileSizeToBytes(updatedDoc.size || updatedDoc.fileSize);
        const { error } = await supabase.from('documents').upsert({
          id: targetId,
          user_id: userId,
          title: updatedDoc.title || updatedDoc.name,
          category: updatedDoc.category || 'other',
          description: updatedDoc.description || '',
          file_name: updatedDoc.name,
          file_type: updatedDoc.fileType || 'application/pdf',
          file_size: byteSize,
          file_url: cleanFileUrl,
          storage_path: updatedDoc.storagePath || '',
          expiry_date: updatedDoc.expiryDate || null,
          tags: updatedDoc.tags || [updatedDoc.category || 'vault'],
          visibility: updatedDoc.visibility || 'private'
        });
        if (error) console.error("[Supabase Update Document Error]", error);
      } catch (err) { console.warn("[Supabase Update Document Error]", err); }
    }
  };

  // Calendar Events
  const handleAddCalendarEvent = async (newEvt: Omit<CalendarEvent, 'id'>) => {
    const id = generateUUID();
    const evt: CalendarEvent = { ...newEvt, id };
    const updated = deduplicateCalendarEvents([evt, ...calendarEvents]);
    setCalendarEvents(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_calendar_events`, JSON.stringify(updated));
      heavyStorage.set(`${email}_calendar_events`, updated).catch(() => {});
    }
    triggerToast(`Added scheduled event: "${newEvt.title}"`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('calendar_events').insert({
          id,
          user_id: userId,
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
    const updated = deduplicateCalendarEvents(calendarEvents.map(evt => (evt.id === updatedEvt.id || evt.id === targetId) ? item : evt));
    setCalendarEvents(updated);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_calendar_events`, JSON.stringify(updated));
      heavyStorage.set(`${email}_calendar_events`, updated).catch(() => {});
    }
    triggerToast(`Updated scheduled event: "${updatedEvt.title}"`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('calendar_events').upsert({
          id: targetId,
          user_id: userId,
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

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_calendar_events`, JSON.stringify(updated));
      heavyStorage.set(`${email}_calendar_events`, updated).catch(() => {});
    }
    triggerToast(`Deleted scheduled event: "${titleVal}"`);

    const userId = await getActiveUserId();
    if (userId) {
      try {
        await supabase.from('calendar_events').delete().eq('id', targetId).eq('user_id', userId);
        if (id && id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          await supabase.from('calendar_events').delete().eq('id', id).eq('user_id', userId);
        }
      } catch (err) { console.warn("[Supabase Delete Calendar Event Error]", err); }
    }
  };

  // Resumes update handler
  const handleUpdateResumes = async (newResumes: ResumeItem[]) => {
    // Filter out simulated or AI-generated resumes
    const validUserResumes = (newResumes || []).filter(r => {
      if (!r) return false;
      if (r.fileName === 'Simulated_Document.pdf') return false;
      const cleanName = (r.name || r.fileName || '').toLowerCase();
      if (cleanName.includes('simulated') || cleanName.includes('ai-generated')) return false;
      return true;
    });

    const cleanResumes = deduplicateResumes(validUserResumes);
    const deletedResumes = resumes.filter(oldR => !cleanResumes.some(newR => newR.id === oldR.id));
    setResumes(cleanResumes);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_nexus_vault_resumes`, JSON.stringify(cleanResumes));
      heavyStorage.set(`${email}_nexus_vault_resumes`, cleanResumes).catch(() => {});
    }

    const userId = await getActiveUserId();
    if (userId) {
      for (const del of deletedResumes) {
        const targetId = toUUID(del.id);
        try {
          await supabase.from('resumes').delete().eq('id', targetId).eq('user_id', userId);
          if (del.id && del.id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(del.id)) {
            await supabase.from('resumes').delete().eq('id', del.id).eq('user_id', userId);
          }
        } catch (err) { console.warn("[Supabase Delete Resume Error]", err); }
      }

      if (cleanResumes.length > 0) {
        for (const r of cleanResumes) {
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

            const rawUrl = r.fileUrl || r.fileDataUrl || r.linkUrl || '';
            const cleanUrl = rawUrl.includes('example.com') ? (r.linkUrl || '') : rawUrl;

            const { error } = await supabase.from('resumes').upsert({
              id: targetId,
              user_id: userId,
              title: r.name || r.title || 'Resume',
              file_name: r.fileName || r.name || 'resume.pdf',
              file_url: cleanUrl,
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
    const cleanNotes = deduplicateNotes(newNotes);
    const deletedNotes = notes.filter(oldN => !cleanNotes.some(newN => newN.id === oldN.id));
    setNotes(cleanNotes);

    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      safeLocalStorageSetItem(`${email}_notepad_notes`, JSON.stringify(cleanNotes));
      heavyStorage.set(`${email}_notepad_notes`, cleanNotes).catch(() => {});
    }

    const userId = await getActiveUserId();
    if (userId) {
      for (const del of deletedNotes) {
        const targetId = toUUID(del.id);
        try {
          await supabase.from('notes').delete().eq('id', targetId).eq('user_id', userId);
          if (del.id && del.id !== targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(del.id)) {
            await supabase.from('notes').delete().eq('id', del.id).eq('user_id', userId);
          }
        } catch (err) { console.warn("[Supabase Delete Note Error]", err); }
      }

      if (cleanNotes.length > 0) {
        for (const n of cleanNotes) {
          const targetId = ensureUUID(n.id);
          try {
            const tagsPayload = [
              ...(n.category ? [n.category] : []),
              ...(n.isPinned ? ['__pinned__'] : []),
              ...(n.type === 'task' ? ['__task__'] : []),
              ...(n.completed ? ['__completed__'] : []),
              ...(n.tasks && n.tasks.length > 0 ? [`__tasks__:${JSON.stringify(n.tasks)}`] : [])
            ];
            await supabase.from('notes').upsert({
              id: targetId,
              user_id: userId,
              title: n.title || 'Untitled Document',
              content: n.content || '',
              tags: tagsPayload,
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
    setOldData([]);
    const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
    if (email) {
      localStorage.removeItem(`${email}_old_data`);
      heavyStorage.remove(`${email}_old_data`).catch(() => {});
    }
    triggerToast("All stored structures cleaned.");
  };

  const handleRestoreOldData = async (item: DeletedItem) => {
    if (!item || !item.data) return;

    if (item.itemType === 'experience') {
      const restored = item.data as Experience;
      setExperience(prev => deduplicateExperience([restored, ...prev]));
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        const updated = deduplicateExperience([restored, ...experience]);
        safeLocalStorageSetItem(`${email}_experience`, JSON.stringify(updated));
        heavyStorage.set(`${email}_experience`, updated).catch(e => {});
      }
      const userId = await getActiveUserId();
      if (userId) {
        try {
          await supabase.from('experience').upsert({
            id: ensureUUID(restored.id),
            user_id: userId,
            company: restored.company,
            role: restored.role,
            employment_type: restored.employmentType,
            location: restored.location,
            start_date: restored.startDate,
            end_date: restored.endDate,
            is_current: restored.isCurrent,
            description: restored.description || [],
            skills_used: restored.skillsUsed || [],
            links: restored.links || []
          });
          await supabase.from('career_timeline').upsert({
            id: ensureUUID(`auto-exp-${restored.id}`),
            user_id: userId,
            title: `${restored.role} at ${restored.company}`,
            date: (restored.startDate || new Date().toISOString().substring(0, 7)),
            category: 'experience',
            intensity: restored.isCurrent ? 'high' : 'medium',
            description: Array.isArray(restored.description) && restored.description.length > 0 ? restored.description.join(' ') : `${restored.role} role at ${restored.company}.`,
            is_public: true
          });
        } catch (err) { console.warn("[Supabase Restore Exp Error]", err); }
      }
    } else if (item.itemType === 'education') {
      const restored = item.data as Education;
      setEducation(prev => deduplicateEducation([restored, ...prev]));
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        const updated = deduplicateEducation([restored, ...education]);
        safeLocalStorageSetItem(`${email}_education`, JSON.stringify(updated));
        heavyStorage.set(`${email}_education`, updated).catch(e => {});
      }
      const userId = await getActiveUserId();
      if (userId) {
        try {
          await supabase.from('education').upsert({
            id: ensureUUID(restored.id),
            user_id: userId,
            institution: restored.institution,
            degree: restored.degree,
            field_of_study: restored.fieldOfStudy,
            start_date: restored.startDate,
            end_date: restored.endDate,
            grade: restored.grade,
            description: restored.description
          });
        } catch (err) { console.warn("[Supabase Restore Edu Error]", err); }
      }
    } else if (item.itemType === 'skill') {
      const restored = item.data as Skill;
      setSkills(prev => deduplicateSkills([restored, ...prev]));
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        const updated = deduplicateSkills([restored, ...skills]);
        safeLocalStorageSetItem(`${email}_skills`, JSON.stringify(updated));
        heavyStorage.set(`${email}_skills`, updated).catch(() => {});
      }
      const userId = await getActiveUserId();
      if (userId) {
        try {
          await supabase.from('skills').upsert({
            id: ensureUUID(restored.id),
            user_id: userId,
            name: restored.name,
            proficiency: (restored as any).level || restored.proficiency || 'Intermediate',
            category: restored.category || 'Technical',
            years_of_exp: Number(restored.yearsOfExp) || Number((restored as any).yearsOfExperience) || 1
          });
        } catch (err) { console.warn("[Supabase Restore Skill Error]", err); }
      }
    } else if (item.itemType === 'certification') {
      const restored = item.data as Certification;
      setCertifications(prev => deduplicateCertifications([restored, ...prev]));
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        const updated = deduplicateCertifications([restored, ...certifications]);
        safeLocalStorageSetItem(`${email}_certs`, JSON.stringify(updated));
        heavyStorage.set(`${email}_certs`, updated).catch(e => {});
      }
      const userId = await getActiveUserId();
      if (userId) {
        try {
          await supabase.from('certifications').upsert({
            id: ensureUUID(restored.id),
            user_id: userId,
            title: restored.title,
            issuer: restored.issuer,
            issue_date: restored.dateIssued || restored.issueDate,
            expiry_date: restored.expirationDate || restored.expiryDate,
            credential_id: restored.credentialId,
            credential_url: restored.credentialUrl,
            description: restored.description,
            type: restored.type || 'study',
            percentage: restored.percentage,
            visibility: restored.visibility || 'public'
          });
        } catch (err) { console.warn("[Supabase Restore Cert Error]", err); }
      }
    } else if (item.itemType === 'specialization') {
      const restored = item.data as Specialization;
      setSpecializations(prev => deduplicateSpecializations([restored, ...prev]));
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        const updated = deduplicateSpecializations([restored, ...specializations]);
        safeLocalStorageSetItem(`${email}_specializations`, JSON.stringify(updated));
        heavyStorage.set(`${email}_specializations`, updated).catch(() => {});
      }
      const userId = await getActiveUserId();
      if (userId) {
        try {
          await supabase.from('specializations').upsert({
            id: ensureUUID(restored.id),
            user_id: userId,
            name: restored.name
          });
        } catch (err) { console.warn("[Supabase Restore Specialization Error]", err); }
      }
    } else if (item.itemType === 'project') {
      const restored = item.data as Project;
      if (restored.category === 'products' || (restored as any).type === 'product') {
        setProducts(prev => deduplicateProjects([restored, ...prev]));
      } else {
        setProjects(prev => deduplicateProjects([restored, ...prev]));
      }
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        safeLocalStorageSetItem(`${email}_projects`, JSON.stringify(projects));
        heavyStorage.set(`${email}_projects`, projects).catch(() => {});
      }
    } else if (item.itemType === 'contact') {
      const restored = item.data as Contact;
      setContacts(prev => deduplicateContacts([restored, ...prev]));
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        const updated = deduplicateContacts([restored, ...contacts]);
        safeLocalStorageSetItem(`${email}_contacts`, JSON.stringify(updated));
      }
    } else if (item.itemType === 'document') {
      const restored = item.data as VaultDocument;
      setDocuments(prev => deduplicateDocuments([restored, ...prev]));
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        const updated = deduplicateDocuments([restored, ...documents]);
        safeLocalStorageSetItem(`${email}_documents`, JSON.stringify(updated));
      }
    }

    // Remove from oldData
    setOldData(prev => {
      const updated = prev.filter(o => o.id !== item.id);
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        safeLocalStorageSetItem(`${email}_old_data`, JSON.stringify(updated));
        heavyStorage.set(`${email}_old_data`, updated).catch(e => {});
      }
      return updated;
    });

    triggerToast(`Data recovered successfully: ${item.title}`);
  };

  const handlePermanentlyDeleteOldData = (id: string) => {
    setOldData(prev => {
      const updated = prev.filter(o => o.id !== id);
      const email = currentUser?.email?.toLowerCase().trim() || getCurrentUserEmail();
      if (email) {
        safeLocalStorageSetItem(`${email}_old_data`, JSON.stringify(updated));
        heavyStorage.set(`${email}_old_data`, updated).catch(e => {});
      }
      return updated;
    });
    triggerToast("Archived record deleted permanently.");
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
    const defaultSlug = currentUser?.email ? currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '') : 'my-profile';
    const shareSlug = profile.shareSlug || (profile.name ? profile.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : defaultSlug);
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
        !['api', 'assets', 'vite', 'index.html', 'favicon.ico', 'login', 'register'].includes(firstSegment)) {
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
    if (!profile.avatarUrl) {
      try {
        localStorage.removeItem(`${email}_avatar_cache`);
      } catch (_) {}
    } else {
      try {
        safeLocalStorageSetItem(`${email}_avatar_cache`, profile.avatarUrl);
      } catch (_) {}
    }
    heavyStorage.set(`${email}_profile`, profile).catch(() => {});
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
      const defaultSlug = currentUser?.email ? currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '') : 'my-profile';
      const shareSlug = profile.shareSlug || (profile.name ? profile.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : defaultSlug);
      
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
      const deduplicatedCerts = deduplicatePayloadArray(publicCertsOnly, c => c.id || `${c.title || ''}-${c.issuer || ''}-${c.dateIssued || ''}`);
      const deduplicatedProjects = deduplicatePayloadArray(publicProjectsOnly, proj => proj.name || '');
      const deduplicatedEducation = deduplicatePayloadArray(education, edu => `${edu.degree || ''}-${edu.institution || ''}`);
      const deduplicatedAchievements = deduplicatePayloadArray(achievements, ach => ach.title || '');
      const deduplicatedTestimonials = deduplicatePayloadArray(testimonials, rec => `${rec.name || ''}-${rec.company || ''}`);
      const deduplicatedLinks = deduplicatePayloadArray(publicLinksOnly, lk => lk.url || '');
      const deduplicatedPlatformEvents = deduplicatePayloadArray(publicCalendarOnly, evt => `${evt.title || ''}-${evt.date || ''}`);

      const deduplicatedResumes = deduplicatePayloadArray(resumes.filter(r => r.visibility !== 'private'), r => r.name || r.fileName || '');

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
        res: deduplicatedResumes,
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
        if (profile.publicProfile === false) {
          try {
            await apiFetch(`/api/share/${shareSlug}`, { method: 'DELETE' });
            console.log(`[Auto-Publish] Cleaned up public share endpoint because profile is private: ${shareSlug}`);
          } catch (_) {}
          try {
            localStorage.removeItem(`nexus_cache_skills_${shareSlug}`);
            localStorage.removeItem(`nexus_cache_experience_${shareSlug}`);
            localStorage.removeItem(`nexus_cache_certs_${shareSlug}`);
            localStorage.removeItem(`nexus_cache_projects_${shareSlug}`);
            localStorage.removeItem(`nexus_cache_education_${shareSlug}`);
            localStorage.removeItem(`nexus_cache_achievements_${shareSlug}`);
            localStorage.removeItem(`nexus_cache_testimonials_${shareSlug}`);
            localStorage.removeItem(`nexus_cache_links_${shareSlug}`);
            localStorage.removeItem(`nexus_cache_calendar_events_${shareSlug}`);
          } catch (_) {}
        } else {
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
    let rawSlug = currentUser?.email ? currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '') : 'my-profile';
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
    rawSlug = rawSlug.split('/')[0].split('#')[0].split('?')[0].trim().toLowerCase();
    let slug = rawSlug;

    const isDemo = slug === 'demo' || slug === 'template';
    const fallbackDisplayName = formatSlugToName(slug);

    // Baseline shared variables (starts with default fallback or empty depending on owner)
    let sharedProfile: PersonalProfile = isDemo 
      ? { ...INITIAL_PROFILE, publicProfile: true } 
      : { 
          ...EMPTY_PROFILE, 
          name: fallbackDisplayName, 
          firstName: fallbackDisplayName.split(' ')[0] || '',
          lastName: fallbackDisplayName.split(' ').slice(1).join(' ') || '',
          shareSlug: slug, 
          publicProfile: true 
        };
    let sharedSkills: Skill[] = isDemo ? INITIAL_SKILLS : [];
    let sharedExperience: Experience[] = isDemo ? INITIAL_EXPERIENCE : [];
    let sharedCertifications: Certification[] = isDemo ? INITIAL_CERTIFICATIONS : [];
    let sharedProjects: Project[] = isDemo ? INITIAL_PROJECTS : [];
    let sharedEducation: Education[] = isDemo ? INITIAL_EDUCATION : [];
    let sharedAchievements: Achievement[] = isDemo ? INITIAL_ACHIEVEMENTS : [];
    let sharedTestimonials: Testimonial[] = isDemo ? INITIAL_TESTIMONIALS : [];
    let sharedLinks: PortfolioLink[] = isDemo ? INITIAL_LINKS : [];
    let sharedResumes: ResumeItem[] = [];
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
    const targetNorm = slug.replace(/[^a-z0-9]/g, '');
    for (const u of registeredUsers) {
      const savedProfileStr = localStorage.getItem(`${u.email}_profile`);
      if (savedProfileStr) {
        try {
          const p = JSON.parse(savedProfileStr);
          if (p) {
            const pSlugNorm = (p.shareSlug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const candidateSlugNorm = (p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const emailSlugNorm = (u.email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            if (pSlugNorm === targetNorm || candidateSlugNorm === targetNorm || emailSlugNorm === targetNorm) {
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
          if (p) {
            const pSlugNorm = (p.shareSlug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const candidateSlugNorm = (p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (pSlugNorm === targetNorm || candidateSlugNorm === targetNorm) {
              matchedEmail = currentEmail;
            }
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
      const isLocPrivate = locP !== null && locP.publicProfile === false;

      sharedProfile = locP !== null 
        ? { ...locP, name: locP.name || fallbackDisplayName, publicProfile: !isLocPrivate } 
        : (isDemo ? { ...INITIAL_PROFILE, publicProfile: true } : { ...EMPTY_PROFILE, name: fallbackDisplayName, shareSlug: slug, publicProfile: true });

      if (isLocPrivate) {
        sharedSkills = [];
        sharedExperience = [];
        sharedCertifications = [];
        sharedProjects = [];
        sharedEducation = [];
        sharedAchievements = [];
        sharedTestimonials = [];
        sharedLinks = [];
        sharedResumes = [];
        sharedCalendarEvents = [];
      } else {
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
        const locRes = getLocalData('resumes') || getLocalData('vault_resumes');
        const locCal = getLocalData('calendar_events');

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
        sharedResumes = locRes !== null ? locRes : [];
        sharedCalendarEvents = locCal !== null ? locCal : (isDemo ? INITIAL_CALENDAR_EVENTS : []);
      }
    } else {
      // Direct offline read-only local storage fallback
      const cachedProfileStr = localStorage.getItem(`nexus_cache_profile_${slug}`);
      if (cachedProfileStr) {
        try {
          const parsedCache = JSON.parse(cachedProfileStr);
          const isCachePrivate = parsedCache.publicProfile === false;
          sharedProfile = { ...parsedCache, publicProfile: !isCachePrivate };
          if (isCachePrivate) {
            sharedSkills = [];
            sharedExperience = [];
            sharedCertifications = [];
            sharedProjects = [];
            sharedEducation = [];
            sharedAchievements = [];
            sharedTestimonials = [];
            sharedLinks = [];
            sharedCalendarEvents = [];
          } else {
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
          }
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
        resumes: sharedResumes,
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
        const isPayloadPrivate = decoded.p?.publicProfile === false;
        const finalData = {
          profile: decoded.p ? { ...decoded.p, publicProfile: !isPayloadPrivate } : { ...sharedProfile, publicProfile: sharedProfile.publicProfile !== false },
          skills: isPayloadPrivate ? [] : (decoded.s || sharedSkills),
          experience: isPayloadPrivate ? [] : (decoded.e || sharedExperience),
          certifications: isPayloadPrivate ? [] : (decoded.c || sharedCertifications),
          projects: isPayloadPrivate ? [] : (decoded.pr || sharedProjects),
          education: isPayloadPrivate ? [] : (decoded.ed || sharedEducation),
          achievements: isPayloadPrivate ? [] : (decoded.a || sharedAchievements),
          testimonials: isPayloadPrivate ? [] : (decoded.t || sharedTestimonials),
          links: isPayloadPrivate ? [] : (decoded.l || sharedLinks),
          calendarEvents: isPayloadPrivate ? [] : (decoded.cal || [])
        };
        setRemoteShareData(finalData);

        // Back up Cache for future offline review
        try {
          localStorage.setItem(`nexus_cache_profile_${slug}`, JSON.stringify(finalData.profile));
          if (isPayloadPrivate) {
            localStorage.removeItem(`nexus_cache_skills_${slug}`);
            localStorage.removeItem(`nexus_cache_experience_${slug}`);
            localStorage.removeItem(`nexus_cache_certs_${slug}`);
            localStorage.removeItem(`nexus_cache_projects_${slug}`);
            localStorage.removeItem(`nexus_cache_education_${slug}`);
            localStorage.removeItem(`nexus_cache_achievements_${slug}`);
            localStorage.removeItem(`nexus_cache_testimonials_${slug}`);
            localStorage.removeItem(`nexus_cache_links_${slug}`);
            localStorage.removeItem(`nexus_cache_calendar_events_${slug}`);
          } else {
            localStorage.setItem(`nexus_cache_skills_${slug}`, JSON.stringify(finalData.skills));
            localStorage.setItem(`nexus_cache_experience_${slug}`, JSON.stringify(finalData.experience));
            localStorage.setItem(`nexus_cache_certs_${slug}`, JSON.stringify(finalData.certifications));
            localStorage.setItem(`nexus_cache_projects_${slug}`, JSON.stringify(finalData.projects));
            localStorage.setItem(`nexus_cache_education_${slug}`, JSON.stringify(finalData.education));
            localStorage.setItem(`nexus_cache_achievements_${slug}`, JSON.stringify(finalData.achievements));
            localStorage.setItem(`nexus_cache_testimonials_${slug}`, JSON.stringify(finalData.testimonials));
            localStorage.setItem(`nexus_cache_links_${slug}`, JSON.stringify(finalData.links));
            localStorage.setItem(`nexus_cache_calendar_events_${slug}`, JSON.stringify(finalData.calendarEvents));
          }
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
      let pRow: any = null;
      // 1. Direct Supabase Public Profile Query
      try {
        console.log(`[Supabase Share Query] Fetching public profile for slug: '${slug}'`);

        // Try exact match by share_slug
        const { data: exactRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('share_slug', slug)
          .maybeSingle();

        pRow = exactRow;

        // Try match with slug stripped of hyphens
        if (!pRow) {
          const { data: noHyphenRow } = await supabase
            .from('profiles')
            .select('*')
            .eq('share_slug', slug.replace(/[^a-z0-9]/g, ''))
            .maybeSingle();
          pRow = noHyphenRow;
        }

        // Fallback: match by candidate name slug or email handle
        if (!pRow) {
          const { data: allP } = await supabase.from('profiles').select('*');
          if (allP && allP.length > 0) {
            const targetNorm = slug.replace(/[^a-z0-9]/g, '');
            pRow = allP.find((p: any) => {
              if (p.share_slug && (p.share_slug.toLowerCase() === slug || p.share_slug.toLowerCase().replace(/[^a-z0-9]/g, '') === targetNorm)) return true;
              if (p.name) {
                const candidate = p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                if (candidate === slug || candidate.replace(/[^a-z0-9]/g, '') === targetNorm) return true;
              }
              if (p.email) {
                const handle = p.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
                if (handle === slug || handle.replace(/[^a-z0-9]/g, '') === targetNorm) return true;
              }
              return false;
            });
          }
        }

        if (pRow) {
          const displayName = pRow.name || `${pRow.first_name || ''} ${pRow.last_name || ''}`.trim() || fallbackDisplayName;
          if (pRow.public_profile === false) {
            setRemoteShareData({
              profile: {
                ...EMPTY_PROFILE,
                name: displayName,
                firstName: pRow.first_name || displayName.split(' ')[0] || '',
                lastName: pRow.last_name || displayName.split(' ').slice(1).join(' ') || '',
                avatarUrl: pRow.avatar_url || '',
                shareSlug: pRow.share_slug || slug,
                publicProfile: false
              },
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
            publicProfile: pRow.public_profile !== false,
            shareSlug: pRow.share_slug || slug
          };

          const hasCustomSkills = sData && sData.length > 0;
          const hasCustomExp = expData && expData.length > 0;
          const hasCustomCerts = cData && cData.length > 0;
          const hasCustomProjects = (prData && prData.length > 0) || (prodData && prodData.length > 0) || (othData && othData.length > 0);
          const hasCustomEdu = eData && eData.length > 0;

          const publicSharePayload = {
            profile: publicProfileObj,
            skills: hasCustomSkills ? sData.map((s: any) => ({ id: s.id, name: s.name, category: s.category, yearsOfExp: typeof s.years_of_exp === 'number' ? s.years_of_exp : (parseInt(s.years_of_exp, 10) || 0), visibility: s.visibility || 'public' })) : (isDemo ? INITIAL_SKILLS : []),
            experience: hasCustomExp ? expData.map((exp: any) => ({ id: exp.id, company: exp.company, role: exp.role, startDate: exp.start_date, endDate: exp.end_date, description: exp.description, skillsUsed: exp.skills_used, links: exp.links, pdfUrl: exp.pdf_url })) : (isDemo ? INITIAL_EXPERIENCE : []),
            certifications: hasCustomCerts ? cData.map((c: any) => ({ id: c.id, title: c.title, issuer: c.issuer, dateIssued: c.issue_date || c.date_issued, credentialUrl: c.credential_url, fileName: c.file_name || c.fileName, fileUrl: c.file_url || c.fileUrl, visibility: c.visibility || 'public' })) : (isDemo ? INITIAL_CERTIFICATIONS : []),
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
            achievements: (aData && aData.length > 0) ? aData.map((a: any) => ({ id: a.id, title: a.title, issuer: a.issuer, date: a.date, description: a.description, fileName: a.file_name, fileUrl: a.file_url, isPublic: a.is_public !== false && a.is_public !== 'false' && (a.is_public as any) !== 0 && (a.is_public as any) !== '0' })) : (isDemo ? INITIAL_ACHIEVEMENTS : []),
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
            resumes: (resData && resData.length > 0) ? resData.filter((r: any) => r.is_public !== false && r.is_public !== 'false').map((r: any) => ({
              id: r.id,
              name: r.title || r.file_name || 'Resume Document',
              title: r.title || r.file_name,
              fileName: r.file_name,
              fileUrl: r.file_url,
              fileDataUrl: r.file_url,
              uploadDate: r.created_at ? r.created_at.substring(0, 10) : 'Verified',
              visibility: 'public',
              isPublic: true,
              type: r.file_type || 'Resume'
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
          const parsedCache = JSON.parse(cachedProfile);
          const isCachePrivate = parsedCache.publicProfile === false;
          const finalData = {
            profile: { ...parsedCache, publicProfile: !isCachePrivate },
            skills: isCachePrivate ? [] : JSON.parse(localStorage.getItem(`nexus_cache_skills_${slug}`) || "[]"),
            experience: isCachePrivate ? [] : JSON.parse(localStorage.getItem(`nexus_cache_experience_${slug}`) || "[]"),
            certifications: isCachePrivate ? [] : JSON.parse(localStorage.getItem(`nexus_cache_certs_${slug}`) || "[]"),
            projects: isCachePrivate ? [] : JSON.parse(localStorage.getItem(`nexus_cache_projects_${slug}`) || "[]"),
            education: isCachePrivate ? [] : JSON.parse(localStorage.getItem(`nexus_cache_education_${slug}`) || "[]"),
            achievements: isCachePrivate ? [] : JSON.parse(localStorage.getItem(`nexus_cache_achievements_${slug}`) || "[]"),
            testimonials: isCachePrivate ? [] : JSON.parse(localStorage.getItem(`nexus_cache_testimonials_${slug}`) || "[]"),
            links: isCachePrivate ? [] : JSON.parse(localStorage.getItem(`nexus_cache_links_${slug}`) || "[]"),
            calendarEvents: isCachePrivate ? [] : JSON.parse(localStorage.getItem(`nexus_cache_calendar_events_${slug}`) || "[]")
          };
          setRemoteShareData(finalData);
          console.log(`[Sync] Successfully restored from local offline Cache backup.`);
          return "";
        }
      } catch (cacheErr) {
        console.log("[Sync] Stale local offline cache failed:", cacheErr);
      }

      // Ensure fallback payload is set: only if sharedProfile is explicitly private
      if (sharedProfile.publicProfile === false) {
        setRemoteShareData({
          profile: {
            ...EMPTY_PROFILE,
            name: sharedProfile.name || fallbackDisplayName,
            firstName: sharedProfile.firstName || (sharedProfile.name || fallbackDisplayName).split(' ')[0] || '',
            lastName: sharedProfile.lastName || (sharedProfile.name || fallbackDisplayName).split(' ').slice(1).join(' ') || '',
            avatarUrl: sharedProfile.avatarUrl || '',
            shareSlug: sharedProfile.shareSlug || slug,
            publicProfile: false
          },
          skills: [], experience: [], certifications: [], projects: [], education: [], achievements: [], testimonials: [], links: [], calendarEvents: []
        });
      } else {
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
      }

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

    const isProfilePrivate = remoteShareData.profile?.publicProfile === false;

    return (
      <PublicPortfolioView 
        profile={remoteShareData.profile}
        skills={isProfilePrivate ? [] : remoteShareData.skills}
        experience={isProfilePrivate ? [] : remoteShareData.experience}
        certifications={isProfilePrivate ? [] : remoteShareData.certifications}
        projects={isProfilePrivate ? [] : remoteShareData.projects}
        education={isProfilePrivate ? [] : remoteShareData.education}
        achievements={isProfilePrivate ? [] : remoteShareData.achievements}
        testimonials={isProfilePrivate ? [] : remoteShareData.testimonials}
        links={isProfilePrivate ? [] : remoteShareData.links}
        resumes={isProfilePrivate ? [] : (remoteShareData.resumes && remoteShareData.resumes.length > 0 ? remoteShareData.resumes : [])}
        documents={isProfilePrivate ? [] : (remoteShareData.documents || [])}
        calendarEvents={isProfilePrivate ? [] : (remoteShareData.calendarEvents || [])}
        currentJob={isProfilePrivate ? undefined : remoteShareData.currentJob}
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

  // Clean Sidebar items rendering configuration - Home Page & Profile at TOP, remaining modules A-Z
  const sidebarItems = [
    // Top Pinned Navigation
    { id: 'overview', label: 'Home Page', icon: Home },
    { id: 'profile', label: 'Personal Profile', icon: User },

    // Alphabetical Modules (A to Z)
    { id: 'achievements', label: 'Achievements & Awards', icon: Star },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'timeline', label: 'Career Timeline', icon: GitBranch },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'current-job', label: 'Current Job', icon: Laptop },
    { id: 'digital-visiting-card', label: 'Digital Visiting Card', icon: CreditCard },
    { id: 'vault', label: 'Document Vault', icon: FolderLock },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'notepad', label: 'Note Pad', icon: StickyNote },
    { id: 'portfolios', label: 'Portfolios & Links', icon: Link2 },
    { id: 'projects', label: 'Projects & Products', icon: Rocket },
    { id: 'resume', label: 'Resume / CV', icon: FileText },
    { id: 'skills', label: 'Skills', icon: Cpu },
    { id: 'specialization', label: 'Specialization', icon: Target },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare }
  ];

  const getActiveTabBreadcrumb = () => {
    const matched = sidebarItems.find(item => item.id === activeTab);
    return matched ? matched.label : 'Home Page';
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-gray-300 flex flex-col md:flex-row font-sans relative antialiased" id="nexus-crm-shell">
      
      {/* 1. CYBER NAVIGATION SIDEBAR (Desktop) with Open & Close Toggle */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#0a0b0d] border-r border-slate-900 flex-col hidden md:flex shrink-0 z-20 select-none transition-all duration-300 ease-in-out`}
      >
        {/* Sidebar Brand header with Open / Close Toggle Button */}
        <div className={`p-4 border-b border-slate-900/80 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {isSidebarOpen ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl border border-emerald-500/25 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="truncate">
                  <h1 className="font-sans font-bold text-sm tracking-tight text-white leading-none">MyDocVault</h1>
                  <span className="text-[9px] text-gray-500 font-mono tracking-wider font-semibold">Personal Document Saver</span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                title="Close navigation bar"
                className="p-1.5 rounded-lg hover:bg-slate-800 border border-slate-800 text-gray-400 hover:text-white transition cursor-pointer shrink-0 ml-2 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={toggleSidebar}
                title="Open navigation bar"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-400 hover:text-emerald-300 transition cursor-pointer group active:scale-95"
              >
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Sidebar links with Home & Profile at Top, Alphabetical below, and Rich Hover Option */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1 custom-scrollbar text-xs">
          {sidebarItems.map((nav) => {
            const Icon = nav.icon;
            const isActive = activeTab === nav.id;
            const isDividerAfter = nav.id === 'profile';

            return (
              <React.Fragment key={nav.id}>
                <button
                  id={`sidebar-nav-${nav.id}`}
                  onClick={() => setActiveTab(nav.id)}
                  title={nav.label}
                  className={`w-full group flex items-center ${isSidebarOpen ? 'justify-between px-3' : 'justify-center px-2'} py-2.5 rounded-xl transition-all duration-200 font-semibold cursor-pointer border ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent text-emerald-300 font-bold border-emerald-500/40 shadow-sm shadow-emerald-950/40 ring-1 ring-emerald-500/20' 
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-slate-850/60 hover:border-slate-800 hover:shadow-md hover:translate-x-1'
                  }`}
                >
                  <div className={`flex items-center gap-3 min-w-0 ${isSidebarOpen ? '' : 'justify-center'}`}>
                    <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isActive 
                        ? 'text-emerald-400 scale-105' 
                        : 'text-gray-500 group-hover:text-emerald-400 group-hover:scale-110'
                    }`} />
                    {isSidebarOpen && <span className="truncate">{nav.label}</span>}
                  </div>
                  {/* Indicator pip when open */}
                  {isSidebarOpen && (
                    isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700 opacity-0 group-hover:opacity-100 group-hover:bg-emerald-400/70 shrink-0 transition-opacity duration-150" />
                    )
                  )}
                </button>

                {/* Elegant subtle divider between top pinned items (Home & Profile) and alphabetical modules */}
                {isDividerAfter && isSidebarOpen && (
                  <div className="py-2 px-1">
                    <div className="border-t border-slate-900/80 flex items-center justify-between pt-2">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 font-bold">Modules</span>
                      <span className="text-[9px] font-mono text-gray-600">A-Z</span>
                    </div>
                  </div>
                )}
                {isDividerAfter && !isSidebarOpen && (
                  <div className="py-1">
                    <div className="border-t border-slate-900/80" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Sidebar Settings & Logout Options at bottom */}
        <div className={`p-3 border-t border-slate-900/80 bg-slate-950/20 space-y-1.5 ${isSidebarOpen ? '' : 'flex flex-col items-center'}`}>
          <button
            onClick={() => setActiveTab('settings')}
            title="Settings"
            className={`w-full flex items-center ${isSidebarOpen ? 'gap-3.5 px-3' : 'justify-center px-2'} py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
              activeTab === 'settings' 
                ? 'bg-slate-900/80 text-emerald-400 font-bold border border-slate-800/60' 
                : 'text-gray-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Settings className="w-4 h-4 text-gray-500 shrink-0" />
            {isSidebarOpen && <span>Settings</span>}
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
            title="Logout"
            className={`w-full flex items-center ${isSidebarOpen ? 'gap-3.5 px-3' : 'justify-center px-2'} py-2.5 rounded-xl text-xs font-semibold text-rose-450 hover:text-rose-400 hover:bg-rose-950/20 cursor-pointer transition`}
          >
            <LogOut className="w-4 h-4 text-gray-500 shrink-0" />
            {isSidebarOpen && <span>Logout</span>}
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
                title={nav.label}
                className={`w-full group flex items-center justify-between py-2.5 px-3 rounded-lg transition-all text-xs font-semibold cursor-pointer border ${
                  isActive 
                    ? 'bg-emerald-500/15 text-emerald-300 font-bold border-emerald-500/40' 
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-slate-850/60 hover:border-slate-800 hover:translate-x-1'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-emerald-400 group-hover:scale-110'}`} />
                  <span>{nav.label}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
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
        <header className="bg-[#0a0b0d] border-b border-slate-900 hidden md:flex items-center justify-between px-6 lg:px-8 py-3.5 shadow-sm select-none z-10">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button (Open/Close) */}
            <button
              type="button"
              onClick={toggleSidebar}
              title={isSidebarOpen ? "Close navigation bar" : "Open navigation bar"}
              className="p-1.5 rounded-lg hover:bg-slate-850 border border-slate-800 text-gray-400 hover:text-emerald-400 transition flex items-center justify-center cursor-pointer active:scale-95"
            >
              {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 text-emerald-400" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-mono text-xs">Breadcrumb:</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wide">
                <span>🏠</span>
                <span>Home Page</span>
                {activeTab !== 'overview' && (
                  <>
                    <span className="text-gray-650 font-normal">/</span>
                    <span className="text-emerald-400">{getActiveTabBreadcrumb()}</span>
                  </>
                )}
              </div>
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
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 font-bold flex items-center justify-center text-emerald-400 select-none shrink-0 text-xs overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name || "Avatar"} className="w-full h-full object-cover" />
                ) : (
                  getAvatarInitials(profile)
                )}
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
              onUpdateExperience={handleUpdateExp}
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
              links={links}
              onAddLink={handleAddLink}
              onDeleteLink={handleDeleteLink}
              onUpdateLink={handleUpdateLink}
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
              experience={experience}
              education={education}
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

          {activeTab === 'specialization' && (
            <SpecializationTab 
              specializations={specializations}
              onAddSpecialization={handleAddSpecialization}
              onUpdateSpecialization={handleUpdateSpecialization}
              onDeleteSpecialization={handleDeleteSpecialization}
            />
          )}

          {activeTab === 'testimonials' && (
            <TestimonialsTab 
              testimonials={testimonials}
              onAddTestimonial={handleAddTestimonial}
              onDeleteTestimonial={handleDeleteTestimonial}
              onUpdateTestimonial={handleUpdateTestimonial}
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

          {activeTab === 'digital-visiting-card' && (
            <DigitalVisitingCardTab
              profile={profile}
              currentJob={currentJob}
              experience={experience}
              shareUrl={getFullShareUrl()}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab 
              oldData={oldData}
              onRestoreOldData={handleRestoreOldData}
              onPermanentlyDeleteOldData={handlePermanentlyDeleteOldData}
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
