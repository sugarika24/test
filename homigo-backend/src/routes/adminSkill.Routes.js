import express from "express";
import { requireAuth } from "../middleware/auth.Middleware.js";
import { requireAdmin } from "../middleware/admin.Middleware.js";
import {
  getAllSkills,
  getSkillById,
  createSkill,
  updateSkill,
  toggleSkillStatus,
  deleteSkill,
} from "../controllers/adminSkill.Controller.js";

const router = express.Router();

router.get("/skills", requireAuth, requireAdmin, getAllSkills);
router.get("/skills/:id", requireAuth, requireAdmin, getSkillById);
router.post("/skills", requireAuth, requireAdmin, createSkill);
router.put("/skills/:id", requireAuth, requireAdmin, updateSkill);
router.patch("/skills/:id/toggle-status", requireAuth, requireAdmin, toggleSkillStatus);
router.delete("/skills/:id", requireAuth, requireAdmin, deleteSkill);

export default router;