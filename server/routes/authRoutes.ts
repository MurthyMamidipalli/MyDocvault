import express from "express";
import { appwriteService } from "../services/appwriteService";
import { getAppwrite, isAppwriteConfigured } from "../database/appwrite";
import { ID, Query, Client, Account } from "node-appwrite";

const router = express.Router();

/**
 * POST /api/auth/signup
 * Creates a new user in Appwrite Auth and caches in the public 'users' table.
 */
router.post("/signup", async (req, res, next) => {
  try {
    console.log("[API LOG] Route entered: POST /api/auth/signup");
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!isAppwriteConfigured()) {
      console.log(`[Auth Signup] Appwrite credentials not detected. Operating in local mode for: ${cleanEmail}`);
      const dbUser = await appwriteService.createUser(
        cleanEmail,
        password,
        firstName,
        lastName,
        false
      );

      return res.status(200).json({
        success: true,
        user: {
          email: dbUser.email,
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
        },
      });
    }

    const { users } = getAppwrite();

    console.log(`[Auth Signup] Creating Appwrite Auth account for: ${cleanEmail}`);
    
    // First, verify if user already exists in Appwrite Auth
    let authUser;
    try {
      const searchResult = await users.list([
        Query.equal("email", [cleanEmail]),
        Query.limit(1)
      ]);
      if (searchResult.users.length > 0) {
        authUser = searchResult.users[0];
        console.log(`[Auth Signup] User already exists in Appwrite Auth with ID: ${authUser.$id}`);
      }
    } catch (e) {
      console.log("[Auth Signup] Did not find any existing auth accounts.");
    }

    if (!authUser) {
      authUser = await users.create(
        ID.unique(),
        cleanEmail,
        undefined, // phone
        password,
        `${firstName || ""} ${lastName || ""}`.trim()
      );
      console.log(`[Auth Signup] Appwrite Auth account created successfully with ID: ${authUser.$id}`);
    }

    console.log(`[Auth Signup] Caching in database 'users' table...`);
    const dbUser = await appwriteService.createUser(
      cleanEmail,
      password,
      firstName,
      lastName,
      false
    );

    return res.status(200).json({
      success: true,
      user: {
        email: dbUser.email,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
      },
    });
  } catch (error: any) {
    console.error("[Auth Signup API Error]", error);
    return res.status(400).json({ success: false, message: error.message || "Failed to sign up" });
  }
});

/**
 * POST /api/auth/login
 * Standard login using Appwrite Authentication (with local fallback if cloud is not configured).
 */
router.post("/login", async (req, res, next) => {
  try {
    console.log("[API LOG] Route entered: POST /api/auth/login");
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!isAppwriteConfigured()) {
      console.log(`[Auth Login] Appwrite credentials not configured; validating user locally for: ${cleanEmail}`);
      let dbUser = await appwriteService.getUserByEmail(cleanEmail);
      if (!dbUser) {
        // Auto-register new account for convenient workspace usage
        console.log(`[Auth Login] Auto-registering user in local workspace store: ${cleanEmail}`);
        dbUser = await appwriteService.createUser(
          cleanEmail,
          password,
          cleanEmail.split("@")[0],
          "",
          false
        );
      } else if (dbUser.password && dbUser.password !== password) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      return res.status(200).json({
        success: true,
        user: {
          email: dbUser.email,
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
        },
      });
    }

    console.log(`[Auth Login] Verifying credentials for ${cleanEmail} via Appwrite Auth...`);
    
    const endpoint = (process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1").replace(/\/$/, "");
    const projectId = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;

    const userClient = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId!);

    const account = new Account(userClient);
    
    try {
      const session = await account.createEmailPasswordSession(cleanEmail, password);
      console.log(`[Auth Login] Session successfully created for ${cleanEmail}. Session ID: ${session.$id}`);
    } catch (authError: any) {
      console.warn("[Auth Login Error] Authentication verification failed:", authError.message || authError);
      return res.status(401).json({ success: false, message: authError.message || "Invalid email or password" });
    }

    console.log(`[Auth Login] Verification successful! Loading profile data from 'users' table...`);
    let dbUser = await appwriteService.getUserByEmail(cleanEmail);

    // If for some reason user exists in Appwrite Auth but not in our 'users' cache, auto-reconstruct
    if (!dbUser) {
      console.log(`[Auth Login] Syncing missing users table record for ${cleanEmail}`);
      dbUser = await appwriteService.createUser(
        cleanEmail,
        password,
        email.split("@")[0],
        "",
        false
      );
    }

    return res.status(200).json({
      success: true,
      user: {
        email: dbUser.email,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
      },
    });
  } catch (error: any) {
    console.error("[Auth Login API Error]", error);
    return res.status(500).json({ success: false, message: error.message || "Authentication failed" });
  }
});

/**
 * POST /api/auth/reset-password
 * Triggers a password update for the corresponding user.
 */
router.post("/reset-password", async (req, res, next) => {
  try {
    console.log("[API LOG] Route entered: POST /api/auth/reset-password");
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    console.log(`[Auth Reset] Triggering password update for: ${cleanEmail}`);

    // Update inside our database table / local store
    await appwriteService.updateUserPassword(cleanEmail, password);

    if (isAppwriteConfigured()) {
      const { users } = getAppwrite();
      console.log(`[Auth Reset] Querying Appwrite auth user index...`);
      const searchResult = await users.list([
        Query.equal("email", [cleanEmail]),
        Query.limit(1)
      ]);

      if (searchResult.users.length > 0) {
        const authUser = searchResult.users[0];
        console.log(`[Auth Reset] Modifying credentials on Auth profile: ${authUser.$id}`);
        await users.updatePassword(authUser.$id, password);
        console.log("[Auth Reset] Appwrite Auth password modified successfully.");
      } else {
        console.warn(`[Auth Reset] No Auth profile found for email ${cleanEmail}. Skipping Auth sync.`);
      }
    }

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("[Auth Reset API Error]", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to reset password" });
  }
});

export default router;

