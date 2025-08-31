import { pool } from "../db/db.js";

export async function sendMessage(req, res) {
  try {
    const { bookingId } = req.params;
    const { message } = req.body;
    const senderId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        ok: false,
        message: "Message is required",
      });
    }

    const bookingResult = await pool.query(
      `
      SELECT id, user_id, helper_id, service_name, status
      FROM bookings
      WHERE id = $1
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

    const isAllowed =
      Number(booking.user_id) === Number(senderId) ||
      Number(booking.helper_id) === Number(senderId);

    if (!isAllowed) {
      return res.status(403).json({
        ok: false,
        message: "You are not allowed to chat in this booking",
      });
    }

    const insertResult = await pool.query(
      `
      INSERT INTO booking_messages (booking_id, sender_id, message)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [bookingId, senderId, message.trim()]
    );

    const msg = insertResult.rows[0];

    const userResult = await pool.query(
      `
      SELECT id, full_name, profile_photo_url, role
      FROM users
      WHERE id = $1
      `,
      [senderId]
    );

    const sender = userResult.rows[0] || null;

    const receiverId =
      Number(booking.user_id) === Number(senderId)
        ? booking.helper_id
        : booking.user_id;

    if (receiverId) {
      await pool.query(
        `
        INSERT INTO notifications (
          user_id,
          title,
          message,
          type,
          ref_table,
          ref_id,
          is_read,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW())
        `,
        [
          receiverId,
          "New Message",
          `${sender?.full_name || "Someone"} sent you a message${
            booking.service_name ? ` about ${booking.service_name}` : ""
          }`,
          "CHAT_MESSAGE",
          "bookings",
          bookingId,
        ]
      );
    }

    return res.status(201).json({
      ok: true,
      message: "Message sent",
      chat_message: {
        ...msg,
        sender,
      },
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while sending message",
    });
  }
}

export async function getMessages(req, res) {
  try {
    const { bookingId } = req.params;
    const currentUserId = req.user.id;

    const bookingResult = await pool.query(
      `
      SELECT id, user_id, helper_id
      FROM bookings
      WHERE id = $1
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

    const isAllowed =
      Number(booking.user_id) === Number(currentUserId) ||
      Number(booking.helper_id) === Number(currentUserId);

    if (!isAllowed) {
      return res.status(403).json({
        ok: false,
        message: "You are not allowed to view this chat",
      });
    }

    const result = await pool.query(
      `
      SELECT
        bm.id,
        bm.booking_id,
        bm.sender_id,
        bm.message,
        bm.is_read,
        bm.created_at,
        u.full_name,
        u.profile_photo_url,
        u.role
      FROM booking_messages bm
      JOIN users u ON u.id = bm.sender_id
      WHERE bm.booking_id = $1
      ORDER BY bm.created_at ASC
      `,
      [bookingId]
    );

    return res.status(200).json({
      ok: true,
      messages: result.rows,
    });
  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while fetching messages",
    });
  }
}

export async function markMessagesAsRead(req, res) {
  try {
    const { bookingId } = req.params;
    const currentUserId = req.user.id;

    const bookingResult = await pool.query(
      `
      SELECT id, user_id, helper_id
      FROM bookings
      WHERE id = $1
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

    const isAllowed =
      Number(booking.user_id) === Number(currentUserId) ||
      Number(booking.helper_id) === Number(currentUserId);

    if (!isAllowed) {
      return res.status(403).json({
        ok: false,
        message: "You are not allowed to update this chat",
      });
    }

    await pool.query(
      `
      UPDATE booking_messages
      SET is_read = TRUE
      WHERE booking_id = $1
        AND sender_id != $2
        AND is_read = FALSE
      `,
      [bookingId, currentUserId]
    );

    return res.status(200).json({
      ok: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("markMessagesAsRead error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while marking messages as read",
    });
  }
}

export async function getChatList(req, res) {
  try {
    const currentUserId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        b.id AS booking_id,
        b.service_name,
        b.status AS booking_status,
        b.booking_date,

        CASE
          WHEN b.user_id = $1 THEN helper_user.full_name
          ELSE customer_user.full_name
        END AS other_person_name,

        CASE
          WHEN b.user_id = $1 THEN helper_user.id
          ELSE customer_user.id
        END AS other_person_id,

        CASE
          WHEN b.user_id = $1 THEN helper_user.role
          ELSE customer_user.role
        END AS other_person_role,

        (
          SELECT bm.message
          FROM booking_messages bm
          WHERE bm.booking_id = b.id
          ORDER BY bm.created_at DESC
          LIMIT 1
        ) AS last_message,

        (
          SELECT bm.created_at
          FROM booking_messages bm
          WHERE bm.booking_id = b.id
          ORDER BY bm.created_at DESC
          LIMIT 1
        ) AS last_message_time,

        (
          SELECT bm.sender_id
          FROM booking_messages bm
          WHERE bm.booking_id = b.id
          ORDER BY bm.created_at DESC
          LIMIT 1
        ) AS last_message_sender_id,

        (
          SELECT COUNT(*)
          FROM booking_messages bm
          WHERE bm.booking_id = b.id
            AND bm.sender_id != $1
            AND bm.is_read = FALSE
        ) AS unread_count

      FROM bookings b
      JOIN users customer_user ON customer_user.id = b.user_id
      JOIN users helper_user ON helper_user.id = b.helper_id

      WHERE (b.user_id = $1 OR b.helper_id = $1)
        AND EXISTS (
          SELECT 1
          FROM booking_messages bm
          WHERE bm.booking_id = b.id
        )

      ORDER BY
        COALESCE(
          (
            SELECT bm.created_at
            FROM booking_messages bm
            WHERE bm.booking_id = b.id
            ORDER BY bm.created_at DESC
            LIMIT 1
          ),
          b.created_at
        ) DESC
      `,
      [currentUserId]
    );

    return res.status(200).json({
      ok: true,
      chats: result.rows,
    });
  } catch (error) {
    console.error("getChatList error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while fetching chat list",
    });
  }
}