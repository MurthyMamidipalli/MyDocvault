import { app, initializeServerState } from "./server";
import path from "path";
import express from "express";

const PORT = 3000;

async function startServer() {
  // Prevent startup synchronization on Vercel
  if (!process.env.VERCEL) {
    console.log("[Startup] Triggering asynchronous server state initialization...");
    initializeServerState().catch((err) => {
      console.error("[Startup] Server state initialization encountered error:", err);
    });
  }

  if (process.env.NODE_ENV !== "production") {
    // Development mode
    console.log("[Server] Starting in DEVELOPMENT mode with Vite dev middleware...");
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("[Server] Failed to initialize Vite dev server middleware:", err);
    }
  } else {
    // Production mode (e.g. Cloud Run)
    console.log("[Server] Starting in PRODUCTION mode with static file server...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Fast Express routing platform active on http://localhost:${PORT}`);
  });
}

startServer();
