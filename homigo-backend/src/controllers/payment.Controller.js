import crypto from "crypto";
import { pool } from "../db/db.js";
import createNotification from "../utils/createNotification.js";

const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
const ESEWA_PAYMENT_URL =
  process.env.ESEWA_FORM_URL ||
  "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

function generateEsewaSignature(totalAmount, transactionUuid, productCode) {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;

  return crypto
    .createHmac("sha256", ESEWA_SECRET_KEY)
    .update(message)
    .digest("base64");
}

function successPage(totalAmount, bookingId) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Payment Successful</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(180deg, #ffffff, #fff8f5, #fff1ea);
        font-family: Arial, sans-serif;
        padding: 20px;
      }

      .card {
        background: #fff;
        width: 100%;
        max-width: 420px;
        border-radius: 28px;
        padding: 30px;
        text-align: center;
        box-shadow: 0 15px 40px rgba(234, 76, 30, 0.15);
        border: 1px solid rgba(0,0,0,0.06);
      }

      .icon {
        width: 90px;
        height: 90px;
        border-radius: 45px;
        background: #DCFCE7;
        color: #16A34A;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
        font-weight: bold;
        margin: 0 auto 20px;
      }

      h1 {
        color: #16A34A;
        margin: 0;
        font-size: 28px;
      }

      p {
        color: #6B7280;
        line-height: 1.5;
      }

      .amount {
        background: #FFF2ED;
        color: #EA4C1E;
        padding: 16px;
        border-radius: 16px;
        font-size: 26px;
        font-weight: bold;
        margin: 20px 0;
      }

      .btn {
        display: block;
        text-decoration: none;
        color: white;
        background: linear-gradient(90deg, #FF6B35, #EA4C1E, #C93A0F);
        padding: 16px;
        border-radius: 16px;
        font-weight: bold;
        margin-top: 20px;
      }

      .small {
        margin-top: 16px;
        font-size: 13px;
        color: #9CA3AF;
      }
    </style>
  </head>

  <body>
    <div class="card">
      <div class="icon">✓</div>

      <h1>Payment Successful</h1>

      <p>Your payment has been completed successfully.</p>

      <div class="amount">
        NPR ${totalAmount || ""}
      </div>

      <p><strong>Booking ID:</strong> ${bookingId}</p>

      <a
        class="btn"
        href="homigomobile://payment-success?bookingId=${bookingId}"
      >
        Return to Homigo
      </a>

      <p class="small">
        If the app doesn't open automatically, return to Homigo manually.
      </p>
    </div>
  </body>
  </html>
  `;
}

function failurePage(message = "Your payment was not completed.") {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Failed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="font-family: Arial; text-align: center; padding: 40px;">
        <h2 style="color: red;">Payment Failed</h2>
        <p>${message}</p>
        <p>Please go back to Homigo and try again.</p>
      </body>
    </html>
  `;
}

export const initiateEsewaPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        ok: false,
        message: "Booking ID is required.",
      });
    }

    const bookingResult = await pool.query(
      `
      SELECT id, user_id, status, payment_status
      FROM bookings
      WHERE id = $1
      `,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Booking not found.",
      });
    }

    const booking = bookingResult.rows[0];

    if (Number(booking.user_id) !== Number(userId)) {
      return res.status(403).json({
        ok: false,
        message: "You are not allowed to pay for this booking.",
      });
    }

    if (!["ACCEPTED", "ON_THE_WAY", "IN_PROGRESS"].includes(booking.status)) {
      return res.status(400).json({
        ok: false,
        message: "Payment is available only after helper accepts the booking.",
      });
    }

    if (booking.payment_status === "PAID") {
      return res.status(400).json({
        ok: false,
        message: "This booking is already paid.",
      });
    }

    const checkoutUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/payments/esewa/checkout/${bookingId}`;

    return res.json({
      ok: true,
      message: "eSewa checkout created.",
      checkout_url: checkoutUrl,
    });
  } catch (error) {
    console.error("Initiate eSewa payment error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while initiating eSewa payment.",
    });
  }
};

export const esewaCheckoutPage = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const bookingResult = await pool.query(
      `
      SELECT 
        id,
        status,
        payment_status,
        estimated_amount,
        final_amount
      FROM bookings
      WHERE id = $1
      `,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return res.send("Booking not found.");
    }

    const booking = bookingResult.rows[0];

    if (!["ACCEPTED", "ON_THE_WAY", "IN_PROGRESS"].includes(booking.status)) {
      return res.send("Payment allowed only after helper accepts booking.");
    }

    if (booking.payment_status === "PAID") {
      return res.send("This booking is already paid.");
    }

    const amount = Number(booking.final_amount || booking.estimated_amount);

    if (!amount || amount <= 0) {
      return res.send("Invalid payment amount.");
    }

    const transactionUuid = `HOMIGO-${booking.id}-${Date.now()}`;
    const totalAmount = amount.toFixed(1);

    const signature = generateEsewaSignature(
      totalAmount,
      transactionUuid,
      ESEWA_PRODUCT_CODE
    );

    await pool.query(
      `
      UPDATE bookings
      SET 
        payment_status = 'INITIATED',
        payment_method = 'ONLINE',
        updated_at = NOW()
      WHERE id = $1
      `,
      [booking.id]
    );

    const backendBaseUrl =
      process.env.BACKEND_URL || "http://192.168.16.194:5000";

    const successUrl = `${backendBaseUrl}/api/payments/esewa/success`;
    const failureUrl = `${backendBaseUrl}/api/payments/esewa/failure`;

    console.log("ESEWA SUCCESS URL:", successUrl);
    console.log("ESEWA FAILURE URL:", failureUrl);
    console.log("TRANSACTION UUID:", transactionUuid);

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting to eSewa</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>

        <body onload="document.forms[0].submit()" style="font-family: Arial; text-align: center; padding: 40px;">
          <h3>Redirecting to eSewa...</h3>
          <p>Please wait while we open the payment page.</p>

          <form method="POST" action="${ESEWA_PAYMENT_URL}">
            <input type="hidden" name="amount" value="${totalAmount}" />
            <input type="hidden" name="tax_amount" value="0" />
            <input type="hidden" name="total_amount" value="${totalAmount}" />
            <input type="hidden" name="transaction_uuid" value="${transactionUuid}" />
            <input type="hidden" name="product_code" value="${ESEWA_PRODUCT_CODE}" />
            <input type="hidden" name="product_service_charge" value="0" />
            <input type="hidden" name="product_delivery_charge" value="0" />
            <input type="hidden" name="success_url" value="${successUrl}" />
            <input type="hidden" name="failure_url" value="${failureUrl}" />
            <input
              type="hidden"
              name="signed_field_names"
              value="total_amount,transaction_uuid,product_code"
            />
            <input type="hidden" name="signature" value="${signature}" />
          </form>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("eSewa checkout page error:", error);
    return res.send("Server error while opening eSewa checkout.");
  }
};

export const esewaSuccess = async (req, res) => {
  try {
    console.log("SUCCESS ROUTE HIT:", req.query);

    const { data } = req.query;

    if (!data) {
      return res.status(400).send(failurePage("Missing payment data."));
    }

    const decodedString = Buffer.from(data, "base64").toString("utf-8");
    const decodedData = JSON.parse(decodedString);

    console.log("eSewa success response:", decodedData);

    const { transaction_code, status, total_amount, transaction_uuid } =
      decodedData;

    const bookingId = transaction_uuid?.split("-")[1];

    console.log("EXTRACTED BOOKING ID:", bookingId);

    if (!bookingId) {
      return res.status(400).send(failurePage("Booking ID not found."));
    }

    if (status !== "COMPLETE") {
      return res.status(400).send(failurePage("Payment was not completed."));
    }

    const updateResult = await pool.query(
      `
      UPDATE bookings
      SET 
        payment_status = 'PAID',
        payment_method = 'ONLINE',
        transaction_id = $1,
        paid_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
      RETURNING id, payment_status, transaction_id, paid_at
      `,
      [transaction_code || transaction_uuid, bookingId]
    );

    console.log("PAYMENT UPDATE RESULT:", updateResult.rows);

    if (updateResult.rows.length === 0) {
      return res.status(404).send(failurePage("Booking not found in database."));
    }

    return res.send(successPage(total_amount, bookingId));
  } catch (error) {
    console.error("eSewa success error:", error);
    return res
      .status(500)
      .send(failurePage("Server error while updating payment."));
  }
};

export const esewaFailure = async (req, res) => {
  console.log("FAILURE ROUTE HIT:", req.query);
  return res.send(failurePage("Your eSewa payment was cancelled or failed."));
};

export const getPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;

    const result = await pool.query(
      `
      SELECT 
        id,
        user_id,
        status,
        payment_status,
        payment_method,
        transaction_id,
        paid_at,
        estimated_amount,
        final_amount
      FROM bookings
      WHERE id = $1
      `,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Booking not found.",
      });
    }

    const booking = result.rows[0];

    if (Number(booking.user_id) !== Number(userId)) {
      return res.status(403).json({
        ok: false,
        message: "You cannot view this payment status.",
      });
    }

    return res.json({
      ok: true,
      booking,
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while getting payment status.",
    });
  }
};

export const requestRefund = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;
    const { refund_reason } = req.body || {};

    if (!refund_reason) {
      return res.status(400).json({
        ok: false,
        message: "Refund reason is required.",
      });
    }

    const result = await pool.query(
      `
      UPDATE bookings
      SET refund_status = 'REFUND_REQUESTED',
          refund_reason = $1,
          refund_requested_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
        AND user_id = $3
        AND payment_status = 'PAID'
        AND refund_status IN ('NO_REFUND', 'REFUND_REJECTED')
      RETURNING *
      `,
      [refund_reason, bookingId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Refund cannot be requested for this booking.",
      });
    }

    const booking = result.rows[0];

    const admins = await pool.query(
      `SELECT id FROM users WHERE role = 'ADMIN' AND is_active = true`
    );

    const io = req.app.get("io");

    for (const admin of admins.rows) {
      await createNotification({
        user_id: admin.id,
        title: "Refund Requested",
        message: `Refund requested for booking ${
          booking.booking_number || booking.id
        }.`,
        type: "REFUND_REQUESTED",
        ref_table: "bookings",
        ref_id: booking.id,
      });

      io?.to(`user_${admin.id}`).emit("notification", {
        type: "REFUND_REQUESTED",
        title: "Refund Requested",
        message: `Refund requested for booking ${
          booking.booking_number || booking.id
        }.`,
        bookingId: booking.id,
      });
    }

    return res.json({
      ok: true,
      message: "Refund request submitted successfully.",
      booking,
    });
  } catch (error) {
    console.error("requestRefund error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while requesting refund.",
    });
  }
};

export const getAdminRefundRequests = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        b.*,
        u.full_name AS user_name,
        u.phone_number AS user_phone,
        h.full_name AS helper_name
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      JOIN users h ON h.id = b.helper_id
      WHERE b.refund_status IN (
        'REFUND_REQUESTED',
        'REFUND_APPROVED',
        'REFUND_REJECTED',
        'REFUNDED'
      )
      ORDER BY
        CASE
          WHEN b.refund_status = 'REFUND_REQUESTED' THEN 1
          WHEN b.refund_status = 'REFUND_APPROVED' THEN 2
          WHEN b.refund_status = 'REFUNDED' THEN 3
          WHEN b.refund_status = 'REFUND_REJECTED' THEN 4
          ELSE 5
        END,
        b.refund_requested_at DESC NULLS LAST
      `
    );

    return res.json({
      ok: true,
      refunds: result.rows,
    });
  } catch (error) {
    console.error("getAdminRefundRequests error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while fetching refund requests.",
    });
  }
};

export const updateRefundStatus = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { bookingId } = req.params;
    const { refund_status, refund_admin_note } = req.body || {};

    if (
      !["REFUND_APPROVED", "REFUND_REJECTED", "REFUNDED"].includes(
        refund_status
      )
    ) {
      return res.status(400).json({
        ok: false,
        message: "Invalid refund status.",
      });
    }

    let allowedCurrentStatuses = [];

    if (refund_status === "REFUND_APPROVED") {
      allowedCurrentStatuses = ["REFUND_REQUESTED"];
    }

    if (refund_status === "REFUND_REJECTED") {
      allowedCurrentStatuses = ["REFUND_REQUESTED"];
    }

    if (refund_status === "REFUNDED") {
      allowedCurrentStatuses = ["REFUND_APPROVED"];
    }

    const result = await pool.query(
      `
      UPDATE bookings
      SET 
        refund_status = $1,
        refund_admin_note = $2,
        refund_decision_by = $3,
        refund_decision_at = NOW(),
        updated_at = NOW()
      WHERE id = $4
        AND refund_status = ANY($5)
      RETURNING *
      `,
      [
        refund_status,
        refund_admin_note || null,
        adminId,
        bookingId,
        allowedCurrentStatuses,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Refund request not found or invalid status transition.",
      });
    }

    const booking = result.rows[0];

    await createNotification({
      user_id: booking.user_id,
      title: "Refund Update",
      message: `Your refund request has been marked as ${refund_status}.`,
      type: "REFUND_STATUS_UPDATED",
      ref_table: "bookings",
      ref_id: booking.id,
    });

    const io = req.app.get("io");

    io?.to(`user_${booking.user_id}`).emit("notification", {
      type: "REFUND_STATUS_UPDATED",
      title: "Refund Update",
      message: `Your refund request has been marked as ${refund_status}.`,
      bookingId: booking.id,
    });

    return res.json({
      ok: true,
      message: "Refund status updated successfully.",
      booking,
    });
  } catch (error) {
    console.error("updateRefundStatus error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while updating refund status.",
    });
  }
};