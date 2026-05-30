import express from "express";
import { requireAuth } from "../middleware/auth.Middleware.js";
import { requireAdmin } from "../middleware/admin.Middleware.js";

import {
  createEmergencyAlert,
  getMyEmergencyAlerts,
  getAdminEmergencyAlerts,
  getAdminEmergencyAlertById,
  updateEmergencyStatus,
} from "../controllers/emergency.Controller.js";

const router = express.Router();

router.post("/", requireAuth, createEmergencyAlert);
router.get("/my-alerts", requireAuth, getMyEmergencyAlerts);

router.get("/admin", requireAuth, requireAdmin, getAdminEmergencyAlerts);
router.get("/admin/:id", requireAuth, requireAdmin, getAdminEmergencyAlertById);
router.put("/admin/:id/status", requireAuth, requireAdmin, updateEmergencyStatus);

export default router;