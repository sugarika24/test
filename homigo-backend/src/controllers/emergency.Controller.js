import { pool } from "../db/db.js";
import createNotification from "../utils/createNotification.js";

export const createEmergencyAlert = async (req, res) => {
  try {
    const userId = req.user.id;

    const { booking_id, emergency_type, message, latitude, longitude } =
      req.body || {};

    if (!booking_id || !emergency_type) {
      return res.status(400).json({
        ok: false,
        message: "booking_id and emergency_type are required",
      });
    }

    const lat = latitude !== undefined ? Number(latitude) : null;
    const lng = longitude !== undefined ? Number(longitude) : null;

    if (
      latitude !== undefined &&
      longitude !== undefined &&
      (isNaN(lat) || isNaN(lng))
    ) {
      return res.status(400).json({
        ok: false,
        message: "Invalid latitude or longitude",
      });
    }

    const bookingCheck = await pool.query(
      `
      SELECT id, user_id, helper_id, service_name, booking_number, status
      FROM bookings
      WHERE id = $1
        AND (user_id = $2 OR helper_id = $2)
      LIMIT 1
      `,
      [booking_id, userId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Booking not found or you are not allowed to access it",
      });
    }

    const booking = bookingCheck.rows[0];

    if (!["ACCEPTED", "ON_THE_WAY", "IN_PROGRESS"].includes(booking.status)) {
      return res.status(400).json({
        ok: false,
        message: "Emergency alert can only be created for active bookings",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO emergency_alerts (
        booking_id,
        triggered_by,
        emergency_type,
        message,
        latitude,
        longitude,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
      RETURNING *
      `,
      [booking_id, userId, emergency_type, message || null, lat, lng]
    );

    const emergency = result.rows[0];

    const adminResult = await pool.query(
      `
      SELECT id
      FROM users
      WHERE role = 'ADMIN'
        AND is_active = true
      `
    );

    const io = req.app.get("io");

    for (const admin of adminResult.rows) {
      await createNotification({
        user_id: admin.id,
        title: "Emergency Alert",
        message: `Emergency alert triggered for booking ${
          booking.booking_number || booking.id
        }.`,
        type: "EMERGENCY_ALERT",
        ref_table: "emergency_alerts",
        ref_id: emergency.id,
      });

      if (io) {
        io.to(`user_${admin.id}`).emit("notification", {
          type: "EMERGENCY_ALERT",
          title: "Emergency Alert",
          message: `Emergency alert triggered for booking ${
            booking.booking_number || booking.id
          }.`,
          alertId: emergency.id,
          bookingId: booking.id,
          emergencyType: emergency.emergency_type,
        });

        io.to(`user_${admin.id}`).emit("sos_alert", {
          alertId: emergency.id,
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
          serviceName: booking.service_name,
          emergencyType: emergency.emergency_type,
          message: emergency.message,
          latitude: emergency.latitude,
          longitude: emergency.longitude,
          status: emergency.status,
        });
      }
    }

    return res.status(201).json({
      ok: true,
      message: "Emergency alert sent successfully",
      emergency,
    });
  } catch (error) {
    console.error("createEmergencyAlert error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while creating emergency alert",
    });
  }
};

export const getMyEmergencyAlerts = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        ea.*,
        b.booking_number,
        b.service_name,
        b.status AS booking_status
      FROM emergency_alerts ea
      JOIN bookings b ON b.id = ea.booking_id
      WHERE ea.triggered_by = $1
      ORDER BY ea.created_at DESC
      `,
      [userId]
    );

    return res.json({
      ok: true,
      alerts: result.rows,
    });
  } catch (error) {
    console.error("getMyEmergencyAlerts error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while fetching emergency alerts",
    });
  }
};

export const getAdminEmergencyAlerts = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        ea.*,
        b.booking_number,
        b.service_name,
        b.service_address,
        b.status AS booking_status,
        u.full_name AS triggered_by_name,
        u.phone_number AS triggered_by_phone,
        helper.full_name AS helper_name,
        helper.phone_number AS helper_phone
      FROM emergency_alerts ea
      JOIN bookings b ON b.id = ea.booking_id
      JOIN users u ON u.id = ea.triggered_by
      JOIN users helper ON helper.id = b.helper_id
      ORDER BY ea.created_at DESC
      `
    );

    return res.json({
      ok: true,
      alerts: result.rows,
    });
  } catch (error) {
    console.error("getAdminEmergencyAlerts error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while fetching emergency alerts",
    });
  }
};

export const getAdminEmergencyAlertById = async (req, res) => {
  try {
    const alertId = req.params.id;

    const result = await pool.query(
      `
      SELECT 
        ea.*,
        b.booking_number,
        b.service_name,
        b.service_address,
        b.booking_date,
        b.start_time,
        b.status AS booking_status,
        user_account.full_name AS user_name,
        user_account.phone_number AS user_phone,
        helper.full_name AS helper_name,
        helper.phone_number AS helper_phone,
        triggered.full_name AS triggered_by_name,
        triggered.phone_number AS triggered_by_phone
      FROM emergency_alerts ea
      JOIN bookings b ON b.id = ea.booking_id
      JOIN users user_account ON user_account.id = b.user_id
      JOIN users helper ON helper.id = b.helper_id
      JOIN users triggered ON triggered.id = ea.triggered_by
      WHERE ea.id = $1
      LIMIT 1
      `,
      [alertId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Emergency alert not found",
      });
    }

    return res.json({
      ok: true,
      alert: result.rows[0],
    });
  } catch (error) {
    console.error("getAdminEmergencyAlertById error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while fetching emergency alert",
    });
  }
};

export const updateEmergencyStatus = async (req, res) => {
  try {
    const adminId = req.user.id;
    const alertId = req.params.id;
    const { status, admin_note } = req.body || {};

    const allowedStatuses = [
      "ACTIVE",
      "ACKNOWLEDGED",
      "ESCALATED",
      "RESOLVED",
      "FALSE_ALARM",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid emergency status",
      });
    }

    const isClosed = ["RESOLVED", "FALSE_ALARM"].includes(status);

    const result = await pool.query(
      `
      UPDATE emergency_alerts
      SET status = $1,
          admin_note = $2,
          resolved_by = CASE WHEN $3 = true THEN $4 ELSE resolved_by END,
          resolved_at = CASE WHEN $3 = true THEN CURRENT_TIMESTAMP ELSE resolved_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
      `,
      [status, admin_note || null, isClosed, adminId, alertId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Emergency alert not found",
      });
    }

    const emergency = result.rows[0];

    await createNotification({
      user_id: emergency.triggered_by,
      title: "Emergency Alert Updated",
      message: `Your emergency alert status has been updated to ${status}.`,
      type: "EMERGENCY_STATUS_UPDATED",
      ref_table: "emergency_alerts",
      ref_id: emergency.id,
    });

    return res.json({
      ok: true,
      message: "Emergency status updated successfully",
      emergency,
    });
  } catch (error) {
    console.error("updateEmergencyStatus error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while updating emergency status",
    });
  }
};