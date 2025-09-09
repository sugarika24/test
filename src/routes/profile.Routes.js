import express from "express";
import { requireAuth } from "../middleware/auth.Middleware.js";
import { upload } from "../middleware/upload.Middleware.js";
import {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  deactivateMyAccount,
  deleteMyAccount,
  getMyHelperProfile,
  updateMyHelperProfile,
} from "../controllers/profile.Controller.js";

const router = express.Router();

// User profile
router.get("/", requireAuth, getMyProfile);
router.put("/", requireAuth, updateMyProfile);
router.put("/photo", requireAuth, upload.single("profile_photo"), uploadProfilePhoto);
router.put("/deactivate", requireAuth, deactivateMyAccount);
router.delete("/", requireAuth, deleteMyAccount);

// Helper profile
router.get("/helper", requireAuth, getMyHelperProfile);
router.put("/helper", requireAuth, updateMyHelperProfile);

export default router;