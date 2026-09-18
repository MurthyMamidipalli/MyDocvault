import fs from "fs";
import path from "path";
import os from "os";
import type { CompleteUserData } from "./appwriteService";

interface LocalUser {
  $id: string;
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  is_mail_only?: boolean;
}

interface LocalShare {
  $id: string;
  slug: string;
  user_email: string;
  profile_json: string;
  is_public: boolean;
}

interface LocalStoreData {
  users: Record<string, LocalUser>;
  userData: Record<string, CompleteUserData>;
  shares: Record<string, LocalShare>;
}

class LocalStorageEngine {
  private data: LocalStoreData = {
    users: {},
    userData: {},
    shares: {}
  };
  private filePath: string | null = null;

  constructor() {
    this.resolveFilePath();
    this.loadFromDisk();
  }

  private resolveFilePath() {
    try {
      this.filePath = path.join(os.tmpdir(), "nexus_local_storage_cache.json");
    } catch {
      this.filePath = "/tmp/nexus_local_storage_cache.json";
    }
  }

  private loadFromDisk() {
    if (!this.filePath) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed) {
          this.data.users = parsed.users || {};
          this.data.userData = parsed.userData || {};
          this.data.shares = parsed.shares || {};
          console.log(`[Local Store] Successfully loaded cache from disk (${Object.keys(this.data.users).length} users, ${Object.keys(this.data.shares).length} shares)`);
        }
      }
    } catch (e: any) {
      console.warn("[Local Store] Notice: Could not read local file cache, using in-memory store:", e.message);
    }
  }

  private saveToDisk() {
    if (!this.filePath) return;
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err: any) {
      try {
        const tmpPath = "/tmp/local_storage_cache.json";
        fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), "utf-8");
        this.filePath = tmpPath;
      } catch (innerErr: any) {
        // Safe in-memory retention
      }
    }
  }

  // Users
  getUserByEmail(email: string): LocalUser | null {
    const key = email.toLowerCase().trim();
    return this.data.users[key] || null;
  }

  createUser(email: string, passwordHash: string, firstName?: string, lastName?: string, isMailOnly = false): LocalUser {
    const key = email.toLowerCase().trim();
    const user: LocalUser = {
      $id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: key,
      password: passwordHash || "",
      first_name: firstName || "",
      last_name: lastName || "",
      is_mail_only: isMailOnly
    };
    this.data.users[key] = user;
    this.saveToDisk();
    return user;
  }

  updateUserPassword(email: string, passwordHash: string): boolean {
    const key = email.toLowerCase().trim();
    if (!this.data.users[key]) return false;
    this.data.users[key].password = passwordHash;
    this.saveToDisk();
    return true;
  }

  getAllUsers(): LocalUser[] {
    return Object.values(this.data.users);
  }

  // User Workspace Data
  getUserData(email: string): CompleteUserData {
    const key = email.toLowerCase().trim();
    const existing = this.data.userData[key];
    if (existing) {
      return existing;
    }
    return {
      profile: {},
      skills: [],
      education: [],
      certifications: [],
      experience: [],
      projects: [],
      products: [],
      contacts: [],
      documents: [],
      resumes: [],
      notes: [],
      calendarEvents: [],
      currentJob: {}
    };
  }

  saveUserData(email: string, data: CompleteUserData): CompleteUserData {
    const key = email.toLowerCase().trim();
    this.data.userData[key] = data;
    
    // Auto-update user profile names if available
    if (this.data.users[key]) {
      if (data.profile?.firstName) this.data.users[key].first_name = data.profile.firstName;
      if (data.profile?.lastName) this.data.users[key].last_name = data.profile.lastName;
    } else {
      this.createUser(
        key,
        "",
        data.profile?.firstName || key.split("@")[0],
        data.profile?.lastName || "",
        false
      );
    }
    
    this.saveToDisk();
    return data;
  }

  // Shares
  getShareBySlug(slug: string): LocalShare | null {
    const key = slug.toLowerCase().trim();
    return this.data.shares[key] || null;
  }

  saveShare(slug: string, email: string, serialized: string): boolean {
    const key = slug.toLowerCase().trim();
    this.data.shares[key] = {
      $id: `share_${Date.now()}`,
      slug: key,
      user_email: email.toLowerCase().trim(),
      profile_json: serialized,
      is_public: true
    };
    this.saveToDisk();
    return true;
  }

  deleteShare(slug: string): boolean {
    const key = slug.toLowerCase().trim();
    if (this.data.shares[key]) {
      delete this.data.shares[key];
      this.saveToDisk();
      return true;
    }
    return false;
  }
}

export const localStore = new LocalStorageEngine();
