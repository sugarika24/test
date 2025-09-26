import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  sendRegisterEmailOtp,
  verifyRegisterEmailOtp,
} from "../controllers/auth.Controller.js";
import { requireAuth } from "../middleware/auth.Middleware.js";
import { upload } from "../middleware/upload.Middleware.js";

const router = express.Router();

// router.post("/send-register-otp", sendRegisterOtp);
// router.post("/verify-register-otp", verifyRegisterOtp);

router.post("/send-register-email-otp", sendRegisterEmailOtp);
router.post("/verify-register-email-otp", verifyRegisterEmailOtp);



router.post("/register", upload.single("id_document"), register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", requireAuth, changePassword);
router.post("/logout", requireAuth, logout);

export default router;