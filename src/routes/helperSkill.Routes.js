import express from "express";
import { requireAuth } from "../middleware/auth.Middleware.js";

import {
  addHelperSkill,
  getMyHelperSkills,
  updateHelperSkill,
  deleteHelperSkill,
} from "../controllers/helperSkill.Controller.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", addHelperSkill);
router.get("/", getMyHelperSkills);
router.put("/:id", updateHelperSkill);
router.delete("/:id", deleteHelperSkill);

export default router;