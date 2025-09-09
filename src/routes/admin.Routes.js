import express from "express";
import { requireAuth } from "../middleware/auth.Middleware.js";
import { requireAdmin } from "../middleware/admin.Middleware.js";
import {
  getPendingHelpers,
  getAllHelpersForAdmin,
  approveHelper,
  rejectHelper,
  suspendHelper,
  releaseHelperPayment,
  getCompletedBookingsForAdmin,
  getAllUsersForAdmin
} from "../controllers/admin.Controller.js";

const router = express.Router();

router.get("/helpers/pending", requireAuth, requireAdmin, getPendingHelpers);
router.get("/helpers", requireAuth, requireAdmin, getAllHelpersForAdmin);
router.put("/helpers/:helperUserId/approve", requireAuth, requireAdmin, approveHelper);
router.put("/helpers/:helperUserId/reject", requireAuth, requireAdmin, rejectHelper);
router.put("/helpers/:helperUserId/suspend", requireAuth, requireAdmin, suspendHelper);
router.put("/bookings/:id/release-payment", requireAuth, requireAdmin, releaseHelperPayment);
router.get("/bookings/completed", requireAuth, requireAdmin, getCompletedBookingsForAdmin);
router.get("/users", requireAuth, requireAdmin, getAllUsersForAdmin);
export default router;