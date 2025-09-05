import { pool } from "../db/db.js";
import createNotification from "../utils/createNotification.js";

async function updateHelperRatingSummary(helperUserId) {
  const summaryResult = await pool.query(
    `
    SELECT
      COUNT(*)::int AS rating_count,
      COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS avg_rating
    FROM reviews
    WHERE helper_user_id = $1
    `,
    [helperUserId]
  );

  const { rating_count, avg_rating } = summaryResult.rows[0];

  await pool.query(
    `
    UPDATE helper_profiles
    SET
      avg_rating = $1,
      rating_count = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $3
    `,
    [avg_rating, rating_count, helperUserId]
  );
}

export const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { booking_id, rating, comment } = req.body;

    if (!booking_id || !rating) {
      return res.status(400).json({
        ok: false,
        message: "booking_id and rating are required",
      });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        ok: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const bookingResult = await pool.query(
      `
      SELECT id, user_id, helper_id, status
      FROM bookings
      WHERE id = $1
      LIMIT 1
      `,
      [booking_id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Booking not found",
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.user_id !== userId) {
      return res.status(403).json({
        ok: false,
        message: "You can only review your own booking",
      });
    }

    if (booking.status !== "COMPLETED") {
      return res.status(400).json({
        ok: false,
        message: "Only completed bookings can be reviewed",
      });
    }

    const existingReview = await pool.query(
      `
      SELECT id
      FROM reviews
      WHERE booking_id = $1
      LIMIT 1
      `,
      [booking_id]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({
        ok: false,
        message: "Review already submitted for this booking",
      });
    }

    const insertResult = await pool.query(
      `
      INSERT INTO reviews (
        booking_id,
        user_id,
        helper_user_id,
        rating,
        comment
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        booking_id,
        userId,
        booking.helper_id,
        rating,
        comment || null,
      ]
    );

    await updateHelperRatingSummary(booking.helper_id);

    const newReview = insertResult.rows[0];

    await createNotification({
      user_id: booking.helper_id,
      title: "New Review Received",
      message: `You received a ${rating}⭐ review from a customer.`,
      type: "NEW_REVIEW",
      ref_table: "reviews",
      ref_id: newReview.id,
    });

    return res.status(201).json({
      ok: true,
      message: "Review submitted successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("createReview error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to submit review",
      error: error.message,
    });
  }
};

export const getHelperReviews = async (req, res) => {
  try {
    const helperUserId = Number(req.params.helperUserId);

    if (!helperUserId || Number.isNaN(helperUserId)) {
      return res.status(400).json({
        ok: false,
        message: "Valid helper user id is required",
      });
    }

    const query = `
      SELECT
        r.id,
        r.booking_id,
        r.user_id,
        r.helper_user_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        u.full_name AS user_name,
        u.profile_photo_url AS user_profile_photo_url
      FROM reviews r
      JOIN users u
        ON u.id = r.user_id
      WHERE r.helper_user_id = $1
      ORDER BY r.created_at DESC
    `;

    const result = await pool.query(query, [helperUserId]);

    return res.json({
      ok: true,
      reviews: result.rows,
    });
  } catch (error) {
    console.error("getHelperReviews error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while fetching helper reviews",
      error: error.message,
    });
  }
};

export const getReviewByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        booking_id,
        user_id,
        helper_user_id,
        rating,
        comment,
        created_at,
        updated_at
      FROM reviews
      WHERE booking_id = $1 AND user_id = $2
      LIMIT 1
      `,
      [bookingId, userId]
    );

    return res.status(200).json({
      ok: true,
      review: result.rows[0] || null,
    });
  } catch (error) {
    console.error("getReviewByBooking error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch review",
      error: error.message,
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({
        ok: false,
        message: "Rating is required",
      });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        ok: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const reviewResult = await pool.query(
      `
      SELECT id, user_id, helper_user_id, created_at
      FROM reviews
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Review not found",
      });
    }

    const review = reviewResult.rows[0];

    if (review.user_id !== userId) {
      return res.status(403).json({
        ok: false,
        message: "You can only edit your own review",
      });
    }

    const createdAt = new Date(review.created_at).getTime();
    const now = Date.now();
    const hours24 = 24 * 60 * 60 * 1000;

    if (now - createdAt > hours24) {
      return res.status(400).json({
        ok: false,
        message: "Review can only be edited within 24 hours",
      });
    }

    const updateResult = await pool.query(
      `
      UPDATE reviews
      SET
        rating = $1,
        comment = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
      `,
      [rating, comment || null, id]
    );

    await updateHelperRatingSummary(review.helper_user_id);

    return res.status(200).json({
      ok: true,
      message: "Review updated successfully",
      review: updateResult.rows[0],
    });
  } catch (error) {
    console.error("updateReview error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};