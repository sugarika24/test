import { pool } from "../db/db.js";
import { generateEsewaSignature } from "../utils/esewa.js";

const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE;
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY;
const ESEWA_FORM_URL = process.env.ESEWA_FORM_URL;
const ESEWA_STATUS_URL = process.env.ESEWA_STATUS_URL;
const ESEWA_SUCCESS_URL = process.env.ESEWA_SUCCESS_URL;
const ESEWA_FAILURE_URL = process.env.ESEWA_FAILURE_URL;

function makeTxnId(bookingId) {
  return `HOMIGO-${bookingId}-${Date.now()}`;
}

// 1. Initiate payment
export async function initiateEsewaPayment(req, res) {
  try {
    const userId = req.user.id;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        ok: false,
        message: "bookingId is required",
      });
    }

    const bookingResult = await pool.query(
      `
      SELECT id, user_id, status, payment_status, estimated_amount
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

    if (Number(booking.user_id) !== Number(userId)) {
      return res.status(403).json({
        ok: false,
        message: "You can only pay for your own booking",
      });
    }

    if (booking.payment_status === "PAID") {
      return res.status(400).json({
        ok: false,
        message: "Booking is already paid",
      });
    }

    if (booking.status !== "ACCEPTED") {
  return res.status(400).json({
    ok: false,
    message: "You can only pay after helper accepts the booking",
  });
}

    if (!booking.estimated_amount || Number(booking.estimated_amount) <= 0) {
      return res.status(400).json({
        ok: false,
        message: "Invalid booking amount",
      });
    }

    const totalAmount = Number(booking.estimated_amount).toFixed(2);
    const transactionUuid = makeTxnId(booking.id);

    const signature = generateEsewaSignature({
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_PRODUCT_CODE,
      secret: ESEWA_SECRET_KEY,
    });

    await pool.query(
      `
      UPDATE bookings
      SET payment_provider = 'ESEWA',
          merchant_txn_id = $1,
          payment_status = 'INITIATED',
          payment_amount = $2,
          payment_initiated_at = NOW()
      WHERE id = $3
      `,
      [transactionUuid, totalAmount, booking.id]
    );

    return res.json({
      ok: true,
      message: "eSewa payment initiated successfully",
      data: {
        form_url: ESEWA_FORM_URL,
        fields: {
          amount: totalAmount,
          tax_amount: "0",
          total_amount: totalAmount,
          transaction_uuid: transactionUuid,
          product_code: ESEWA_PRODUCT_CODE,
          product_service_charge: "0",
          product_delivery_charge: "0",
          success_url: ESEWA_SUCCESS_URL,
          failure_url: ESEWA_FAILURE_URL,
          signed_field_names: "total_amount,transaction_uuid,product_code",
          signature,
        },
      },
    });
  } catch (error) {
    console.error("initiateEsewaPayment error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while initiating eSewa payment",
      error: error.message,
    });
  }
}

// 2. Verify payment
export async function verifyEsewaPayment(req, res) {
  try {
    const userId = req.user.id;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        ok: false,
        message: "bookingId is required",
      });
    }

    const bookingResult = await pool.query(
      `
      SELECT id, user_id, merchant_txn_id, payment_amount, payment_status
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

    if (Number(booking.user_id) !== Number(userId)) {
      return res.status(403).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    if (!booking.merchant_txn_id || !booking.payment_amount) {
      return res.status(400).json({
        ok: false,
        message: "No initiated payment found for this booking",
      });
    }

    if (booking.payment_status === "PAID") {
      return res.json({
        ok: true,
        message: "Payment already verified",
      });
    }

    await pool.query(
      `
      UPDATE bookings
      SET payment_status = 'PAID',
          payment_reference = merchant_txn_id,
          payment_completed_at = NOW(),
          payment_verified_at = NOW()
      WHERE id = $1
      `,
      [booking.id]
    );

    return res.json({
      ok: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("verifyEsewaPayment error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while verifying eSewa payment",
      error: error.message,
    });
  }
}

// 3. Success redirect
export async function esewaSuccess(req, res) {
  try {
    return res.status(200).send("eSewa payment success page reached. Return to Homigo app.");
  } catch (error) {
    console.error("esewaSuccess error:", error);
    return res.status(500).send("Server error");
  }
}

// 4. Failure redirect
export async function esewaFailure(req, res) {
  try {
    return res.status(200).send("eSewa payment failed or cancelled.");
  } catch (error) {
    console.error("esewaFailure error:", error);
    return res.status(500).send("Server error");
  }
}

// 5. Get payment status by booking
export async function getPaymentStatus(req, res) {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;

    const result = await pool.query(
      `
      SELECT id, user_id, payment_provider, payment_status, payment_amount,
             merchant_txn_id, payment_reference, payment_initiated_at,
             payment_completed_at, payment_verified_at
      FROM bookings
      WHERE id = $1
      `,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Booking not found",
      });
    }

    const booking = result.rows[0];

    if (Number(booking.user_id) !== Number(userId)) {
      return res.status(403).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    return res.json({
      ok: true,
      data: booking,
    });
  } catch (error) {
    console.error("getPaymentStatus error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: error.message,
    });
  }
}