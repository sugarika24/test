import express from "express";
import { requireAuth } from "../middleware/auth.Middleware.js";
import {
  createBooking,
  getUserBookings,
  getHelperBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  markOnTheWay,
  startBooking,
  completeBooking,
  cancelBooking,
  rescheduleBooking,
  updateHelperLiveLocation,
  getHelperLiveLocation,
  payBooking,
} from "../controllers/booking.Controller.js";

const router = express.Router();

router.post("/", requireAuth, createBooking);

router.get("/user", requireAuth, getUserBookings);
router.get("/helper", requireAuth, getHelperBookings);
router.get("/:id", requireAuth, getBookingById);

router.put("/:id/pay", requireAuth, payBooking);

router.put("/:id/accept", requireAuth, acceptBooking);
router.put("/:id/reject", requireAuth, rejectBooking);
router.put("/:id/on-the-way", requireAuth, markOnTheWay);
router.put("/:id/start", requireAuth, startBooking);
router.put("/:id/complete", requireAuth, completeBooking);
router.put("/:id/cancel", requireAuth, cancelBooking);
router.put("/:id/reschedule", requireAuth, rescheduleBooking);
router.post("/:id/live-location", requireAuth, updateHelperLiveLocation);
router.get("/:id/live-location", requireAuth, getHelperLiveLocation);

export default router;