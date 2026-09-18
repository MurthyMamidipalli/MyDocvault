import express from "express";
import path from "path";
import fs from "fs";

// Initialize the Express app
export const app = express();

// Enable 150MB request limit for full telemetry/workspace payloads including PDFs and cover images
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// Logging wrappers for backwards compatibility and detailed visibility
export const safeFs = {
  existsSync(filePath: string): boolean {
    console.log(`[API LOG] Before filesystem access: fs.existsSync(${filePath})`);
    const result = fs.existsSync(filePath);
    console.log(`[API LOG] After filesystem access: fs.existsSync result is ${result}`);
    return result;
  },
  readFileSync(filePath: string, encoding: "utf-8"): string {
    console.log(`[API LOG] Before filesystem access: fs.readFileSync(${filePath})`);
    try {
      const result = fs.readFileSync(filePath, encoding);
      console.log(`[API LOG] After filesystem access: fs.readFileSync success`);
      return result;
    } catch (err) {
      console.error(`[API LOG] After filesystem access: fs.readFileSync failed:`, err);
      throw err;
    }
  },
  writeFileSync(filePath: string, data: string, encoding: "utf-8"): void {
    console.log(`[API LOG] Before filesystem access: fs.writeFileSync(${filePath})`);
    try {
      fs.writeFileSync(filePath, data, encoding);
      console.log(`[API LOG] After filesystem access: fs.writeFileSync success`);
    } catch (err) {
      console.error(`[API LOG] After filesystem access: fs.writeFileSync failed:`, err);
      throw err;
    }
  }
};

export function safeJsonParse(str: string, contextMessage = "JSON.parse"): any {
  console.log(`[API LOG] Before JSON.parse(): for string length ${str?.length || 0} (${contextMessage})`);
  try {
    const result = JSON.parse(str);
    console.log(`[API LOG] After JSON.parse(): success`);
    return result;
  } catch (err: any) {
    console.error(`[API LOG] After JSON.parse(): failed with error:`, err.message);
    throw err;
  }
}

// Enable comprehensive CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, x-client-origin"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// Startup state initializer (auto-configures Appwrite database & storage buckets on boot)
import { initializeAppwriteSchema } from "./server/services/appwriteService";

export async function initializeServerState() {
  console.log("[Startup] Initializing Appwrite schema and bucket configurations...");
  await initializeAppwriteSchema();
  console.log("[Startup] Appwrite backend is fully active and synchronized.");
}

// Import modular API routers
import authRoutes from "./server/routes/authRoutes";
import userRoutes from "./server/routes/userRoutes";
import shareRoutes from "./server/routes/shareRoutes";

// Request logging middleware for serverless and development visibility
app.use((req, res, next) => {
  console.log(`[HTTP INCOMING] ${req.method} ${req.url} (original: ${req.originalUrl})`);
  next();
});

// API health routes
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({ status: "online", database: "mysql", uptime: process.uptime() });
};
app.get("/api/health", healthHandler);
app.get("/health", healthHandler);

// Mount our structured controllers with both /api prefix and root prefix
// This ensures 100% compatibility whether the proxy/rewrites preserve /api or strip it
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/", userRoutes);
app.use("/api", shareRoutes);
app.use("/", shareRoutes);

// Error handling middleware to wrap every endpoint in consistent logging and response structures
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[API ERROR]", error);
  return res.status(500).json({
    success: false,
    route: req.originalUrl,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : null
  });
});
