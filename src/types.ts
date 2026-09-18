/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core types for MyDocVault Personal Document Saver Suite

export interface PersonalProfile {
  name: string;
  firstName?: string;
  lastName?: string;
  secondaryEmail?: string;
  secondaryPhone?: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  avatarUrl: string;
  publicProfile?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  visibility: 'public' | 'private';
  yearsOfExp: number;
  endorsements: number;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  grade: string;
  activities: string;
  percentage?: string;
  enrollmentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  dateIssued: string;
  expirationDate: string;
  credentialId: string;
  credentialUrl: string;
  type?: 'study' | 'course' | 'grades';
  visibility?: 'public' | 'private';
  fileName?: string;
  fileUrl?: string;
  percentage?: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string; // "Present" or Date
  isCurrent: boolean;
  description: string[];
  skillsUsed: string[];
  links?: { label: string; url: string; }[];
  pdfUrl?: string;
  pdfName?: string;
  isPublic?: boolean;
}

export interface CurrentJob {
  employer: string;
  role: string;
  startDate: string;
  department: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  locationType?: 'on-site' | 'remote' | 'hybrid';
  currentProjects: { id: string; name: string; status: 'planning' | 'in-progress' | 'completed'; desc: string }[];
  dailyStandupText: string;
  weeklyGoals: { id: string; text: string; completed: boolean }[];
}

export interface Project {
  id: string;
  name: string;
  category: 'enterprise' | 'frontend' | 'fullstack' | 'open-source' | 'utilities';
  description: string;
  techStack: string[];
  githubUrl: string;
  liveUrl: string;
  highlights: string[];
  date?: string;
  toDate?: string;
  type?: 'project' | 'product' | 'other';
  docType?: string;
  coverUrl?: string;
  pdfUrl?: string;
  pdfName?: string;
  percentage?: string;
  isPublic?: boolean;
}

export interface PortfolioLink {
  id: string;
  platform: string;
  url: string;
  label: string;
  isPublic?: boolean;
}

export interface TimelineMilestone {
  id: string;
  date: string;
  title: string;
  category: 'education' | 'experience' | 'certification' | 'achievement' | 'project';
  description: string;
  intensity: 'low' | 'medium' | 'high';
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  category: 'recruiter' | 'mentor' | 'colleague' | 'client' | 'other';
  notes: string;
  relationshipStrength: number; // 1-5
  status: 'active' | 'cold' | 'hot' | 'on-hold';
  lastInteracted: string;
  interactionLogs: { id: string; timestamp: string; type: 'email' | 'call' | 'meeting' | 'note'; summary: string }[];
}

export interface Achievement {
  id: string;
  title: string;
  date: string;
  issuer: string;
  description: string;
  isPublic?: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatarColor: string;
  relationship: string;
  text: string;
}

export interface VaultDocument {
  id: string;
  name: string;
  category: 'resume' | 'transcript' | 'certificate' | 'reference' | 'other';
  size: string;
  uploadDate: string;
  fileUrl?: string;
  googleDriveFileId?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: string;
  uploadedAt?: string;
  ownerId?: string;
  webViewLink?: string;
  webContentLink?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'interview' | 'class' | 'work' | 'other';
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  location?: string;
  isPublic?: boolean;
  reminderMinutes?: number; // 0 (at time), 5, 10, 15, 30, 60
  sendGmail?: boolean;
  gmailAddress?: string;
}

// Initial Seeds with Ramachandra Murthy Mamidipalli's specific professional details
export const EMPTY_PROFILE: PersonalProfile = {
  name: "",
  firstName: "",
  lastName: "",
  headline: "",
  email: "",
  secondaryEmail: "",
  phone: "",
  secondaryPhone: "",
  location: "",
  bio: "",
  avatarUrl: "",
  publicProfile: false
};

export const INITIAL_PROFILE: PersonalProfile = {
  name: "Ramachandra Murthy Mamidipalli",
  firstName: "Ramachandra Murthy",
  lastName: "Mamidipalli",
  headline: "Business Analytics",
  email: "ramachandramurthymamidipalli1@gmail.com",
  secondaryEmail: "subramanyaramachandramurthy@gmail.com",
  phone: "9390692684",
  secondaryPhone: "8096810120",
  location: "Hyderabad, Telangana, India",
  bio: "Aspiring Business Analyst with an MBA seeking to leverage skills in data analysis, process improvement, and stakeholder communication to help organizations make informed, strategic decisions and drive operational excellence.",
  avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?fit=crop&w=400&h=400",
  publicProfile: true
};

export const INITIAL_SKILLS: Skill[] = [
  { id: 'sk-1', name: 'Power BI & Tableau', visibility: 'public', yearsOfExp: 3, endorsements: 24 },
  { id: 'sk-2', name: 'SQL Database Querying', visibility: 'public', yearsOfExp: 4, endorsements: 29 },
  { id: 'sk-3', name: 'Excel Advanced Analytics', visibility: 'public', yearsOfExp: 5, endorsements: 31 },
  { id: 'sk-4', name: 'Business Intelligence Reporting', visibility: 'public', yearsOfExp: 3, endorsements: 22 },
  { id: 'sk-5', name: 'Data Modeling & ETL', visibility: 'public', yearsOfExp: 3, endorsements: 18 },
  { id: 'sk-6', name: 'Python for Data Science', visibility: 'private', yearsOfExp: 2, endorsements: 15 },
  { id: 'sk-7', name: 'Process Mapping & Optimization', visibility: 'public', yearsOfExp: 3, endorsements: 19 },
  { id: 'sk-8', name: 'Manual & Automated QA Testing', visibility: 'public', yearsOfExp: 1, endorsements: 12 },
  { id: 'sk-9', name: 'Requirements Engineering', visibility: 'private', yearsOfExp: 3, endorsements: 16 },
  { id: 'sk-10', name: 'Agile & Scrum Delivery', visibility: 'public', yearsOfExp: 3, endorsements: 14 }
];

export const INITIAL_EDUCATION: Education[] = [
  {
    id: 'ed-1',
    institution: 'Amity University',
    degree: 'Master of Business Administration (MBA)',
    fieldOfStudy: 'Business Analytics',
    startYear: '2023',
    endYear: '2025',
    startDate: '2025-07-02',
    endDate: 'Present',
    grade: 'First Class',
    activities: 'Focusing on business intelligence, decision sciences, and data-driven marketing strategies.'
  },
  {
    id: 'ed-2',
    institution: 'Koneru Lakshmaiah Education Foundation',
    degree: 'Bachelor of Technology (B.Tech.)',
    fieldOfStudy: 'Computer Science and Engineering',
    startYear: '2019',
    endYear: '2023',
    startDate: '2019-06-01',
    endDate: '2023-05-30',
    grade: '8.5 CGPA',
    activities: 'Coordinated technical events, participated in national hackathons, and developed web architectures.'
  },
  {
    id: 'ed-3',
    institution: 'Aditya Junior College',
    degree: 'Intermediate',
    fieldOfStudy: 'Mathematics, Physics, Chemistry (MPC)',
    startYear: '2017',
    endYear: '2019',
    startDate: '2017-06-12',
    endDate: '2019-03-27',
    grade: '980 Marks / 9.8 CGPA',
    activities: 'Excelled in advanced mathematics and regional youth science fairs.'
  },
  {
    id: 'ed-4',
    institution: 'Narayana High School',
    degree: 'Schooling / SSC',
    fieldOfStudy: 'General Academics',
    startYear: '2012',
    endYear: '2017',
    startDate: '2012-06-12',
    endDate: '2017-04-18',
    grade: '10.0 GPA',
    activities: 'Class prefect and volunteer for school community service projects.'
  }
];

export const INITIAL_CERTIFICATIONS: Certification[] = [
  {
    id: 'cert-1',
    title: 'BTECH (MIGRATION CERTIFICATE)',
    issuer: 'KL University',
    dateIssued: '2024-06-20',
    expirationDate: '',
    credentialId: 'KL-MC-2024-904',
    credentialUrl: '',
    type: 'study',
    visibility: 'private',
    fileName: 'Btech_Migration_Certificate.pdf'
  },
  {
    id: 'cert-2',
    title: 'BTECH (OD)',
    issuer: 'KL University',
    dateIssued: '2024-06-19',
    expirationDate: '',
    credentialId: 'KL-OD-2024-356',
    credentialUrl: '',
    type: 'study',
    visibility: 'private',
    fileName: 'Btech_OD.pdf'
  },
  {
    id: 'cert-3',
    title: 'BTECH (TC & STUDY CERTIFICATE)',
    issuer: 'KL University',
    dateIssued: '2024-06-19',
    expirationDate: '',
    credentialId: 'KL-TC-2024-789',
    credentialUrl: '',
    type: 'study',
    visibility: 'private',
    fileName: 'Btech_TC_Study_Cert.pdf'
  },
  {
    id: 'cert-4',
    title: 'BTECH (CMM)',
    issuer: 'KL University',
    dateIssued: '2024-06-19',
    expirationDate: '',
    credentialId: 'KL-CMM-2024-811',
    credentialUrl: '',
    type: 'study',
    visibility: 'private',
    fileName: 'Btech_CMM.pdf'
  },
  {
    id: 'cert-5',
    title: 'BTECH (PC)',
    issuer: 'KL University',
    dateIssued: '2024-06-19',
    expirationDate: '',
    credentialId: 'KL-PC-2024-542',
    credentialUrl: '',
    type: 'study',
    visibility: 'private',
    fileName: 'Btech_PC.pdf'
  },
  {
    id: 'cert-6',
    title: 'Intermediate',
    issuer: 'Aditya Junior College',
    dateIssued: '2019-05-01',
    expirationDate: '',
    credentialId: 'AJC-INTER-2019-001',
    credentialUrl: '',
    type: 'study',
    visibility: 'private',
    fileName: 'Intermediate_Cert.pdf'
  },
  {
    id: 'cert-7',
    title: 'Schooling',
    issuer: 'Narayana EM High School',
    dateIssued: '2017-05-06',
    expirationDate: '',
    credentialId: 'NMS-SSC-2017-004',
    credentialUrl: '',
    type: 'study',
    visibility: 'private',
    fileName: 'Schooling_Cert.pdf'
  },
  {
    id: 'cert-8',
    title: 'Business Analytics Specialization',
    issuer: 'Wharton Online',
    dateIssued: '2023-11-15',
    expirationDate: '',
    credentialId: 'WHARTON-BA-99382',
    credentialUrl: 'https://coursera.org/verify/wharton-ba',
    type: 'course',
    visibility: 'public',
    fileName: 'Wharton_Business_Analytics.pdf'
  },
  {
    id: 'cert-9',
    title: 'SQL for Business Intelligence',
    issuer: 'Coursera (Google Career Certificates)',
    dateIssued: '2023-04-10',
    expirationDate: '',
    credentialId: 'COURSERA-G-SQL-4402',
    credentialUrl: 'https://coursera.org/verify/google-sql',
    type: 'course',
    visibility: 'public',
    fileName: 'Google_SQL_Certificate.pdf'
  },
  {
    id: 'cert-10',
    title: 'Consolidated Memo of Marks',
    issuer: 'KL University',
    dateIssued: '2023-06-15',
    expirationDate: '',
    credentialId: 'KL-CMM-ARKS-991',
    credentialUrl: '',
    type: 'grades',
    visibility: 'private',
    fileName: 'Btech_Consolidated_Marks.pdf'
  },
  {
    id: 'cert-11',
    title: 'Semester-1 Grade Memo',
    issuer: 'KL University',
    dateIssued: '2019-12-20',
    expirationDate: '',
    credentialId: 'KL-SEM1-8849',
    credentialUrl: '',
    type: 'grades',
    visibility: 'private',
    fileName: 'Btech_Sem1_Grades.pdf'
  }
];

export const INITIAL_EXPERIENCE: Experience[] = [
  {
    id: 'exp-1',
    role: 'QA Automation & Testing Intern',
    company: 'Photonx Technologies',
    location: 'Hyderabad, India (On-site)',
    startDate: '2026-05',
    endDate: 'Present',
    isCurrent: true,
    description: [
      "Constructing and executing UI regression testing scripts for primary client workspaces using modern automation frameworks.",
      "Auditing oauth integration and form fields flow logic to ensure robust credential handling.",
      "Documenting edge-case api payload testing criteria and benchmarking network throughput speeds."
    ],
    skillsUsed: ["Regression Testing", "Cypress", "QA Automation", "Process Auditing"],
    links: []
  },
  {
    id: 'exp-2',
    role: 'Business Analytics Team Lead (Academic)',
    company: 'Amity Analytics Group',
    location: 'Noida, India',
    startDate: '2023-08',
    endDate: '2025-05',
    isCurrent: false,
    description: [
      "Directed student analytics group projects analyzing complex corporate data assets to extract actionable insights.",
      "Designed data-driven segmentation models and formulated interactive reporting structures in Power BI.",
      "Presented bi-weekly strategic optimization metrics to executive advisor panels."
    ],
    skillsUsed: ["Power BI", "Data Modeling", "Business Intelligence", "Excel"],
    links: []
  }
];

export const EMPTY_CURRENT_JOB: CurrentJob = {
  employer: "",
  role: "",
  startDate: "",
  department: "",
  employmentType: "internship",
  locationType: "on-site",
  currentProjects: [],
  dailyStandupText: "",
  weeklyGoals: []
};

export const INITIAL_CURRENT_JOB: CurrentJob = {
  employer: "Photonx Technologies",
  role: "Tester",
  startDate: "2026-05-14",
  department: "Testing",
  employmentType: "internship",
  locationType: "on-site",
  currentProjects: [
    { id: 'cp-1', name: 'UI Regression Tests', status: 'in-progress', desc: 'Writing Cypress integration tests for authentication forms.' },
    { id: 'cp-2', name: 'API Load Benchmarking', status: 'completed', desc: 'Conducted scale tests with k6 up to 500 requests/sec.' }
  ],
  dailyStandupText: "Constructing regression testing scripts for the main client workspace and auditing the new oauth integrations.",
  weeklyGoals: [
    { id: 'wg-1', text: 'Document edge case payloads for profile updates', completed: true },
    { id: 'wg-2', text: 'Achieve 85% test coverage on active dashboard components', completed: false }
  ]
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'HR Analytics Dashboard',
    category: 'utilities',
    description: "Developed an HR Attrition Analytics dashboard using Power BI, MySQL, and Excel on IBM's 1,470-employee dataset to identify key drivers of attrition, enhance retention strategies, and optimize workforce planning.",
    techStack: ['Power BI', 'MySQL', 'Excel'],
    githubUrl: 'https://github.com/ramachandramurthy/hr-analytics-dashboard',
    liveUrl: 'https://nexus-crm-six-pi.vercel.app/projects',
    highlights: ['Identified 3 major key drivers of attrition', 'Helped optimize attrition/workforce planning'],
    date: 'Dec 2025',
    type: 'project',
    isPublic: true
  },
  {
    id: 'proj-2',
    name: 'Sales Revenue Analysis.',
    category: 'utilities',
    description: "Designed an end-to-end Sales Revenue Analysis dashboard using Power BI, MySQL, and Excel analyzing 10,000+ transactions across regions to report seasonal trends, product velocities, and customer demographical profiles.",
    techStack: ['Power BI', 'MySQL', 'Excel'],
    githubUrl: 'https://github.com/ramachandramurthy/sales-revenue-analysis',
    liveUrl: 'https://nexus-crm-six-pi.vercel.app/projects',
    highlights: ['Analyzed 10,000+ quarterly transactions', 'Reported seasonal trends and demographical profiles'],
    date: 'Jan 2026',
    type: 'project',
    isPublic: true
  },
  {
    id: 'proj-3',
    name: 'Customer Retention & Churn Prediction Model',
    category: 'enterprise',
    description: 'An analytical pipeline leveraging customer lifecycle databases, SQL, and Python to isolate critical dropoff clusters and forecast cohort churn velocities.',
    techStack: ['SQL', 'Python', 'Jupyter', 'Pandas', 'Tableau'],
    githubUrl: 'https://github.com/ramachandramurthy/customer-churn-model',
    liveUrl: '',
    highlights: ['Visualized customer retention trends', 'Isolated top 4 predictive trigger criteria for churn', 'Optimized pipeline runtime by 35%'],
    date: 'Oct 2024',
    type: 'project',
    isPublic: true
  },
  {
    id: 'proj-4',
    name: 'Operations Process Optimizer',
    category: 'utilities',
    description: 'Formulated linear programming simulations and business workflows to streamline warehouse supply line velocities.',
    techStack: ['Excel Solver', 'MySQL', 'Python', 'Process Optimization'],
    githubUrl: 'https://github.com/ramachandramurthy/ops-process-optimizer',
    liveUrl: '',
    highlights: ['Reduced average turnaround delay indices by 18 hours', 'Formulated mathematical process allocation matrices'],
    date: 'Mar 2025',
    type: 'project',
    isPublic: true
  }
];

export const INITIAL_LINKS: PortfolioLink[] = [
  { id: 'lk-1', platform: 'GitHub', url: 'https://github.com/ramachandramurthy', label: 'github.com/ramachandramurthy', isPublic: true },
  { id: 'lk-2', platform: 'LinkedIn', url: 'https://linkedin.com/in/ramachandra-murthy-mamidipalli', label: 'linkedin.com/in/ramachandra-murthy', isPublic: true }
];

export const INITIAL_TIMELINE: TimelineMilestone[] = [
  { id: 'mil-1', date: '2019-06', title: 'Admitted to B.Tech at KL University', category: 'education', description: 'Began engineering studies in Computer Science & Engineering on merit.', intensity: 'medium' },
  { id: 'mil-2', date: '2023-05', title: 'Graduated with 8.5 CGPA', category: 'education', description: 'Completed B.Tech in CSE with a strong focus on data structures and databases.', intensity: 'high' },
  { id: 'mil-3', date: '2023-07', title: 'Commenced MBA at Amity University', category: 'education', description: 'Started Master of Business Administration under Business Analytics track.', intensity: 'high' },
  { id: 'mil-4', date: '2026-05', title: 'Joined Photonx Technologies as QA Intern', category: 'experience', description: 'Accepted the Tester role to build test scripts and audit integration features.', intensity: 'high' }
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'ct-1',
    name: 'Marcus Vance',
    role: 'Director of Talent Acquisition',
    company: 'Stellar Talent Partners',
    email: 'm.vance@stellartalent.com',
    phone: '+91 98765 43210',
    category: 'recruiter',
    notes: 'Inquired about executive business analytics consulting and data-driven resource planning profiles.',
    relationshipStrength: 4,
    status: 'hot',
    lastInteracted: '2026-05-31',
    interactionLogs: [
      { id: 'log-2-1', timestamp: '2026-05-31T11:00:00Z', type: 'call', summary: 'Introductory discussion regarding analyst roles' }
    ]
  },
  {
    id: 'ct-2',
    name: 'Dr. Srinivas Prasad',
    role: 'Senior Professor of CSE',
    company: 'KL University',
    email: 'sprasad@kluniversity.in',
    phone: '+91 94401 22901',
    category: 'mentor',
    notes: 'Undergraduate study advisor. Provides excellent mentorship on technological data research paths.',
    relationshipStrength: 5,
    status: 'active',
    lastInteracted: '2026-04-15',
    interactionLogs: [
      { id: 'log-3-1', timestamp: '2026-04-15T10:00:00Z', type: 'email', summary: 'Discussed graduation marks memos and academic transcripts.' }
    ]
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-1', title: 'Business Analytics Hackathon Finalist', date: '2024-10', issuer: 'Amity Analytics Track', description: 'Selected as top finalist for generating predictive models capturing customer attrition variables.' },
  { id: 'ach-2', title: 'KL University CSE Special Distinction', date: '2023-04', issuer: 'Koneru Lakshmaiah Education Foundation', description: 'Awarded academic distinction for CSE cohort project delivery.' }
];

export const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Dr. Srinivas Prasad',
    role: 'Senior Professor of CSE',
    company: 'Koneru Lakshmaiah Education Foundation',
    avatarColor: 'emerald',
    relationship: 'Academic Advisor & Mentor',
    text: "Ramachandra possesses a brilliant analytical mind. He excels at taking mathematical algorithms and mapping them to actionable business metrics. Extremely diligent."
  },
  {
    id: 'test-2',
    name: 'Sarah Jenkins',
    role: 'Lead Project Coordinator',
    company: 'Photonx Technologies',
    avatarColor: 'sky',
    relationship: 'Tester Internship Sponsor',
    text: "He brings a very structured approach to testing. He quickly isolates edge cases and validates critical components with precision. An incredible technical addition."
  }
];

export const INITIAL_DOCUMENTS: VaultDocument[] = [
  { id: 'doc-1', name: 'Ramachandra_Murthy_CV.pdf', category: 'resume', size: '210 KB', uploadDate: '2026-05-15' },
  { id: 'doc-2', name: 'KLU_Degree_Transcript.pdf', category: 'transcript', size: '1.4 MB', uploadDate: '2026-05-18' },
  { id: 'doc-3', name: 'Wharton_Business_Analytics_Cert.pdf', category: 'certificate', size: '180 KB', uploadDate: '2026-05-20' }
];

export interface NotepadNote {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  category?: string;
  isPinned?: boolean;
}

export interface ResumeItem {
  id: string;
  name: string;
  type: string; // "Resume" | "Cover Letter" | "Academic Transcript" | "Certificate" | "Other"
  visibility: 'public' | 'private';
  fileName: string;
  size: string;
  uploadDate: string;
  category: string; // e.g. "SUPABASE"
  fileDataUrl?: string;
  linkUrl?: string;
}

export interface SharedPortfolioData {
  p?: PersonalProfile;
  s?: Skill[];
  e?: Experience[];
  c?: Certification[];
  pr?: Project[];
  ed?: Education[];
  a?: Achievement[];
  t?: Testimonial[];
  l?: PortfolioLink[];
  cal?: CalendarEvent[];
  resumes?: ResumeItem[];
}

export function encodePortfolioData(data: SharedPortfolioData): string {
  try {
    const jsonString = JSON.stringify(data);
    const textBytes = new TextEncoder().encode(jsonString);
    const binString = Array.from(textBytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (error) {
    console.error("Error encoding portfolio data:", error);
    return "";
  }
}

export function decodePortfolioData(base64Str: string): SharedPortfolioData | null {
  try {
    if (!base64Str) return null;
    let str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    const binString = atob(str);
    const textBytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));
    const jsonString = new TextDecoder().decode(textBytes);
    return JSON.parse(jsonString) as SharedPortfolioData;
  } catch (error) {
    console.error("Error decoding portfolio data:", error);
    return null;
  }
}

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Data Analyst Tech Interview',
    description: 'Technical rounds on SQL optimizations, joins, indexing, and window functions.',
    type: 'interview',
    date: '2026-06-22',
    startTime: '10:00',
    endTime: '11:30',
    location: 'Microsoft Teams Link',
    isPublic: true
  },
  {
    id: 'evt-2',
    title: 'Business Intelligence & SQL Deep Dive',
    description: 'Lecture 12: Complex dimensional models & ETL pipelines.',
    type: 'class',
    date: '2026-06-23',
    startTime: '14:00',
    endTime: '15:30',
    location: 'Auditorium B - Tech Campus',
    isPublic: true
  },
  {
    id: 'evt-3',
    title: 'HR Dashboard Sprint Check-in',
    description: 'Weekly alignment on project progress and analytics insights.',
    type: 'work',
    date: '2026-06-24',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Slack/Huddle',
    isPublic: false
  },
  {
    id: 'evt-4',
    title: 'Final Project Demo Preparation',
    description: 'Dry run presentation for stakeholders.',
    type: 'class',
    date: '2026-06-26',
    startTime: '11:00',
    endTime: '12:30',
    location: 'Zoom Classroom 4',
    isPublic: true
  }
];


