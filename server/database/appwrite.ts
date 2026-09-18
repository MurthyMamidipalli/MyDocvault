import { Client, Databases, Storage, Users } from "node-appwrite";

interface AppwriteClients {
  client: Client;
  databases: Databases;
  storage: Storage;
  users: Users;
}

let appwriteInstance: AppwriteClients | null = null;

/**
 * Checks whether all required Appwrite credentials are present in the environment.
 */
export function isAppwriteConfigured(): boolean {
  const endpoint = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  return Boolean(endpoint && projectId && apiKey);
}

/**
 * Returns the Appwrite Client and service instances, initialized lazily on first use.
 * This prevents the application from crashing on boot if the environment
 * variables are not yet fully configured.
 */
export function getAppwrite(): AppwriteClients {
  if (appwriteInstance) {
    return appwriteInstance;
  }

  const endpoint = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    console.warn("[APPWRITE WARNING] Missing Appwrite environment credentials (VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, APPWRITE_API_KEY). Operations will fail until variables are defined.");
    throw new Error("Appwrite configuration is missing. Please declare VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, and APPWRITE_API_KEY in your environment configuration.");
  }

  console.log("[APPWRITE] Initializing administrative Appwrite client successfully...");
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  appwriteInstance = {
    client,
    databases: new Databases(client),
    storage: new Storage(client),
    users: new Users(client),
  };

  return appwriteInstance;
}
