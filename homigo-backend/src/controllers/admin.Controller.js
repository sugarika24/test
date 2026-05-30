import { pool } from "../db/db.js";
import createNotification from "../utils/createNotification.js";

export const getPendingHelpers = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        hp.id,
        hp.user_id,
        hp.bio,
        hp.hourly_rate,
        hp.category_id,
        hp.is_available,
        hp.experience_years,
        hp.verification_status,
        hp.is_verified,
        hp.created_at,
        u.full_name,
        u.email,
        u.phone_number,
        u.profile_photo_url,
        u.address,
        u.is_active,
        hvd.document_type,
        hvd.document_number,
        hvd.document_url
      FROM helper_profiles hp
      JOIN users u ON u.id = hp.user_id
      LEFT JOIN helper_verification_documents hvd
        ON hvd.helper_user_id = u.id
      WHERE u.role = 'HELPER'
        AND hp.verification_status = 'PENDING'
      ORDER BY hp.created_at DESC
      `
    );

    return res.status(200).json({
      ok: true,
      helpers: result.rows,
    });
  } catch (error) {
    console.error("getPendingHelpers error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch pending helpers",
    });
  }
};

export const getAllHelpersForAdmin = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        hp.id,
        hp.user_id,
        hp.bio,
        hp.hourly_rate,
        hp.category_id,
        hp.is_available,
        hp.experience_years,
        hp.avg_rating,
        hp.rating_count,
        hp.completed_jobs_count,
        hp.verification_status,
        hp.is_verified,
        hp.verified_by,
        hp.verified_at,
        hp.rejection_reason,
        u.full_name,
        u.email,
        u.phone_number,
        u.profile_photo_url,
        u.address,
        u.is_active,
        hvd.document_type,
        hvd.document_number,
        hvd.document_url
      FROM helper_profiles hp
      JOIN users u ON u.id = hp.user_id
      LEFT JOIN helper_verification_documents hvd 
        ON hvd.helper_user_id = u.id
      WHERE u.role = 'HELPER'
      ORDER BY hp.created_at DESC
      `
    );

    return res.status(200).json({
      ok: true,
      helpers: result.rows,
    });
  } catch (error) {
    console.error("getAllHelpersForAdmin error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch helpers",
    });
  }
};

export const approveHelper = async (req, res) => {
  try {
    const { helperUserId } = req.params;
    const adminId = req.user.id;

    const helperCheck = await pool.query(
      `
      SELECT hp.*, u.role, u.is_active
      FROM helper_profiles hp
      JOIN users u ON u.id = hp.user_id
      WHERE hp.user_id = $1
      `,
      [helperUserId]
    );

    if (helperCheck.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Helper not found",
      });
    }

    const helper = helperCheck.rows[0];

    if (helper.role !== "HELPER") {
      return res.status(400).json({
        ok: false,
        message: "Selected user is not a helper",
      });
    }

    await pool.query("BEGIN");

    const result = await pool.query(
      `
      UPDATE helper_profiles
      SET
        verification_status = 'APPROVED',
        is_verified = true,
        is_available = true,
        verified_by = $1,
        verified_at = NOW(),
        rejection_reason = NULL
      WHERE user_id = $2
      RETURNING *
      `,
      [adminId, helperUserId]
    );

    await pool.query(
      `
      UPDATE helper_skills
      SET
        verification_status = 'APPROVED',
        available = true
      WHERE helper_id = $1
      `,
      [helperUserId]
    );

    await createNotification({
      user_id: helperUserId,
      title: "Account Approved",
      message:
        "Your helper account has been approved. You can now accept bookings.",
      type: "HELPER_APPROVED",
      ref_table: "users",
      ref_id: Number(helperUserId),
    });

    await pool.query("COMMIT");

    return res.status(200).json({
      ok: true,
      message: "Helper approved successfully",
      helper_profile: result.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("approveHelper error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to approve helper",
    });
  }
};

export const rejectHelper = async (req, res) => {
  try {
    const { helperUserId } = req.params;
    const { rejection_reason } = req.body;
    const adminId = req.user.id;

    const helperCheck = await pool.query(
      `
      SELECT hp.*, u.role
      FROM helper_profiles hp
      JOIN users u ON u.id = hp.user_id
      WHERE hp.user_id = $1
      `,
      [helperUserId]
    );

    if (helperCheck.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Helper not found",
      });
    }

    const helper = helperCheck.rows[0];

    if (helper.role !== "HELPER") {
      return res.status(400).json({
        ok: false,
        message: "Selected user is not a helper",
      });
    }

    await pool.query("BEGIN");

    const result = await pool.query(
      `
      UPDATE helper_profiles
      SET
        verification_status = 'REJECTED',
        is_verified = false,
        is_available = false,
        verified_by = $1,
        verified_at = NOW(),
        rejection_reason = $2
      WHERE user_id = $3
      RETURNING *
      `,
      [adminId, rejection_reason || null, helperUserId]
    );

    await pool.query(
      `
      UPDATE helper_skills
      SET
        verification_status = 'REJECTED',
        available = false
      WHERE helper_id = $1
      `,
      [helperUserId]
    );

    await createNotification({
      user_id: helperUserId,
      title: "Account Update",
      message:
        "Your helper account was rejected. Please review the reason and update your documents.",
      type: "HELPER_REJECTED",
      ref_table: "users",
      ref_id: Number(helperUserId),
    });

    await pool.query("COMMIT");

    return res.status(200).json({
      ok: true,
      message: "Helper rejected successfully",
      helper_profile: result.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("rejectHelper error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to reject helper",
    });
  }
};

export const suspendHelper = async (req, res) => {
  try {
    const { helperUserId } = req.params;
    const adminId = req.user.id;

    const helperCheck = await pool.query(
      `
      SELECT hp.*, u.role
      FROM helper_profiles hp
      JOIN users u ON u.id = hp.user_id
      WHERE hp.user_id = $1
      `,
      [helperUserId]
    );

    if (helperCheck.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Helper not found",
      });
    }

    await pool.query("BEGIN");

    const result = await pool.query(
      `
      UPDATE helper_profiles
      SET
        verification_status = 'SUSPENDED',
        is_verified = false,
        is_available = false,
        verified_by = $1,
        verified_at = NOW()
      WHERE user_id = $2
      RETURNING *
      `,
      [adminId, helperUserId]
    );

    await pool.query(
      `
      UPDATE helper_skills
      SET
        verification_status = 'SUSPENDED',
        available = false
      WHERE helper_id = $1
      `,
      [helperUserId]
    );

    await pool.query("COMMIT");

    return res.status(200).json({
      ok: true,
      message: "Helper suspended successfully",
      helper_profile: result.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("suspendHelper error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to suspend helper",
    });
  }
};

export const releaseHelperPayment = async (req, res) => {
  try {
    const adminId = req.user.id;
    const bookingId = req.params.id;

    const bookingResult = await pool.query(
      `
      SELECT 
        id, 
        helper_id, 
        final_amount, 
        commission_amount, 
        helper_earning, 
        payout_status, 
        status,
        payment_status,
        refund_status
      FROM bookings
      WHERE id = $1
      LIMIT 1
      `,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Booking not found",
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== "COMPLETED") {
      return res.status(400).json({
        ok: false,
        message: "Only completed bookings can be released",
      });
    }

    if (booking.payment_status !== "PAID") {
      return res.status(400).json({
        ok: false,
        message: "Only paid bookings can be released",
      });
    }

    const refundStatus = String(
      booking.refund_status || "NO_REFUND"
    ).toUpperCase();

    if (
      refundStatus === "REFUND_REQUESTED" ||
      refundStatus === "REFUND_APPROVED" ||
      refundStatus === "REFUNDED"
    ) {
      return res.status(400).json({
        ok: false,
        message: "Cannot release payment for refunded or refund pending booking",
      });
    }

    if (booking.payout_status === "RELEASED") {
      return res.status(400).json({
        ok: false,
        message: "Payment already released",
      });
    }

    await pool.query("BEGIN");

    await pool.query(
      `
      INSERT INTO wallet_transactions (
        booking_id,
        helper_id,
        gross_amount,
        commission_amount,
        net_amount,
        status,
        released_by,
        released_at
      )
      VALUES ($1,$2,$3,$4,$5,'RELEASED',$6,CURRENT_TIMESTAMP)
      `,
      [
        booking.id,
        booking.helper_id,
        booking.final_amount,
        booking.commission_amount,
        booking.helper_earning,
        adminId,
      ]
    );

    const updateResult = await pool.query(
      `
      UPDATE bookings
      SET payout_status = 'RELEASED'
      WHERE id = $1
      RETURNING *
      `,
      [bookingId]
    );

    await createNotification({
      user_id: booking.helper_id,
      title: "Payment Released",
      message: `Your payment of Rs. ${booking.helper_earning} has been released.`,
      type: "PAYMENT_RELEASED",
      ref_table: "bookings",
      ref_id: booking.id,
    });

    await pool.query("COMMIT");

    return res.json({
      ok: true,
      message: "Helper payment released successfully",
      booking: updateResult.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("releaseHelperPayment error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while releasing payment",
    });
  }
};

export const getCompletedBookingsForAdmin = async (req, res) => {
  try {
    const { payout_status } = req.query;

    let query = `
      SELECT
        b.id,
        b.booking_number,
        b.user_id,
        b.helper_id,
        b.category_id,
        b.subcategory_id,
        b.service_name,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.duration_minutes,
        b.service_address,
        b.pricing_type,
        b.hourly_rate,
        b.fixed_rate,
        b.estimated_amount,
        b.final_amount,
        b.status,
        b.payment_status,
        b.commission_percent,
        b.commission_amount,
        b.helper_earning,
        b.payout_status,
        b.completed_at,
        b.created_at,
        b.updated_at,
        b.refund_status,
        b.refund_reason,
        b.refund_requested_at,
        b.refund_decision_at,

        u1.full_name AS user_name,
        u1.email AS user_email,
        u1.phone_number AS user_phone,

        u2.full_name AS helper_name,
        u2.email AS helper_email,
        u2.phone_number AS helper_phone,

        hp.id AS helper_profile_id,
        hp.bio AS helper_bio,
        hp.hourly_rate AS helper_profile_hourly_rate,
        hp.is_available,
        hp.experience_years,
        hp.verification_status,
        hp.is_verified,

        c.name AS category_name,
        sc.name AS subcategory_name

      FROM bookings b
      LEFT JOIN users u1 ON u1.id = b.user_id
      LEFT JOIN users u2 ON u2.id = b.helper_id
      LEFT JOIN helper_profiles hp ON hp.user_id = b.helper_id
      LEFT JOIN service_categories c ON c.id = b.category_id
      LEFT JOIN service_subcategories sc ON sc.id = b.subcategory_id

      WHERE b.status = 'COMPLETED'
      AND COALESCE(b.refund_status, 'NO_REFUND') NOT IN (
        'REFUND_REQUESTED',
        'REFUND_APPROVED',
        'REFUNDED'
      )
    `;

    const values = [];

    if (payout_status) {
      values.push(payout_status);
      query += ` AND b.payout_status = $${values.length}`;
    }

    query += ` ORDER BY b.completed_at DESC NULLS LAST, b.created_at DESC`;

    const result = await pool.query(query, values);

    return res.status(200).json({
      ok: true,
      count: result.rows.length,
      bookings: result.rows,
    });
  } catch (error) {
    console.error("getCompletedBookingsForAdmin error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch completed bookings",
      error: error.message,
    });
  }
};

export const getAllUsersForAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        full_name,
        email,
        phone_number,
        role,
        profile_photo_url,
        address,
        is_active,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    return res.status(200).json({
      ok: true,
      users: result.rows,
    });
  } catch (error) {
    console.error("getAllUsersForAdmin error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};