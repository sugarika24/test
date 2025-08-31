import express from "express";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createTestNotification,
} from "../controllers/notification.Controller.js";
import { requireAuth } from "../middleware/auth.Middleware.js";

const router = express.Router();

router.get("/", requireAuth, getMyNotifications);
router.get("/unread-count", requireAuth, getUnreadNotificationCount);
router.put("/read-all", requireAuth, markAllNotificationsAsRead);
router.put("/:id/read", requireAuth, markNotificationAsRead);
router.delete("/:id", requireAuth, deleteNotification);
router.post("/test", requireAuth, createTestNotification);

export default router;