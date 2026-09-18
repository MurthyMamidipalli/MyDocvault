import { ID, Query, Permission, Role } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { getAppwrite, isAppwriteConfigured } from "../database/appwrite";
import { localStore } from "./localStore";

/**
 * Interface representing the complete structure of user workspace data.
 */
export interface CompleteUserData {
  profile?: any;
  skills?: any[];
  education?: any[];
  certifications?: any[];
  experience?: any[];
  currentJob?: any;
  projects?: any[];
  products?: any[];
  others?: any[];
  links?: any[];
  resumeLinks?: any[];
  milestones?: any[];
  contacts?: any[];
  achievements?: any[];
  testimonials?: any[];
  documents?: any[];
  calendarEvents?: any[];
  notes?: any[];
  resumes?: any[];
}

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "nexuscrm";

/**
 * Helper to get the endpoint, project ID and database ID for Appwrite operations.
 */
function getAppwriteConfig() {
  const endpoint = (process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1").replace(/\/$/, "");
  const projectId = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
  return { endpoint, projectId, databaseId: DATABASE_ID };
}

/**
 * Safely initializes Appwrite Databases, Collections, Attributes, and Storage Buckets on startup.
 */
export async function initializeAppwriteSchema(): Promise<void> {
  if (!isAppwriteConfigured()) {
    console.log("[Appwrite Schema] Appwrite environment variables (VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, APPWRITE_API_KEY) are not provided. Initializing local persistent storage engine.");
    return;
  }

  try {
    const { databases, storage } = getAppwrite();
    const config = getAppwriteConfig();

    console.log(`[Appwrite Schema] Verifying database '${config.databaseId}'...`);
    try {
      await databases.get(config.databaseId);
      console.log(`[Appwrite Schema] Database '${config.databaseId}' exists.`);
    } catch (e: any) {
      if (e.code === 404) {
        console.log(`[Appwrite Schema] Database '${config.databaseId}' not found. Creating...`);
        await databases.create(config.databaseId, "NexusCRM Database");
        console.log(`[Appwrite Schema] Database '${config.databaseId}' created successfully.`);
      } else {
        throw e;
      }
    }

    // Define all table collections and their attributes
    const collectionsToCreate = [
      {
        id: "users",
        name: "Users Table",
        attributes: [
          { key: "email", type: "string", size: 255, required: true },
          { key: "password", type: "string", size: 255, required: false },
          { key: "first_name", type: "string", size: 100, required: false },
          { key: "last_name", type: "string", size: 100, required: false },
          { key: "is_mail_only", type: "boolean", required: false, default: false }
        ]
      },
      ...[
        "profiles", "education", "experience", "skills", "projects", "products",
        "certifications", "grade_sheets", "documents", "resumes", "notes",
        "calendar_events", "contacts", "settings"
      ].map(collectionName => ({
        id: collectionName,
        name: `${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)} Collection`,
        attributes: [
          { key: "user_email", type: "string", size: 255, required: true },
          { key: "data", type: "string", size: 16777216, required: true } // mapped to LONGTEXT for raw JSON serialization
        ]
      })),
      {
        id: "public_profiles",
        name: "Public Profiles Collection",
        attributes: [
          { key: "user_email", type: "string", size: 255, required: true },
          { key: "slug", type: "string", size: 255, required: true },
          { key: "profile_json", type: "string", size: 16777216, required: true },
          { key: "is_public", type: "boolean", required: false, default: true }
        ]
      },
      {
        id: "activity_logs",
        name: "Activity Logs Collection",
        attributes: [
          { key: "user_email", type: "string", size: 255, required: true },
          { key: "action", type: "string", size: 255, required: true },
          { key: "details", type: "string", size: 16777216, required: false },
          { key: "created_at", type: "string", size: 100, required: false }
        ]
      }
    ];

    for (const coll of collectionsToCreate) {
      console.log(`[Appwrite Schema] Verifying collection '${coll.id}'...`);
      let collectionExists = false;
      try {
        await databases.getCollection(config.databaseId, coll.id);
        collectionExists = true;
        console.log(`[Appwrite Schema] Collection '${coll.id}' exists.`);
      } catch (e: any) {
        if (e.code === 404) {
          console.log(`[Appwrite Schema] Collection '${coll.id}' not found. Creating...`);
          // Grant public read/write permissions to simplify proxy usage
          await databases.createCollection(
            config.databaseId,
            coll.id,
            coll.name,
            [
              Permission.read(Role.any()),
              Permission.write(Role.any()),
              Permission.create(Role.any()),
              Permission.update(Role.any()),
              Permission.delete(Role.any())
            ]
          );
          console.log(`[Appwrite Schema] Collection '${coll.id}' created successfully.`);
        } else {
          throw e;
        }
      }

      // Check and create missing attributes for the collection
      for (const attr of coll.attributes) {
        try {
          if (attr.type === "string") {
            await databases.createStringAttribute(config.databaseId, coll.id, attr.key, attr.size, attr.required, undefined, false);
          } else if (attr.type === "boolean") {
            await databases.createBooleanAttribute(config.databaseId, coll.id, attr.key, attr.required, attr.default);
          }
          console.log(`[Appwrite Schema] Attribute '${attr.key}' created in collection '${coll.id}'.`);
        } catch (e: any) {
          // If attribute already exists, ignore
        }
      }
    }

    // Initialize required Storage Buckets
    const bucketsToCreate = [
      { id: "profile-images", name: "Profile Images" },
      { id: "resumes", name: "Resumes" },
      { id: "certificates", name: "Certificates" },
      { id: "grade-sheets", name: "Grade Sheets" },
      { id: "project-files", name: "Project Files" },
      { id: "documents", name: "Documents" },
      { id: "product-images", name: "Product Images" }
    ];

    for (const bucket of bucketsToCreate) {
      console.log(`[Appwrite Schema] Verifying storage bucket '${bucket.id}'...`);
      try {
        await storage.getBucket(bucket.id);
        console.log(`[Appwrite Schema] Storage bucket '${bucket.id}' exists.`);
      } catch (e: any) {
        if (e.code === 404) {
          console.log(`[Appwrite Schema] Storage bucket '${bucket.id}' not found. Creating...`);
          await storage.createBucket(
            bucket.id,
            bucket.name,
            [
              Permission.read(Role.any()),
              Permission.write(Role.any()),
              Permission.create(Role.any()),
              Permission.update(Role.any()),
              Permission.delete(Role.any())
            ]
          );
          console.log(`[Appwrite Schema] Storage bucket '${bucket.id}' created successfully.`);
        } else {
          throw e;
        }
      }
    }

    console.log("[Appwrite Schema] Schema initialization finalized successfully.");
  } catch (err: any) {
    console.warn("[Appwrite Schema Warning] Setup bypass or failure:", err.message || err);
  }
}

/**
 * Uploads a base64 data URL to Appwrite Storage.
 * Maps content to specific buckets and generates public URLs.
 */
export async function uploadBase64ToStorage(
  base64Str: string,
  bucketName: string,
  fileNameHint: string
): Promise<string> {
  if (!isAppwriteConfigured()) {
    console.log(`[Storage Fallback] Appwrite storage not configured; retaining asset locally for '${fileNameHint}'.`);
    return base64Str;
  }

  const { storage } = getAppwrite();
  const config = getAppwriteConfig();

  // Parse the mime type and clean base64 data
  const matches = base64Str.match(/^data:([a-zA-Z0-9\-]+\/[a-zA-Z0-9\-.+]+);base64,(.*)$/);
  if (!matches) {
    throw new Error("Invalid base64 string format");
  }

  const contentType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  // Determine file extension
  let extension = "bin";
  if (contentType.includes("pdf")) extension = "pdf";
  else if (contentType.includes("png")) extension = "png";
  else if (contentType.includes("jpeg") || contentType.includes("jpg")) extension = "jpg";
  else if (contentType.includes("svg")) extension = "svg";
  else if (contentType.includes("gif")) extension = "gif";
  else if (contentType.includes("text") || contentType.includes("plain")) extension = "txt";

  const cleanFileName = `${Date.now()}_${fileNameHint.replace(/[^a-zA-Z0-9]/g, "_")}.${extension}`;

  console.log(`[Appwrite Storage] Uploading file to bucket '${bucketName}' as '${cleanFileName}' (${buffer.length} bytes)...`);

  const fileInput = InputFile.fromBuffer(buffer, cleanFileName);
  const fileId = ID.unique();

  const fileResult = await storage.createFile(bucketName, fileId, fileInput);

  const publicUrl = `${config.endpoint}/storage/buckets/${bucketName}/files/${fileResult.$id}/view?project=${config.projectId}`;

  console.log(`[Appwrite Storage] Upload success! Generated public URL: ${publicUrl}`);
  return publicUrl;
}

/**
 * Scans user data structures, extracts any embedded base64 assets, uploads them
 * to the appropriate Appwrite Storage buckets, and replaces them with public URLs.
 */
async function processAndStoreAssets(email: string, data: CompleteUserData): Promise<CompleteUserData> {
  const processed = { ...data };

  // 1. Profile photos (to profile-images)
  if (processed.profile?.avatarUrl && processed.profile.avatarUrl.startsWith("data:")) {
    try {
      processed.profile.avatarUrl = await uploadBase64ToStorage(
        processed.profile.avatarUrl,
        "profile-images",
        `${email}_avatar`
      );
    } catch (e) {
      console.error("[Storage Asset Sync] Failed to sync profile avatar:", e);
    }
  }

  // 2. Resumes list (to resumes)
  if (processed.resumes && Array.isArray(processed.resumes)) {
    processed.resumes = await Promise.all(
      processed.resumes.map(async (item: any) => {
        if (item.fileDataUrl && item.fileDataUrl.startsWith("data:")) {
          try {
            const url = await uploadBase64ToStorage(item.fileDataUrl, "resumes", item.name || "resume");
            return { ...item, fileDataUrl: url };
          } catch (e) {
            console.error("[Storage Asset Sync] Failed to sync resume file:", e);
          }
        }
        return item;
      })
    );
  }

  // 3. Certifications list (to certificates)
  if (processed.certifications && Array.isArray(processed.certifications)) {
    processed.certifications = await Promise.all(
      processed.certifications.map(async (item: any) => {
        if (item.fileDataUrl && item.fileDataUrl.startsWith("data:")) {
          try {
            const url = await uploadBase64ToStorage(item.fileDataUrl, "certificates", item.name || "cert");
            return { ...item, fileDataUrl: url };
          } catch (e) {
            console.error("[Storage Asset Sync] Failed to sync certificate file:", e);
          }
        }
        return item;
      })
    );
  }

  // 4. Documents list (to documents or grade-sheets)
  if (processed.documents && Array.isArray(processed.documents)) {
    processed.documents = await Promise.all(
      processed.documents.map(async (item: any) => {
        if (item.fileDataUrl && item.fileDataUrl.startsWith("data:")) {
          const bucket = item.category === "transcript" || item.category === "grade-sheet" ? "grade-sheets" : "documents";
          try {
            const url = await uploadBase64ToStorage(item.fileDataUrl, bucket, item.name || "document");
            return { ...item, fileDataUrl: url };
          } catch (e) {
            console.error("[Storage Asset Sync] Failed to sync document file:", e);
          }
        }
        return item;
      })
    );
  }

  // 5. Projects list (to project-files)
  if (processed.projects && Array.isArray(processed.projects)) {
    processed.projects = await Promise.all(
      processed.projects.map(async (item: any) => {
        let updated = { ...item };
        const coverSource = item.coverUrl || item.coverImageUrl;
        if (coverSource && coverSource.startsWith("data:")) {
          try {
            const uploaded = await uploadBase64ToStorage(coverSource, "project-files", `${item.name || item.title || "project"}_cover`);
            updated.coverUrl = uploaded;
            if (updated.coverImageUrl) updated.coverImageUrl = uploaded;
          } catch (e) {
            console.error("[Storage Asset Sync] Failed to sync project cover image:", e);
          }
        }
        const docSource = item.pdfUrl || item.documentationUrl;
        if (docSource && docSource.startsWith("data:")) {
          try {
            const uploaded = await uploadBase64ToStorage(docSource, "project-files", `${item.name || item.title || "project"}_doc`);
            updated.pdfUrl = uploaded;
            if (updated.documentationUrl) updated.documentationUrl = uploaded;
          } catch (e) {
            console.error("[Storage Asset Sync] Failed to sync project documentation:", e);
          }
        }
        return updated;
      })
    );
  }

  // 6. Products list (to product-images / project-files)
  if (processed.products && Array.isArray(processed.products)) {
    processed.products = await Promise.all(
      processed.products.map(async (item: any) => {
        let updated = { ...item };
        const imgSource = item.coverUrl || item.imageUrl || item.coverImageUrl;
        if (imgSource && imgSource.startsWith("data:")) {
          try {
            const uploaded = await uploadBase64ToStorage(imgSource, "product-images", `${item.name || item.title || "product"}_image`);
            if (item.coverUrl !== undefined) updated.coverUrl = uploaded;
            if (item.imageUrl !== undefined) updated.imageUrl = uploaded;
            if (item.coverImageUrl !== undefined) updated.coverImageUrl = uploaded;
            if (!updated.coverUrl && !updated.imageUrl) updated.coverUrl = uploaded;
          } catch (e) {
            console.error("[Storage Asset Sync] Failed to sync product image:", e);
          }
        }
        const docSource = item.pdfUrl || item.documentationUrl;
        if (docSource && docSource.startsWith("data:")) {
          try {
            const uploaded = await uploadBase64ToStorage(docSource, "project-files", `${item.name || item.title || "product"}_doc`);
            updated.pdfUrl = uploaded;
            if (updated.documentationUrl) updated.documentationUrl = uploaded;
          } catch (e) {
            console.error("[Storage Asset Sync] Failed to sync product documentation:", e);
          }
        }
        return updated;
      })
    );
  }

  // 7. Others list
  if (processed.others && Array.isArray(processed.others)) {
    processed.others = await Promise.all(
      processed.others.map(async (item: any) => {
        let updated = { ...item };
        const coverSource = item.coverUrl || item.coverImageUrl;
        if (coverSource && coverSource.startsWith("data:")) {
          try {
            const uploaded = await uploadBase64ToStorage(coverSource, "project-files", `${item.name || item.title || "document"}_cover`);
            updated.coverUrl = uploaded;
            if (updated.coverImageUrl) updated.coverImageUrl = uploaded;
          } catch (e) {
            console.error("[Storage Asset Sync] Failed to sync other doc cover image:", e);
          }
        }
        const docSource = item.pdfUrl || item.documentationUrl;
        if (docSource && docSource.startsWith("data:")) {
          try {
            const uploaded = await uploadBase64ToStorage(docSource, "project-files", `${item.name || item.title || "document"}_doc`);
            updated.pdfUrl = uploaded;
            if (updated.documentationUrl) updated.documentationUrl = uploaded;
          } catch (e) {
            console.error("[Storage Asset Sync] Failed to sync other documentation:", e);
          }
        }
        return updated;
      })
    );
  }

  return processed;
}

/**
 * Service providing database CRUD functions targeting Appwrite.
 */
export const appwriteService = {
  // --- USER CORE OPERATIONS ---

  async getUserByEmail(email: string) {
    if (!isAppwriteConfigured()) {
      return localStore.getUserByEmail(email);
    }

    const { databases } = getAppwrite();
    const cleanEmail = email.toLowerCase().trim();

    const response = await databases.listDocuments(DATABASE_ID, "users", [
      Query.equal("email", [cleanEmail]),
      Query.limit(1)
    ]);

    return response.documents[0] || null;
  },

  async createUser(email: string, passwordHash: string, firstName?: string, lastName?: string, isMailOnly = false) {
    if (!isAppwriteConfigured()) {
      return localStore.createUser(email, passwordHash, firstName, lastName, isMailOnly);
    }

    const { databases } = getAppwrite();
    const cleanEmail = email.toLowerCase().trim();

    // Verify user doesn't already exist in DB
    const existing = await this.getUserByEmail(cleanEmail);
    if (existing) {
      return existing;
    }

    const documentId = ID.unique();
    const userDoc = await databases.createDocument(DATABASE_ID, "users", documentId, {
      email: cleanEmail,
      password: passwordHash || "",
      first_name: firstName || "",
      last_name: lastName || "",
      is_mail_only: isMailOnly,
    });

    return userDoc;
  },

  async updateUserPassword(email: string, passwordHash: string) {
    if (!isAppwriteConfigured()) {
      return localStore.updateUserPassword(email, passwordHash);
    }

    const { databases } = getAppwrite();
    const cleanEmail = email.toLowerCase().trim();

    const existing = await this.getUserByEmail(cleanEmail);
    if (!existing) {
      throw new Error("No user record found to update password.");
    }

    await databases.updateDocument(DATABASE_ID, "users", existing.$id, {
      password: passwordHash,
    });
    return true;
  },

  async getAllUsers() {
    if (!isAppwriteConfigured()) {
      return localStore.getAllUsers();
    }

    const { databases } = getAppwrite();
    const response = await databases.listDocuments(DATABASE_ID, "users", [
      Query.limit(100)
    ]);
    return response.documents || [];
  },

  // --- WORKSPACE DATA DECONSTRUCTION & RESTORATION ---

  async saveUserData(email: string, rawData: CompleteUserData) {
    const cleanEmail = email.toLowerCase().trim();

    if (!isAppwriteConfigured()) {
      console.log(`[Local Store] Persisting workspace data for ${cleanEmail}...`);
      return localStore.saveUserData(cleanEmail, rawData);
    }

    const { databases } = getAppwrite();

    console.log(`[Appwrite Service] Saving complete workspace data for ${cleanEmail}...`);

    // Ensure the core user record exists first
    const user = await this.getUserByEmail(cleanEmail);
    if (!user) {
      console.log(`[Appwrite Service] Auto-creating missing user record for: ${cleanEmail}`);
      await this.createUser(cleanEmail, "", rawData.profile?.firstName, rawData.profile?.lastName, false);
    }

    // Process heavy file uploads (Base64) to Storage
    const data = await processAndStoreAssets(cleanEmail, rawData);

    const tablesToSync = [
      { name: "profiles", payload: data.profile || {} },
      { name: "education", payload: data.education || [] },
      { name: "experience", payload: data.experience || [] },
      { name: "skills", payload: data.skills || [] },
      { name: "projects", payload: data.projects || [] },
      { name: "products", payload: data.products || [] },
      { name: "certifications", payload: data.certifications || [] },
      { name: "documents", payload: data.documents || [] },
      { name: "resumes", payload: data.resumes || [] },
      { name: "notes", payload: data.notes || [] },
      { name: "calendar_events", payload: data.calendarEvents || [] },
      { name: "contacts", payload: data.contacts || [] },
      { name: "settings", payload: data.currentJob || {} },
    ];

    await Promise.all(
      tablesToSync.map(async (table) => {
        // Query if document exists
        const result = await databases.listDocuments(DATABASE_ID, table.name, [
          Query.equal("user_email", [cleanEmail]),
          Query.limit(1)
        ]);

        const payloadString = JSON.stringify(table.payload);

        if (result.documents.length > 0) {
          // Update
          await databases.updateDocument(DATABASE_ID, table.name, result.documents[0].$id, {
            data: payloadString,
          });
        } else {
          // Create
          await databases.createDocument(DATABASE_ID, table.name, ID.unique(), {
            user_email: cleanEmail,
            data: payloadString,
          });
        }
      })
    );

    console.log(`[Appwrite Service] Successfully persisted all tables for ${cleanEmail}!`);
    return data;
  },

  async getUserData(email: string): Promise<CompleteUserData> {
    const cleanEmail = email.toLowerCase().trim();

    if (!isAppwriteConfigured()) {
      console.log(`[Local Store] Restoring workspace data for ${cleanEmail}...`);
      return localStore.getUserData(cleanEmail);
    }

    const { databases } = getAppwrite();

    console.log(`[Appwrite Service] Restoring complete workspace data for ${cleanEmail}...`);

    const tablesToFetch = [
      "profiles",
      "education",
      "experience",
      "skills",
      "projects",
      "products",
      "certifications",
      "documents",
      "resumes",
      "notes",
      "calendar_events",
      "contacts",
      "settings",
    ];

    const results = await Promise.all(
      tablesToFetch.map(async (table) => {
        try {
          const res = await databases.listDocuments(DATABASE_ID, table, [
            Query.equal("user_email", [cleanEmail]),
            Query.limit(1)
          ]);
          
          if (res.documents.length > 0) {
            const raw = res.documents[0].data;
            return { table, payload: raw ? JSON.parse(raw) : null };
          }
        } catch (e: any) {
          console.error(`[Appwrite DB Error] Fetching table '${table}' failed:`, e.message || e);
        }
        return { table, payload: null };
      })
    );

    const lookup = results.reduce((acc, current) => {
      acc[current.table] = current.payload;
      return acc;
    }, {} as Record<string, any>);

    const completeData: CompleteUserData = {
      profile: lookup["profiles"] || {},
      education: lookup["education"] || [],
      experience: lookup["experience"] || [],
      skills: lookup["skills"] || [],
      projects: lookup["projects"] || [],
      products: lookup["products"] || [],
      certifications: lookup["certifications"] || [],
      documents: lookup["documents"] || [],
      resumes: lookup["resumes"] || [],
      notes: lookup["notes"] || [],
      calendarEvents: lookup["calendar_events"] || [],
      contacts: lookup["contacts"] || [],
      currentJob: lookup["settings"] || {},
    };

    return completeData;
  },

  // --- PUBLIC PORTFOLIO SHARES ---

  async getShareBySlug(slug: string) {
    const cleanSlug = slug.toLowerCase().trim();

    if (!isAppwriteConfigured()) {
      return localStore.getShareBySlug(cleanSlug);
    }

    const { databases } = getAppwrite();

    const response = await databases.listDocuments(DATABASE_ID, "public_profiles", [
      Query.equal("slug", [cleanSlug]),
      Query.limit(1)
    ]);

    return response.documents[0] || null;
  },

  async saveShare(slug: string, email: string, serialized: string) {
    const cleanSlug = slug.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    if (!isAppwriteConfigured()) {
      console.log(`[Local Store] Saving public portfolio share slug '${cleanSlug}' for ${cleanEmail}...`);
      return localStore.saveShare(cleanSlug, cleanEmail, serialized);
    }

    const { databases } = getAppwrite();

    console.log(`[Appwrite Service] Saving public portfolio share slug '${cleanSlug}' for ${cleanEmail}...`);

    const result = await databases.listDocuments(DATABASE_ID, "public_profiles", [
      Query.equal("slug", [cleanSlug]),
      Query.limit(1)
    ]);

    if (result.documents.length > 0) {
      await databases.updateDocument(DATABASE_ID, "public_profiles", result.documents[0].$id, {
        user_email: cleanEmail,
        profile_json: serialized,
        is_public: true,
      });
    } else {
      await databases.createDocument(DATABASE_ID, "public_profiles", ID.unique(), {
        slug: cleanSlug,
        user_email: cleanEmail,
        profile_json: serialized,
        is_public: true,
      });
    }

    return true;
  },

  async deleteShare(slug: string) {
    const cleanSlug = slug.toLowerCase().trim();

    if (!isAppwriteConfigured()) {
      return localStore.deleteShare(cleanSlug);
    }

    const { databases } = getAppwrite();

    const result = await databases.listDocuments(DATABASE_ID, "public_profiles", [
      Query.equal("slug", [cleanSlug]),
      Query.limit(1)
    ]);

    if (result.documents.length > 0) {
      await databases.deleteDocument(DATABASE_ID, "public_profiles", result.documents[0].$id);
    }
    return true;
  },
};
