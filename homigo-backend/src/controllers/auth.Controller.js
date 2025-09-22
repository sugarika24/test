import bcrypt from "bcrypt";
import { pool } from "../db/db.js";
import { generateToken } from "../utils/generateToken.js";
import { generateOTP } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/sendOtpEmail.js";
import { sendRegisterOtpEmail } from "../utils/sendRegisterOtpEmail.js";

// Nepal mobile number validation
const PHONE_REGEX = /^(98|97)\d{8}$/;

// =========================
// CLEANUP HELPERS
// =========================
async function cleanupExpiredPhoneOtps(clientOrPool = pool) {
  try {
    await clientOrPool.query(`
      DELETE FROM phone_verification_otps
      WHERE expires_at <= CURRENT_TIMESTAMP
         OR (is_used = TRUE AND created_at <= CURRENT_TIMESTAMP - INTERVAL '1 day')
    `);
  } catch (error) {
    console.error("cleanupExpiredPhoneOtps error:", error);
  }
}

async function cleanupExpiredPasswordOtps(clientOrPool = pool) {
  try {
    await clientOrPool.query(`
      DELETE FROM password_reset_otps
      WHERE expires_at <= CURRENT_TIMESTAMP
         OR (is_used = TRUE AND created_at <= CURRENT_TIMESTAMP - INTERVAL '1 day')
    `);
  } catch (error) {
    console.error("cleanupExpiredPasswordOtps error:", error);
  }
}

async function cleanupExpiredRegisterEmailOtps(clientOrPool = pool) {
  try {
    await clientOrPool.query(`
      DELETE FROM register_email_otps
      WHERE expires_at <= CURRENT_TIMESTAMP
         OR (is_used = TRUE AND created_at <= CURRENT_TIMESTAMP - INTERVAL '1 day')
    `);
  } catch (error) {
    console.error("cleanupExpiredRegisterEmailOtps error:", error);
  }
}

// =========================
// SEND REGISTER PHONE OTP
// =========================
export async function sendRegisterOtp(req, res) {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({
        ok: false,
        message: "Phone number is required.",
      });
    }

    const cleanPhone = String(phone_number).trim();

    if (!PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({
        ok: false,
        message: "Phone number must be a valid 10-digit Nepal mobile number.",
      });
    }

    await cleanupExpiredPhoneOtps();

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE phone_number = $1`,
      [cleanPhone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "Phone number is already registered.",
      });
    }

    const otp = generateOTP(6);

    await pool.query(
      `
      UPDATE phone_verification_otps
      SET is_used = TRUE
      WHERE phone_number = $1
        AND is_used = FALSE
      `,
      [cleanPhone]
    );

    await pool.query(
      `
      INSERT INTO phone_verification_otps
      (phone_number, otp_code, expires_at, is_used)
      VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '10 minutes', FALSE)
      `,
      [cleanPhone, otp]
    );

    console.log(`Register OTP for ${cleanPhone}: ${otp}`);

    return res.status(200).json({
      ok: true,
      message: "OTP sent successfully. Please verify your phone number.",
    });
  } catch (error) {
    console.error("sendRegisterOtp error:", error);

    return res.status(500).json({
      ok: false,
      message: "Server error while sending register OTP.",
      error: error.message,
    });
  }
}

// =========================
// VERIFY REGISTER PHONE OTP
// =========================
export async function verifyRegisterOtp(req, res) {
  const client = await pool.connect();

  try {
    const { phone_number, otp_code } = req.body;

    if (!phone_number || !otp_code) {
      return res.status(400).json({
        ok: false,
        message: "Phone number and OTP are required.",
      });
    }

    const cleanPhone = String(phone_number).trim();
    const cleanOtp = String(otp_code).trim();

    if (!PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({
        ok: false,
        message: "Phone number must be a valid 10-digit Nepal mobile number.",
      });
    }

    await client.query("BEGIN");
    await cleanupExpiredPhoneOtps(client);

    const otpResult = await client.query(
      `
      SELECT *
      FROM phone_verification_otps
      WHERE phone_number = $1
        AND otp_code = $2
        AND is_used = FALSE
        AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [cleanPhone, cleanOtp]
    );

    if (otpResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        ok: false,
        message: "Invalid or expired OTP.",
      });
    }

    const otpRow = otpResult.rows[0];

    await client.query(
      `
      UPDATE phone_verification_otps
      SET is_used = TRUE
      WHERE id = $1
      `,
      [otpRow.id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      ok: true,
      message: "Phone number verified successfully.",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("verifyRegisterOtp error:", error);

    return res.status(500).json({
      ok: false,
      message: "Server error while verifying OTP.",
      error: error.message,
    });
  } finally {
    client.release();
  }
}

// =========================
// SEND REGISTER EMAIL OTP
// =========================
export async function sendRegisterEmailOtp(req, res) {
  try {
    const { email, full_name } = req.body;

    if (!email) {
      return res.status(400).json({
        ok: false,
        message: "Email is required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        ok: false,
        message: "Please enter a valid email address.",
      });
    }

    await cleanupExpiredRegisterEmailOtps();

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "Email is already registered.",
      });
    }

    const otp = generateOTP(6);

    await pool.query(
      `
      UPDATE register_email_otps
      SET is_used = TRUE
      WHERE email = $1
        AND is_used = FALSE
      `,
      [cleanEmail]
    );

    await pool.query(
      `
      INSERT INTO register_email_otps (email, otp_code, expires_at, is_used)
      VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '10 minutes', FALSE)
      `,
      [cleanEmail, otp]
    );

    await sendRegisterOtpEmail(cleanEmail, otp, full_name || "User");

    console.log(`Register Email OTP for ${cleanEmail}: ${otp}`);

    return res.status(200).json({
      ok: true,
      message: "OTP sent successfully to your email.",
    });
  } catch (error) {
    console.error("sendRegisterEmailOtp error:", error);

    return res.status(500).json({
      ok: false,
      message: "Server error while sending email OTP.",
      error: error.message,
    });
  }
}

// =========================
// VERIFY REGISTER EMAIL OTP
// =========================
export async function verifyRegisterEmailOtp(req, res) {
  const client = await pool.connect();

  try {
    const { email, otp_code } = req.body;

    if (!email || !otp_code) {
      return res.status(400).json({
        ok: false,
        message: "Email and OTP are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    await client.query("BEGIN");
    await cleanupExpiredRegisterEmailOtps(client);

    const otpResult = await client.query(
      `
      SELECT *
      FROM register_email_otps
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
      await client.query("ROLLBACK");
      return res.status(400).json({
        ok: false,
        message: "Invalid or expired OTP.",
      });
    }

    await client.query(
      `
      UPDATE register_email_otps
      SET is_used = TRUE
      WHERE id = $1
      `,
      [otpResult.rows[0].id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      ok: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("verifyRegisterEmailOtp error:", error);

    return res.status(500).json({
      ok: false,
      message: "Server error while verifying email OTP.",
      error: error.message,
    });
  } finally {
    client.release();
  }
}

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

    if (!full_name || !email || !password || !confirm_password || !role) {
      return res.status(400).json({
        ok: false,
        message:
          "Full name, email, password, confirm password and role are required.",
      });
    }

    if (!phone_number) {
      return res.status(400).json({
        ok: false,
        message: "Phone number is required.",
      });
    }

    const cleanPhone = String(phone_number).trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({
        ok: false,
        message: "Phone number must be a valid 10-digit Nepal mobile number.",
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
          message:
            "Identification document image is required for helper registration.",
        });
      }
    }

    await cleanupExpiredPhoneOtps(client);
    await cleanupExpiredRegisterEmailOtps(client);

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

    const existingPhone = await client.query(
      `SELECT id FROM users WHERE phone_number = $1`,
      [cleanPhone]
    );

    if (existingPhone.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "Phone number already in use.",
      });
    }

    // Phone must be verified before registration
    // const verifiedPhoneOtpResult = await client.query(
    //   `
    //   SELECT id
    //   FROM phone_verification_otps
    //   WHERE phone_number = $1
    //     AND is_used = TRUE
    //   ORDER BY created_at DESC
    //   LIMIT 1
    //   `,
    //   [cleanPhone]
    // );

    // if (verifiedPhoneOtpResult.rows.length === 0) {
    //   return res.status(400).json({
    //     ok: false,
    //     message: "Please verify your phone number with OTP first.",
    //   });
    // }

    // Email must be verified before registration
    const verifiedEmailOtpResult = await client.query(
      `
      SELECT id
      FROM register_email_otps
      WHERE email = $1
        AND is_used = TRUE
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [cleanEmail]
    );

    if (verifiedEmailOtpResult.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Please verify your email with OTP first.",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    const userResult = await client.query(
      `
      INSERT INTO users
      (full_name, email, password_hash, role, phone_number, phone_verified, email_verified)
      VALUES ($1, $2, $3, $4, $5, FALSE, TRUE)
      RETURNING id, full_name, email, role, phone_number, profile_photo_url, is_active, created_at
      `,
      [full_name.trim(), cleanEmail, password_hash, role, cleanPhone]
    );

    const user = userResult.rows[0];

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
    try {
      await client.query("ROLLBACK");
    } catch {}
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

    await cleanupExpiredPasswordOtps();

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

    await client.query("BEGIN");
    await cleanupExpiredPasswordOtps(client);

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
      await client.query("ROLLBACK");
      return res.status(400).json({
        ok: false,
        message: "Invalid or expired OTP.",
      });
    }

    const otpRow = otpResult.rows[0];
    const password_hash = await bcrypt.hash(new_password, 10);

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
    try {
      await client.query("ROLLBACK");
    } catch {}
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
        message:
          "Current password, new password and confirm password are required.",
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