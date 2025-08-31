import { pool } from "../db/db.js";
import { generateBookingNumber } from "../utils/generateBookingNumber.js";
import createNotification from "../utils/createNotification.js";

export const createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      helper_id,
      subcategory_id,
      booking_date,
      start_time,
      end_time,
      duration_minutes,
      service_address,
      latitude,
      longitude,
      special_instructions,
    } = req.body || {};

    if (
      !helper_id ||
      !subcategory_id ||
      !booking_date ||
      !start_time ||
      !service_address ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "helper_id, subcategory_id, booking_date, start_time, service_address, latitude and longitude are required",
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid latitude or longitude",
      });
    }

    const helperCheckQuery = `
      SELECT 
        u.id AS helper_id,
        u.full_name,
        hs.id AS helper_skill_id,
        hs.hourly_rate,
        hs.fixed_rate,
        hs.available,
        hs.verification_status,
        ssc.id AS subcategory_id,
        ssc.name AS subcategory_name,
        ssc.category_id,
        ssc.price_model
      FROM users u
      JOIN helper_profiles hp ON hp.user_id = u.id
      JOIN helper_skills hs ON hs.helper_id = u.id
      JOIN service_subcategories ssc ON ssc.id = hs.subcategory_id
      WHERE u.id = $1
        AND hs.subcategory_id = $2
        AND u.role = 'HELPER'
        AND u.is_active = true
        AND hp.is_verified = true
        AND hp.verification_status = 'APPROVED'
        AND hs.available = true
        AND hs.verification_status = 'APPROVED'
      LIMIT 1
    `;

    const helperResult = await pool.query(helperCheckQuery, [
      helper_id,
      subcategory_id,
    ]);

    if (helperResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Selected helper is not available for this service",
      });
    }

    const helper = helperResult.rows[0];

    const bookingNumber = await generateBookingNumber(pool);

    let estimatedAmount = 0;
    let pricingType = "HOURLY";

    if (helper.price_model === "FIXED") {
      pricingType = "FIXED";
      estimatedAmount = Number(helper.fixed_rate || 0);
    } else {
      pricingType = "HOURLY";
      const hours = duration_minutes ? duration_minutes / 60 : 1;
      estimatedAmount = Number(helper.hourly_rate || 0) * hours;
    }

    const insertQuery = `
      INSERT INTO bookings (
        booking_number,
        user_id,
        helper_id,
        category_id,
        subcategory_id,
        helper_skill_id,
        service_name,
        booking_date,
        start_time,
        end_time,
        duration_minutes,
        service_address,
        latitude,
        longitude,
        special_instructions,
        pricing_type,
        hourly_rate,
        fixed_rate,
        estimated_amount,
        status
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'PENDING'
      )
      RETURNING *
    `;

    const values = [
      bookingNumber,
      userId,
      helper_id,
      helper.category_id,
      subcategory_id,
      helper.helper_skill_id,
      helper.subcategory_name,
      booking_date,
      start_time,
      end_time || null,
      duration_minutes || null,
      service_address,
      lat,
      lng,
      special_instructions || null,
      pricingType,
      helper.hourly_rate || 0,
      helper.fixed_rate || 0,
      estimatedAmount,
    ];

    const result = await pool.query(insertQuery, values);
    const newBooking = result.rows[0];

    await createNotification({
      user_id: helper_id,
      title: "New Booking Request",
      message: `You received a new booking request for ${newBooking.service_name} on ${newBooking.booking_date}.`,
      type: "NEW_BOOKING_REQUEST",
      ref_table: "bookings",
      ref_id: newBooking.id,
    });

    await createNotification({
      user_id: userId,
      title: "Booking Confirmed",
      message: `Your booking for ${newBooking.service_name} has been created successfully and is waiting for helper acceptance.`,
      type: "BOOKING_CREATED",
      ref_table: "bookings",
      ref_id: newBooking.id,
    });

    return res.status(201).json({
      ok: true,
      message: "Booking created successfully",
      booking: newBooking,
    });
  } catch (error) {
    console.error("createBooking error:", error);
    console.error("message:", error.message);
    console.error("detail:", error.detail);
    console.error("code:", error.code);

    return res.status(500).json({
      ok: false,
      message: "Server error while creating booking",
      detail: error.detail || null,
      code: error.code || null,
    });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        b.*,
        u.full_name AS helper_name,
        u.profile_photo_url AS helper_photo
      FROM bookings b
      JOIN users u ON u.id = b.helper_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    return res.json({
      ok: true,
      bookings: result.rows,
    });
  } catch (error) {
    console.error("getUserBookings error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while fetching user bookings",
    });
  }
};

export const getHelperBookings = async (req, res) => {
  try {
    const helperId = req.user.id;

    const query = `
      SELECT 
        b.*,
        u.full_name AS user_name,
        u.profile_photo_url AS user_photo,
        u.phone_number AS user_phone
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      WHERE b.helper_id = $1
      ORDER BY b.created_at DESC
    `;

    const result = await pool.query(query, [helperId]);

    return res.json({
      ok: true,
      bookings: result.rows,
    });
  } catch (error) {
    console.error("getHelperBookings error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while fetching helper bookings",
    });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;

    const query = `
      SELECT 
        b.*,
        u1.full_name AS user_name,
        u1.phone_number AS user_phone,
        u2.full_name AS helper_name,
        u2.phone_number AS helper_phone,
        u2.profile_photo_url AS helper_photo
      FROM bookings b
      JOIN users u1 ON u1.id = b.user_id
      JOIN users u2 ON u2.id = b.helper_id
      WHERE b.id = $1
        AND (b.user_id = $2 OR b.helper_id = $2)
      LIMIT 1
    `;

    const result = await pool.query(query, [bookingId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Booking not found",
      });
    }

    return res.json({
      ok: true,
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("getBookingById error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while fetching booking",
    });
  }
};

export const acceptBooking = async (req, res) => {
  try {
    const helperId = req.user.id;
    const bookingId = req.params.id;

    const query = `
      UPDATE bookings
      SET status = 'ACCEPTED',
          accepted_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND helper_id = $2
        AND status = 'PENDING'
      RETURNING *
    `;

    const result = await pool.query(query, [bookingId, helperId]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Booking cannot be accepted",
      });
    }

    const booking = result.rows[0];

    await createNotification({
      user_id: booking.user_id,
      title: "Helper Accepted",
      message: `Your booking for ${booking.service_name} has been accepted by the helper.`,
      type: "BOOKING_ACCEPTED",
      ref_table: "bookings",
      ref_id: booking.id,
    });

    return res.json({
      ok: true,
      message: "Booking accepted successfully",
      booking,
    });
  } catch (error) {
    console.error("acceptBooking error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while accepting booking",
    });
  }
};

export const rejectBooking = async (req, res) => {
  try {
    const helperId = req.user.id;
    const bookingId = req.params.id;
    const { rejection_reason } = req.body;

    const query = `
      UPDATE bookings
      SET status = 'REJECTED',
          rejected_by = $2,
          rejection_reason = $3,
          rejected_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND helper_id = $2
        AND status = 'PENDING'
      RETURNING *
    `;

    const result = await pool.query(query, [
      bookingId,
      helperId,
      rejection_reason || null,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Booking cannot be rejected",
      });
    }

    const booking = result.rows[0];

    await createNotification({
      user_id: booking.user_id,
      title: "Booking Rejected",
      message: `Your booking for ${booking.service_name} was rejected by the helper.`,
      type: "BOOKING_REJECTED",
      ref_table: "bookings",
      ref_id: booking.id,
    });

    return res.json({
      ok: true,
      message: "Booking rejected successfully",
      booking,
    });
  } catch (error) {
    console.error("rejectBooking error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while rejecting booking",
    });
  }
};

export const markOnTheWay = async (req, res) => {
  try {
    const helperId = req.user.id;
    const bookingId = req.params.id;

    const query = `
      UPDATE bookings
      SET status = 'ON_THE_WAY',
          on_the_way_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND helper_id = $2
        AND status = 'ACCEPTED'
      RETURNING *
    `;

    const result = await pool.query(query, [bookingId, helperId]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Booking cannot be marked on the way",
      });
    }

    const booking = result.rows[0];

    await createNotification({
      user_id: booking.user_id,
      title: "Helper is Coming",
      message: `Your helper is on the way for ${booking.service_name}.`,
      type: "BOOKING_ON_THE_WAY",
      ref_table: "bookings",
      ref_id: booking.id,
    });

    return res.json({
      ok: true,
      message: "Helper is on the way",
      booking,
    });
  } catch (error) {
    console.error("markOnTheWay error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while updating booking",
    });
  }
};

export const startBooking = async (req, res) => {
  try {
    const helperId = req.user.id;
    const bookingId = req.params.id;

    const query = `
      UPDATE bookings
      SET status = 'IN_PROGRESS',
          started_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND helper_id = $2
        AND status IN ('ACCEPTED', 'ON_THE_WAY')
      RETURNING *
    `;

    const result = await pool.query(query, [bookingId, helperId]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Booking cannot be started",
      });
    }

    const booking = result.rows[0];

    await createNotification({
      user_id: booking.user_id,
      title: "Service Started",
      message: `Your ${booking.service_name} service has started.`,
      type: "BOOKING_STARTED",
      ref_table: "bookings",
      ref_id: booking.id,
    });

    return res.json({
      ok: true,
      message: "Booking started successfully",
      booking,
    });
  } catch (error) {
    console.error("startBooking error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while starting booking",
    });
  }
};

export const completeBooking = async (req, res) => {
  try {
    const helperId = req.user.id;
    const bookingId = req.params.id;
    const { final_amount } = req.body || {};

    const bookingQuery = `
      SELECT id, helper_id, user_id, status, service_name, estimated_amount, commission_percent
      FROM bookings
      WHERE id = $1
      LIMIT 1
    `;

    const bookingResult = await pool.query(bookingQuery, [bookingId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Booking not found",
      });
    }

    const booking = bookingResult.rows[0];

    if (Number(booking.helper_id) !== Number(helperId)) {
      return res.status(403).json({
        ok: false,
        message: "You are not allowed to complete this booking",
      });
    }

    if (booking.status !== "IN_PROGRESS") {
      return res.status(400).json({
        ok: false,
        message: `Booking must be IN_PROGRESS before completion. Current status: ${booking.status}`,
      });
    }

    const finalAmount = Number(final_amount || booking.estimated_amount || 0);
    const commissionPercent = Number(booking.commission_percent || 10);
    const commissionAmount = (finalAmount * commissionPercent) / 100;
    const helperEarning = finalAmount - commissionAmount;

    const query = `
      UPDATE bookings
      SET status = 'COMPLETED',
          completed_at = CURRENT_TIMESTAMP,
          final_amount = $3,
          commission_amount = $4,
          helper_earning = $5,
          payout_status = 'PENDING'
      WHERE id = $1
        AND helper_id = $2
        AND status = 'IN_PROGRESS'
      RETURNING *
    `;

    const result = await pool.query(query, [
      bookingId,
      helperId,
      finalAmount,
      commissionAmount,
      helperEarning,
    ]);

    const completedBooking = result.rows[0];

    await createNotification({
      user_id: completedBooking.user_id,
      title: "Service Completed",
      message: `Your ${completedBooking.service_name} has been completed. Please leave a review.`,
      type: "BOOKING_COMPLETED",
      ref_table: "bookings",
      ref_id: completedBooking.id,
    });

    return res.json({
      ok: true,
      message:
        "Booking completed successfully. Payment is held by admin until release.",
      booking: completedBooking,
    });
  } catch (error) {
    console.error("completeBooking error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while completing booking",
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;
    const { cancellation_reason } = req.body;

    const query = `
      UPDATE bookings
      SET status = 'CANCELLED',
          cancelled_by = $2,
          cancellation_reason = $3,
          cancelled_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND (user_id = $2 OR helper_id = $2)
        AND status IN ('PENDING', 'ACCEPTED')
      RETURNING *
    `;

    const result = await pool.query(query, [
      bookingId,
      userId,
      cancellation_reason || null,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Booking cannot be cancelled",
      });
    }

    const booking = result.rows[0];

    const notifyUserId =
      Number(userId) === Number(booking.user_id)
        ? booking.helper_id
        : booking.user_id;

    await createNotification({
      user_id: notifyUserId,
      title: "Booking Cancelled",
      message: `Your booking for ${booking.service_name} has been cancelled.`,
      type: "BOOKING_CANCELLED",
      ref_table: "bookings",
      ref_id: booking.id,
    });

    return res.json({
      ok: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("cancelBooking error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while cancelling booking",
    });
  }
};

export const rescheduleBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;
    const { booking_date, start_time, end_time } = req.body;

    if (!booking_date || !start_time) {
      return res.status(400).json({
        ok: false,
        message: "booking_date and start_time are required",
      });
    }

    const query = `
      UPDATE bookings
      SET status = 'RESCHEDULED',
          rescheduled_from_date = booking_date,
          rescheduled_from_time = start_time,
          booking_date = $3,
          start_time = $4,
          end_time = $5
      WHERE id = $1
        AND user_id = $2
        AND status IN ('PENDING', 'ACCEPTED')
      RETURNING *
    `;

    const result = await pool.query(query, [
      bookingId,
      userId,
      booking_date,
      start_time,
      end_time || null,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Booking cannot be rescheduled",
      });
    }

    const booking = result.rows[0];

    await createNotification({
      user_id: booking.helper_id,
      title: "Booking Rescheduled",
      message: `A booking for ${booking.service_name} has been rescheduled to ${booking.booking_date} at ${booking.start_time}.`,
      type: "BOOKING_RESCHEDULED",
      ref_table: "bookings",
      ref_id: booking.id,
    });

    return res.json({
      ok: true,
      message: "Booking rescheduled successfully",
      booking,
    });
  } catch (error) {
    console.error("rescheduleBooking error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while rescheduling booking",
    });
  }
};

export const updateHelperLiveLocation = async (req, res) => {
  try {
    const helperId = req.user.id;
    const bookingId = req.params.id;
    const { latitude, longitude } = req.body || {};

    const lat = Number(latitude);
    const lng = Number(longitude);

    console.log("updateHelperLiveLocation called");
    console.log("helperId:", helperId);
    console.log("bookingId:", bookingId);
    console.log("body:", req.body);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid latitude or longitude",
      });
    }

    const bookingCheck = await pool.query(
      `
      SELECT id, helper_id, status
      FROM bookings
      WHERE id = $1
      LIMIT 1
      `,
      [bookingId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Booking not found",
      });
    }

    const booking = bookingCheck.rows[0];

    if (Number(booking.helper_id) !== Number(helperId)) {
      return res.status(403).json({
        ok: false,
        message: "You are not allowed to update this booking location",
      });
    }

    if (!["ACCEPTED", "ON_THE_WAY", "IN_PROGRESS"].includes(booking.status)) {
      return res.status(400).json({
        ok: false,
        message: "Live location can only be updated for active bookings",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO helper_live_locations (helper_id, booking_id, latitude, longitude, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (booking_id)
      DO UPDATE SET
        helper_id = EXCLUDED.helper_id,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
      `,
      [helperId, bookingId, lat, lng]
    );

    return res.json({
      ok: true,
      message: "Live location updated successfully",
      live_location: result.rows[0],
    });
  } catch (error) {
    console.error("updateHelperLiveLocation error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while updating live location",
    });
  }
};

export const getHelperLiveLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;

    const bookingCheck = await pool.query(
      `
      SELECT id, user_id, helper_id
      FROM bookings
      WHERE id = $1
      LIMIT 1
      `,
      [bookingId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Booking not found",
      });
    }

    const booking = bookingCheck.rows[0];

    if (
      Number(booking.user_id) !== Number(userId) &&
      Number(booking.helper_id) !== Number(userId)
    ) {
      return res.status(403).json({
        ok: false,
        message: "You are not allowed to view this live location",
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM helper_live_locations
      WHERE booking_id = $1
      LIMIT 1
      `,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Live location not found yet",
      });
    }

    return res.json({
      ok: true,
      live_location: result.rows[0],
    });
  } catch (error) {
    console.error("getHelperLiveLocation error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while fetching live location",
    });
  }
};

export const payBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;
    const { payment_method } = req.body || {};

    if (!payment_method || !["COD", "ONLINE"].includes(payment_method)) {
      return res.status(400).json({
        ok: false,
        message: "payment_method must be COD or ONLINE",
      });
    }

    const bookingCheck = await pool.query(
      `
      SELECT id, user_id, helper_id, status, payment_status
      FROM bookings
      WHERE id = $1
      LIMIT 1
      `,
      [bookingId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Booking not found",
      });
    }

    const booking = bookingCheck.rows[0];

    if (Number(booking.user_id) !== Number(userId)) {
      return res.status(403).json({
        ok: false,
        message: "Only the booking user can make payment",
      });
    }

    if (booking.payment_status === "PAID") {
      return res.status(400).json({
        ok: false,
        message: "Booking is already paid",
      });
    }

    let paymentStatus = "PENDING";
    let transactionId = null;
    let paidAt = null;

    if (payment_method === "ONLINE") {
      paymentStatus = "PAID";
      transactionId = `TXN-${Date.now()}`;
      paidAt = new Date();
    }

    const result = await pool.query(
      `
      UPDATE bookings
      SET payment_method = $1,
          payment_status = $2,
          transaction_id = $3,
          paid_at = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
      `,
      [payment_method, paymentStatus, transactionId, paidAt, bookingId]
    );

    const updatedBooking = result.rows[0];

    await createNotification({
      user_id: updatedBooking.helper_id,
      title: "Booking Payment Updated",
      message:
        payment_method === "ONLINE"
          ? `Payment has been completed for booking ${updatedBooking.booking_number}.`
          : `Cash on Delivery was selected for booking ${updatedBooking.booking_number}.`,
      type: "BOOKING_PAYMENT_UPDATED",
      ref_table: "bookings",
      ref_id: updatedBooking.id,
    });

    return res.json({
      ok: true,
      message:
        payment_method === "ONLINE"
          ? "Payment completed successfully"
          : "Cash on Delivery selected successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("payBooking error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while updating payment",
    });
  }
};