import express from "express";
import {
  initiateEsewaPayment,
  esewaCheckoutPage,
  esewaSuccess,
  esewaFailure,
  getPaymentStatus,
  requestRefund,
  getAdminRefundRequests,
  updateRefundStatus,
} from "../controllers/payment.Controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.Middleware.js";

const router = express.Router();

router.post("/esewa/initiate", requireAuth, initiateEsewaPayment);
router.get("/esewa/checkout/:bookingId", esewaCheckoutPage);
router.get("/esewa/success", esewaSuccess);
router.get("/esewa/failure", esewaFailure);

router.get("/status/:bookingId", requireAuth, getPaymentStatus);

router.post("/refund/request/:bookingId", requireAuth, requestRefund);
router.get("/refund/admin/requests", requireAuth, requireAdmin, getAdminRefundRequests);
router.put("/refund/admin/:bookingId", requireAuth, requireAdmin, updateRefundStatus);

export default router;