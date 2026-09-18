import express from "express";
import { appwriteService } from "../services/appwriteService";

const router = express.Router();

const saveShareHandler = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { slug } = req.params;
    console.log(`[API LOG] Route entered: ${req.method} /api/share/${slug}`);
    console.log("[API LOG] Parameters:", req.params, "Query:", req.query);

    const { serialized, email } = req.body;

    if (!slug || !serialized) {
      console.log("[API LOG] Validation failed: missing parameters");
      return res.status(400).json({ error: "Missing payload data parameters" });
    }

    const userEmail = email || "shared_anonymous@nexus.crm";

    console.log("[API LOG] Before database call: appwriteService.saveShare()");
    await appwriteService.saveShare(slug, userEmail, serialized);
    console.log("[API LOG] After database call: saveShare() success");

    console.log("[API LOG] Before returning the response");
    return res.status(200).json({ success: true, slug });
  } catch (error) {
    console.error("[API ERROR] Save share failed:", error);
    next(error);
  }
};

router.post("/share/:slug", saveShareHandler);
router.put("/share/:slug", saveShareHandler);

/**
 * GET /api/share/:slug
 * Retrieves public shared profile content.
 */
router.get("/share/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    console.log(`[API LOG] Route entered: GET /api/share/${slug}`);
    console.log("[API LOG] Parameters:", req.params, "Query:", req.query);

    if (!slug) {
      return res.status(400).json({ error: "Slug parameter is required" });
    }

    console.log("[API LOG] Before database call: appwriteService.getShareBySlug()");
    const share = await appwriteService.getShareBySlug(slug);
    console.log("[API LOG] After database call: getShareBySlug() completed");

    if (!share) {
      console.warn(`[Share API] Requested portfolio slug was not found: ${slug}`);
      return res.status(404).json({ error: "Portfolio not found" });
    }

    console.log("[API LOG] Before returning the response");
    return res.status(200).json({
      success: true,
      slug: share.slug,
      serialized: share.profile_json
    });
  } catch (error) {
    console.error(`[API ERROR] GET /api/share/:slug failed:`, error);
    next(error);
  }
});

/**
 * DELETE /api/share/:slug
 * Removes a public shared portfolio slug.
 */
router.delete("/share/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    console.log(`[API LOG] Route entered: DELETE /api/share/${slug}`);
    console.log("[API LOG] Parameters:", req.params, "Query:", req.query);

    if (!slug) {
      return res.status(400).json({ error: "Slug parameter is required" });
    }

    console.log("[API LOG] Before database call: appwriteService.deleteShare()");
    await appwriteService.deleteShare(slug);
    console.log("[API LOG] After database call: deleteShare() success");

    console.log("[API LOG] Before returning the response");
    return res.status(200).json({ success: true, message: "Share deleted successfully" });
  } catch (error) {
    console.error(`[API ERROR] DELETE /api/share/:slug failed:`, error);
    next(error);
  }
});

export default router;
