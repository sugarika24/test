import { pool } from "../db/db.js";

export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.status(200).json({
      ok: true,
      notifications: result.rows,
    });
  } catch (error) {
    console.error("getMyNotifications error:", error.message);
    res.status(500).json({
      ok: false,
      message: "Failed to fetch notifications",
    });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT COUNT(*)::int AS unread_count
      FROM notifications
      WHERE user_id = $1 AND is_read = FALSE
      `,
      [userId]
    );

    res.status(200).json({
      ok: true,
      unread_count: result.rows[0].unread_count,
    });
  } catch (error) {
    console.error("getUnreadNotificationCount error:", error.message);
    res.status(500).json({
      ok: false,
      message: "Failed to fetch unread count",
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const result = await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error("markNotificationAsRead error:", error.message);
    res.status(500).json({
      ok: false,
      message: "Failed to update notification",
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE
      `,
      [userId]
    );

    res.status(200).json({
      ok: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("markAllNotificationsAsRead error:", error.message);
    res.status(500).json({
      ok: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const result = await pool.query(
      `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("deleteNotification error:", error.message);
    res.status(500).json({
      ok: false,
      message: "Failed to delete notification",
    });
  }
};

export const createTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      INSERT INTO notifications (user_id, title, message, type, ref_table, ref_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        userId,
        "Test Notification",
        "This is a test notification from Homigo.",
        "TEST",
        null,
        null,
      ]
    );

    res.status(201).json({
      ok: true,
      message: "Test notification created",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error("createTestNotification error:", error.message);
    res.status(500).json({
      ok: false,
      message: "Failed to create test notification",
    });
  }
};