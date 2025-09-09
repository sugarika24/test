import express from "express";
import { requireAuth } from "../middleware/auth.Middleware.js";
import {
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getChatList
} from "../controllers/chat.Controller.js";

const router = express.Router();

router.get("/:bookingId/messages", requireAuth, getMessages);
router.post("/:bookingId/messages", requireAuth, sendMessage);
router.put("/:bookingId/read", requireAuth, markMessagesAsRead);
router.get("/list", requireAuth, getChatList);

export default router;