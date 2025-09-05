import express from "express";
import { requireAuth } from "../middleware/auth.Middleware.js";
import {
  createReview,
  getHelperReviews,
  getReviewByBooking,
  updateReview,
} from "../controllers/review.Controller.js";

const router = express.Router();

router.post("/", requireAuth, createReview);
router.put("/:id", requireAuth, updateReview);
router.get("/helper/:helperUserId", getHelperReviews);
router.get("/booking/:bookingId", requireAuth, getReviewByBooking);

export default router;