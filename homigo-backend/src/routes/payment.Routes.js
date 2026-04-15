import express from "express";
import { requireAuth } from "../middleware/auth.Middleware.js";
import {
  initiateEsewaPayment,
  verifyEsewaPayment,
  esewaSuccess,
  esewaFailure,
  getPaymentStatus,
} from "../controllers/payment.Controller.js";

const router = express.Router();

router.post("/esewa/initiate", requireAuth, initiateEsewaPayment);
router.post("/esewa/verify", requireAuth, verifyEsewaPayment);
router.get("/esewa/success", esewaSuccess);
router.get("/esewa/failure", esewaFailure);
router.get("/status/:bookingId", requireAuth, getPaymentStatus);

export default router;