import bcrypt from "bcrypt";
import { pool } from "../db/db.js";
import { generateToken } from "../utils/generateToken.js";
import { generateOTP } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/sendOtpEmail.js";
// =========================
// REGISTER
// =========================
export async function register(req, res) {
  const client = await pool.connect();

  try {
    const {
      full_name,
      email,
      password,
      confirm_password,
      phone_number,
      role,
      id_document_type,
      id_document_number,
    } = req.body;

    // validation
    if (!full_name || !email || !password || !confirm_password || !role) {
      return res.status(400).json({
        ok: false,
        message:
          "Full name, email, password, confirm password and role are required.",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        ok: false,
        message: "Password and confirm password do not match.",
      });
    }

    if (!["USER", "HELPER"].includes(role)) {
      return res.status(400).json({
        ok: false,
        message: "Role must be USER or HELPER.",
      });
    }

    if (role === "HELPER") {
  const allowedDocumentTypes = [
    "CITIZENSHIP",
    "NATIONAL_ID",
    "PASSPORT",
    "DRIVING_LICENSE",
  ];

  if (!id_document_type) {
    return res.status(400).json({
      ok: false,
      message: "Document type is required for helper registration.",
    });
  }

  if (!allowedDocumentTypes.includes(id_document_type)) {
    return res.status(400).json({
      ok: false,
      message:
        "Invalid document type. Allowed: CITIZENSHIP, NATIONAL_ID, PASSPORT, DRIVING_LICENSE.",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      ok: false,
      message: "Identification document image is required for helper registration.",
    });
  }
}

    const cleanEmail = email.trim().toLowerCase();

    // check email
    const existingUser = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "Email already registered.",
      });
    }

    // check phone
    if (phone_number) {
      const existingPhone = await client.query(
        `SELECT id FROM users WHERE phone_number = $1`,
        [phone_number]
      );

      if (existingPhone.rows.length > 0) {
        return res.status(409).json({
          ok: false,
          message: "Phone number already in use.",
        });
      }
    }

    const password_hash = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    // create user
    const userResult = await client.query(
      `
      INSERT INTO users (full_name, email, password_hash, role, phone_number)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, full_name, email, role, phone_number, profile_photo_url, is_active, created_at
      `,
      [full_name.trim(), cleanEmail, password_hash, role, phone_number || null]
    );

   const user = userResult.rows[0];

// create helper profile + helper document if role = HELPER
if (role === "HELPER") {
  await client.query(
    `
    INSERT INTO helper_profiles
    (
      user_id,
      bio,
      hourly_rate,
      category_id,
      is_available,
      avg_rating,
      rating_count,
      completed_jobs_count,
      experience_years,
      verification_status,
      is_verified
    )
    VALUES ($1, '', 0, NULL, false, 0, 0, 0, 0, 'PENDING', false)
    `,
    [user.id]
  );

  const document_url = `/uploads/${req.file.filename}`;

  await client.query(
    `
    INSERT INTO helper_verification_documents
    (
      helper_user_id,
      document_type,
      document_number,
      document_url
    )
    VALUES ($1, $2, $3, $4)
    `,
    [
      user.id,
      id_document_type,
      id_document_number || null,
      document_url,
    ]
  );
}

await client.query("COMMIT");

    const token = generateToken(user);

    return res.status(201).json({
      ok: true,
      message:
        role === "HELPER"
          ? "Registration successful. Your helper account is pending admin approval."
          : "Registration successful.",
      token,
      user,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("register error:", error);

    return res.status(500).json({
      ok: false,
      message: "Server error during registration.",
      error: error.message,
    });
  } finally {
    client.release();
  }
}
// =========================
// LOGIN
// =========================
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `
      SELECT id, full_name, email, password_hash, role, phone_number,
             profile_photo_url, is_active, created_at
      FROM users
      WHERE email = $1
      `,
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        ok: false,
        message: "Invalid email or password.",
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        ok: false,
        message: "Your account is deactivated.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        ok: false,
        message: "Invalid email or password.",
      });
    }

    await pool.query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id]
    );

    const token = generateToken(user);

    delete user.password_hash;

    return res.status(200).json({
      ok: true,
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    console.error("login error:", error);

    return res.status(500).json({
      ok: false,
      message: "Server error during login.",
      error: error.message,
    });
  }
}

// =========================
// FORGOT PASSWORD
// =========================
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        ok: false,
        message: "Email is required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const userResult = await pool.query(
      `SELECT id, email, full_name FROM users WHERE email = $1`,
      [cleanEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "No account found with this email.",
      });
    }

    const user = userResult.rows[0];
    const otp = generateOTP(6);

    await pool.query(
      `
      INSERT INTO password_reset_otps (user_id, email, otp_code, expires_at, is_used)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '10 minutes', FALSE)
      `,
      [user.id, user.email, otp]
    );

    await sendOtpEmail(user.email, otp, user.full_name);

    return res.status(200).json({
      ok: true,
      message: "OTP sent successfully to your email.",
    });
  } catch (error) {
    console.error("forgotPassword error:", error);

    return res.status(500).json({
      ok: false,
      message: "Server error during forgot password.",
      error: error.message,
    });
  }
}
// =========================
// RESET PASSWORD
// =========================
export async function resetPassword(req, res) {
  const client = await pool.connect();

  try {
    const { email, otp_code, new_password, confirm_password } = req.body;

    if (!email || !otp_code || !new_password || !confirm_password) {
      return res.status(400).json({
        ok: false,
        message: "Email, OTP, new password and confirm password are required.",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        ok: false,
        message: "New password and confirm password do not match.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const otpResult = await client.query(
      `
      SELECT *
      FROM password_reset_otps
      WHERE email = $1
        AND otp_code = $2
        AND is_used = FALSE
        AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [cleanEmail, otp_code]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Invalid or expired OTP.",
      });
    }

    const otpRow = otpResult.rows[0];
    const password_hash = await bcrypt.hash(new_password, 10);

    await client.query("BEGIN");

    await client.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [password_hash, otpRow.user_id]
    );

    await client.query(
      `UPDATE password_reset_otps SET is_used = TRUE WHERE id = $1`,
      [otpRow.id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      ok: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("resetPassword error:", error);

    return res.status(500).json({
      ok: false,
      message: "Server error during reset password.",
      error: error.message,
    });
  } finally {
    client.release();
  }
}

// =========================
// CHANGE PASSWORD
// =========================
export async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        ok: false,
        message: "Current password, new password and confirm password are required.",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        ok: false,
        message: "New password and confirm password do not match.",
      });
    }

    const userResult = await pool.query(
      `SELECT id, password_hash FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(current_password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({
        ok: false,
        message: "Current password is incorrect.",
      });
    }

    const password_hash = await bcrypt.hash(new_password, 10);

    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [password_hash, userId]
    );

    return res.status(200).json({
      ok: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("changePassword error:", error);

    return res.status(500).json({
      ok: false,
      message: "Server error during change password.",
      error: error.message,
    });
  }
}

// =========================
// LOGOUT
// =========================
export async function logout(req, res) {
  try {
    return res.status(200).json({
      ok: true,
      message: "Logout successful. Remove token from frontend storage.",
    });
  } catch (error) {
    console.error("logout error:", error);

    return res.status(500).json({
      ok: false,
      message: "Server error during logout.",
      error: error.message,
    });
  }
}