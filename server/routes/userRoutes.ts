import express from "express";
import { appwriteService } from "../services/appwriteService";
import { mysqlService } from "../services/mysqlService";
import { isAppwriteConfigured } from "../database/appwrite";
import { safeJsonParse } from "../../server"; // Import logging safe JSON parse

const router = express.Router();

/**
 * GET /api/users
 * Returns list of registered users for backend compatibility/verification.
 */
router.get("/users", async (req, res, next) => {
  try {
    console.log("[API LOG] Route entered: GET /api/users");
    console.log("[API LOG] Parameters:", req.params, "Query:", req.query);

    let users;
    if (isAppwriteConfigured()) {
      console.log("[API LOG] Before database call: appwriteService.getAllUsers()");
      users = await appwriteService.getAllUsers();
    } else {
      console.log("[API LOG] Before database call: mysqlService.getAllUsers()");
      users = await mysqlService.getAllUsers();
    }
    console.log("[API LOG] After database call: getAllUsers() success, count:", users?.length);

    const formattedUsers = (users || []).map((u: any) => ({
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      password: u.password,
      isMailOnly: u.is_mail_only
    }));

    console.log("[API LOG] Before returning the response");
    return res.status(200).json({ users: formattedUsers });
  } catch (error) {
    console.error("[API ERROR] GET /api/users failed:", error);
    next(error);
  }
});

/**
 * POST /api/users
 * Backward-compatible endpoint to merge and save user records.
 */
router.post("/users", async (req, res, next) => {
  try {
    console.log("[API LOG] Route entered: POST /api/users");
    console.log("[API LOG] Parameters:", req.params, "Query:", req.query);

    const { users } = req.body;
    if (!users || !Array.isArray(users)) {
      console.log("[API LOG] Validation failed: missing or malformed users array");
      return res.status(400).json({ error: "Missing or malformed users array" });
    }

    console.log("[API LOG] Before database call: appwriteService.getAllUsers()");
    const current = await appwriteService.getAllUsers();
    console.log("[API LOG] After database call: getAllUsers() success, current count:", current?.length);

    const map = new Map<string, any>();
    current.forEach(u => map.set(u.email.toLowerCase(), u));

    // Register any new users in Appwrite database
    for (const u of users) {
      const email = u.email.toLowerCase().trim();
      if (!map.has(email)) {
        console.log(`[Users Sync] Auto-registering new synced account: ${email}`);
        const created = await appwriteService.createUser(
          email,
          u.password || "",
          u.firstName || "",
          u.lastName || "",
          u.isMailOnly || false
        );
        map.set(email, created);
      }
    }

    console.log("[API LOG] Before returning the response");
    return res.status(200).json({ success: true, count: map.size });
  } catch (error) {
    console.error("[API ERROR] POST /api/users failed:", error);
    next(error);
  }
});

/**
 * GET /api/userdata/:email
 * Reconstructs complete user data across structured tables.
 */
router.get("/userdata/:email", async (req, res, next) => {
  try {
    const { email } = req.params;
    console.log(`[API LOG] Route entered: GET /api/userdata/${email}`);
    console.log("[API LOG] Parameters:", req.params, "Query:", req.query);

    if (!email) {
      return res.status(400).json({ success: false, message: "Email parameter is required" });
    }

    let completeData;
    if (isAppwriteConfigured()) {
      console.log("[API LOG] Before database call: appwriteService.getUserData()");
      completeData = await appwriteService.getUserData(email);
    } else {
      console.log("[API LOG] Before database call: mysqlService.getUserData()");
      completeData = await mysqlService.getUserData(email);
    }
    const retrievedProjects = Array.isArray(completeData?.projects) ? completeData.projects : [];
    console.log("[PROJECT DEBUG] retrieved projects COUNT:", retrievedProjects.length);
    const projCount = retrievedProjects.length;
    const prodCount = Array.isArray(completeData?.products) ? completeData.products.length : 0;
    console.log(`[API LOG] Database retrieval complete for ${email}: ${projCount} projects, ${prodCount} products retrieved.`);

    const responsePayload = {
      success: true,
      data: JSON.stringify(completeData)
    };

    console.log("[API LOG] Before returning the response");
    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error(`[API ERROR] GET /api/userdata/:email failed:`, error);
    next(error);
  }
});

/**
 * POST /api/userdata/:email
 * Persists and deconstructs workspace JSON to separate database tables and storage files.
 */
router.post("/userdata/:email", async (req, res, next) => {
  try {
    const { email } = req.params;
    console.log(`[API LOG] Route entered: POST /api/userdata/${email}`);
    console.log("[API LOG] Parameters:", req.params, "Query:", req.query);

    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, message: "No data payload provided" });
    }

    console.log("[API LOG] Before JSON.parse() on client payload data string...");
    const parsedData = safeJsonParse(data, "userdata payload save");
    console.log("[PROJECT DEBUG] received projects:", parsedData?.projects, "COUNT:", parsedData?.projects?.length);
    const projCount = Array.isArray(parsedData?.projects) ? parsedData.projects.length : 0;
    const prodCount = Array.isArray(parsedData?.products) ? parsedData.products.length : 0;
    console.log(`[API LOG] Client synchronization request for ${email}: saving ${projCount} projects and ${prodCount} products.`);

    let updatedData;
    if (isAppwriteConfigured()) {
      console.log("[API LOG] Before database call: appwriteService.saveUserData()");
      updatedData = await appwriteService.saveUserData(email, parsedData);
    } else {
      console.log("[API LOG] Before database call: mysqlService.saveUserData()");
      updatedData = await mysqlService.saveUserData(email, parsedData);
    }
    const savedProjects = Array.isArray(updatedData?.projects) ? updatedData.projects : (Array.isArray(parsedData?.projects) ? parsedData.projects : []);
    console.log("[PROJECT DEBUG] saved projects COUNT:", savedProjects.length);
    console.log(`[API LOG] Database persistence completed: ${projCount} projects, ${prodCount} products saved.`);

    console.log("[API LOG] Before returning the response");
    return res.status(200).json({
      success: true,
      message: "Data synced successfully to MySQL database collections",
      updatedData: JSON.stringify(updatedData)
    });
  } catch (error) {
    console.error(`[API ERROR] POST /api/userdata/:email failed:`, error);
    next(error);
  }
});

export default router;
