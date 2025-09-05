import { pool } from "../db/db.js";

// ======================================
// GET MY PROFILE
// Works for both USER and HELPER
// ======================================
export async function getMyProfile(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        id,
        full_name,
        email,
        role,
        phone_number,
        profile_photo_url,
        address,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Profile not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("getMyProfile error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while fetching profile.",
      error: error.message,
    });
  }
}

// ======================================
// UPDATE MY PROFILE
// Works for both USER and HELPER
// ======================================
export async function updateMyProfile(req, res) {
  try {
    const userId = req.user.id;
    const { full_name, phone_number, profile_photo_url, address } = req.body;

    const existingUserResult = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [userId]
    );

    if (existingUserResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    const existingUser = existingUserResult.rows[0];

    if (phone_number && phone_number !== existingUser.phone_number) {
      const phoneCheck = await pool.query(
        `SELECT id FROM users WHERE phone_number = $1 AND id <> $2`,
        [phone_number, userId]
      );

      if (phoneCheck.rows.length > 0) {
        return res.status(409).json({
          ok: false,
          message: "Phone number already in use.",
        });
      }
    }

    const updatedResult = await pool.query(
      `
      UPDATE users
      SET
        full_name = $1,
        phone_number = $2,
        profile_photo_url = $3,
        address = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING
        id,
        full_name,
        email,
        role,
        phone_number,
        profile_photo_url,
        address,
        is_active,
        created_at,
        updated_at
      `,
      [
        full_name ?? existingUser.full_name,
        phone_number ?? existingUser.phone_number,
        profile_photo_url ?? existingUser.profile_photo_url,
        address ?? existingUser.address,
        userId,
      ]
    );

    return res.status(200).json({
      ok: true,
      message: "Profile updated successfully.",
      profile: updatedResult.rows[0],
    });
  } catch (error) {
    console.error("updateMyProfile error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while updating profile.",
      error: error.message,
    });
  }
}

// ======================================
// UPLOAD PROFILE PHOTO
// Works for both USER and HELPER
// ======================================
export async function uploadProfilePhoto(req, res) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "No image uploaded.",
      });
    }

    const profile_photo_url = `/uploads/${req.file.filename}`;

    const result = await pool.query(
      `
      UPDATE users
      SET profile_photo_url = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        full_name,
        email,
        role,
        phone_number,
        profile_photo_url,
        address,
        is_active,
        created_at,
        updated_at
      `,
      [profile_photo_url, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Profile photo uploaded successfully.",
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("uploadProfilePhoto error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while uploading profile photo.",
      error: error.message,
    });
  }
}

// ======================================
// DEACTIVATE MY ACCOUNT
// ======================================
export async function deactivateMyAccount(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      UPDATE users
      SET is_active = FALSE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, full_name, email, role, is_active
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Account deactivated successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("deactivateMyAccount error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while deactivating account.",
      error: error.message,
    });
  }
}

// ======================================
// DELETE MY ACCOUNT
// ======================================
export async function deleteMyAccount(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      DELETE FROM users
      WHERE id = $1
      RETURNING id, full_name, email, role
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Account deleted successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("deleteMyAccount error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while deleting account.",
      error: error.message,
    });
  }
}

// ======================================
// GET HELPER PROFILE
// Only for HELPER
// ======================================
export async function getMyHelperProfile(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== "HELPER") {
      return res.status(403).json({
        ok: false,
        message: "Only helper accounts can access helper profile.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.phone_number,
        u.profile_photo_url,
        u.address,
        u.is_active,
        u.created_at,
        hp.bio,
        hp.hourly_rate,
        hp.category_id,
        hp.is_available,
        hp.avg_rating,
        hp.rating_count,
        hp.completed_jobs_count,
        hp.experience_years,
        hp.verification_status,
        hp.is_verified,
        hp.verified_at,
        hp.rejection_reason,
        sc.name AS category_name
      FROM users u
      JOIN helper_profiles hp ON hp.user_id = u.id
      LEFT JOIN service_categories sc ON sc.id = hp.category_id
      WHERE u.id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Helper profile not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("getMyHelperProfile error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while fetching helper profile.",
      error: error.message,
    });
  }
}

// ======================================
// UPDATE HELPER PROFILE
// Only for HELPER
export async function updateMyHelperProfile(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { bio, hourly_rate, category_id, is_available, experience_years } = req.body;

    if (userRole !== "HELPER") {
      return res.status(403).json({
        ok: false,
        message: "Only helper accounts can update helper profile.",
      });
    }

    const helperResult = await pool.query(
      `SELECT * FROM helper_profiles WHERE user_id = $1`,
      [userId]
    );

    if (helperResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Helper profile not found.",
      });
    }

    const existingHelper = helperResult.rows[0];

    // BLOCK availability ON if helper is not approved
    if (is_available === true) {
      if (
        existingHelper.verification_status !== "APPROVED" ||
        existingHelper.is_verified !== true
      ) {
        return res.status(403).json({
          ok: false,
          message: "You cannot become available until admin approves your helper account.",
        });
      }
    }

    if (category_id !== undefined && category_id !== null) {
      const categoryCheck = await pool.query(
        `SELECT id FROM service_categories WHERE id = $1`,
        [category_id]
      );

      if (categoryCheck.rows.length === 0) {
        return res.status(400).json({
          ok: false,
          message: "Invalid category_id.",
        });
      }
    }

    const updatedResult = await pool.query(
      `
      UPDATE helper_profiles
      SET
        bio = $1,
        hourly_rate = $2,
        category_id = $3,
        is_available = $4,
        experience_years = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $6
      RETURNING
        id,
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
        is_verified,
        verified_by,
        verified_at,
        rejection_reason,
        created_at,
        updated_at
      `,
      [
        bio ?? existingHelper.bio,
        hourly_rate ?? existingHelper.hourly_rate,
        category_id !== undefined ? category_id : existingHelper.category_id,
        is_available ?? existingHelper.is_available,
        experience_years ?? existingHelper.experience_years,
        userId,
      ]
    );

    return res.status(200).json({
      ok: true,
      message: "Helper profile updated successfully.",
      helper_profile: updatedResult.rows[0],
    });
  } catch (error) {
    console.error("updateMyHelperProfile error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error while updating helper profile.",
      error: error.message,
    });
  }
}