import { pool } from "../db/db.js";

// GET /api/helpers
export const getHelpers = async (req, res) => {
  try {
    const { subcategory_id, category_id, search } = req.query;
let query = `
  SELECT
    u.id,
    u.full_name,
    u.profile_photo_url,
    u.address,
    hp.bio,
    hp.is_available AS helper_available,
    hp.avg_rating,
    hp.rating_count,
    hp.completed_jobs_count,
    hs.id AS helper_skill_id,
    hs.subcategory_id,
    hs.experience_years,
    hs.hourly_rate,
    hs.fixed_rate,
    hs.available AS skill_available,
    hs.total_jobs_completed,
    hs.average_rating,
    ss.name AS subcategory_name,
    ss.slug AS subcategory_slug,
    sc.id AS category_id,
    sc.name AS category_name,
    sc.slug AS category_slug
  FROM helper_skills hs
  JOIN users u
    ON u.id = hs.helper_id
  JOIN helper_profiles hp
    ON hp.user_id = u.id
  JOIN service_subcategories ss
    ON ss.id = hs.subcategory_id
  JOIN service_categories sc
    ON sc.id = ss.category_id
  WHERE u.role = 'HELPER'
    AND u.is_active = true
    AND hp.verification_status = 'APPROVED'
    AND hp.is_verified = true
    AND hp.is_available = true
    AND hs.available = true
    AND ss.is_active = true
    AND sc.is_active = true
`;

    const values = [];
    let paramIndex = 1;

    if (subcategory_id) {
      query += ` AND hs.subcategory_id = $${paramIndex}`;
      values.push(subcategory_id);
      paramIndex++;
    }

    if (category_id) {
      query += ` AND sc.id = $${paramIndex}`;
      values.push(category_id);
      paramIndex++;
    }

    if (search) {
      query += `
        AND (
          LOWER(u.full_name) LIKE LOWER($${paramIndex})
          OR LOWER(COALESCE(hp.bio, '')) LIKE LOWER($${paramIndex})
          OR LOWER(ss.name) LIKE LOWER($${paramIndex})
          OR LOWER(sc.name) LIKE LOWER($${paramIndex})
        )
      `;
      values.push(`%${search}%`);
      paramIndex++;
    }

    query += `
      ORDER BY
        hp.avg_rating DESC,
        hp.completed_jobs_count DESC,
        hs.experience_years DESC,
        u.full_name ASC
    `;

    const result = await pool.query(query, values);

    const rows = result.rows;

const helpersMap = {};

rows.forEach((row) => {
  if (!helpersMap[row.id]) {
    helpersMap[row.id] = {
      id: row.id,
      full_name: row.full_name,
      profile_photo_url: row.profile_photo_url,
      address: row.address,
      bio: row.bio,
      helper_available: row.helper_available,
      avg_rating: row.avg_rating,
      rating_count: row.rating_count,
      completed_jobs_count: row.completed_jobs_count,
      skills: [],
    };
  }

  helpersMap[row.id].skills.push({
    helper_skill_id: row.helper_skill_id,
    subcategory_id: row.subcategory_id,
    subcategory_name: row.subcategory_name,
    category_id: row.category_id,
    category_name: row.category_name,
    experience_years: row.experience_years,
    hourly_rate: row.hourly_rate,
    fixed_rate: row.fixed_rate,
  });
});

const helpers = Object.values(helpersMap);

    return res.status(200).json({
      ok: true,
      helpers: helpers,
    });
  } catch (error) {
    console.error("getHelpers error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch helpers",
      error: error.message,
    });
  }
};

// GET /api/helpers/:helperId
export const getHelperById = async (req, res) => {
  try {
    const { helperId } = req.params;

    const helperResult = await pool.query(
      `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone_number,
        u.profile_photo_url,
        u.address,
        u.created_at,
        hp.bio,
        hp.is_available,
        hp.avg_rating,
        hp.rating_count,
        hp.completed_jobs_count,
        hp.experience_years,
        hp.verification_status,
        hp.is_verified
      FROM users u
      JOIN helper_profiles hp
        ON hp.user_id = u.id
      WHERE u.id = $1
        AND u.role = 'HELPER'
        AND u.is_active = true
        AND hp.verification_status = 'APPROVED'
        AND hp.is_verified = true
      `,
      [helperId]
    );

    if (helperResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Helper not found",
      });
    }

    const skillsResult = await pool.query(
  `
  SELECT
    hs.id,
    hs.subcategory_id,
    hs.experience_years,
    hs.hourly_rate,
    hs.fixed_rate,
    hs.available,
    hs.total_jobs_completed,
    hs.average_rating,
    ss.name AS subcategory_name,
    ss.slug AS subcategory_slug,
    ss.description AS subcategory_description,
    ss.price_model,
    sc.id AS category_id,
    sc.name AS category_name,
    sc.slug AS category_slug
  FROM helper_skills hs
  JOIN service_subcategories ss
    ON ss.id = hs.subcategory_id
  JOIN service_categories sc
    ON sc.id = ss.category_id
  WHERE hs.helper_id = $1
    AND hs.available = true
    AND ss.is_active = true
    AND sc.is_active = true
  ORDER BY sc.name ASC, ss.name ASC
  `,
  [helperId]
);

    return res.status(200).json({
      ok: true,
      helper: helperResult.rows[0],
      skills: skillsResult.rows,
    });
  } catch (error) {
    console.error("getHelperById error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch helper details",
      error: error.message,
    });
  }
};