import { pool } from "../db/db.js";

// GET /api/categories/:id/subcategories
export const getSubcategoriesByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { sort } = req.query;

    let orderBy = "ss.display_order ASC, ss.name ASC";

    if (sort === "price_low") {
      orderBy = "ss.min_price ASC NULLS LAST";
    } else if (sort === "price_high") {
      orderBy = "ss.max_price DESC NULLS LAST";
    }

    const result = await pool.query(
      `
      SELECT
        ss.id,
        ss.category_id,
        ss.name,
        ss.slug,
        ss.description,
        ss.price_model,
        ss.base_price,
        ss.min_price,
        ss.max_price,
        ss.minimum_hours,
        ss.estimated_duration_min,
        ss.estimated_duration_max,
        ss.skill_level,
        ss.requires_verification,
        ss.icon,
        ss.is_active,
        ss.popular,
        ss.display_order,
        COUNT(DISTINCT hs.helper_id) FILTER (
          WHERE hs.available = true
          AND hs.verification_status = 'APPROVED'
        ) AS helper_count
      FROM service_subcategories ss
      LEFT JOIN helper_skills hs
        ON hs.subcategory_id = ss.id
      WHERE ss.category_id = $1
        AND ss.is_active = true
      GROUP BY ss.id
      ORDER BY ${orderBy}
      `,
      [id]
    );

    return res.status(200).json({
      ok: true,
      subcategories: result.rows,
    });
  } catch (error) {
    console.error("getSubcategoriesByCategory error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch subcategories",
    });
  }
};

// GET /api/subcategories/:id
export const getSubcategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        ss.*,
        sc.name AS category_name,
        sc.slug AS category_slug,
        COUNT(DISTINCT hs.helper_id) FILTER (
          WHERE hs.available = true
          AND hs.verification_status = 'APPROVED'
        ) AS helper_count
      FROM service_subcategories ss
      JOIN service_categories sc
        ON sc.id = ss.category_id
      LEFT JOIN helper_skills hs
        ON hs.subcategory_id = ss.id
      WHERE ss.id = $1
        AND ss.is_active = true
      GROUP BY ss.id, sc.name, sc.slug
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Subcategory not found",
      });
    }

    return res.status(200).json({
      ok: true,
      subcategory: result.rows[0],
    });
  } catch (error) {
    console.error("getSubcategoryById error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch subcategory",
    });
  }
};

// GET /api/subcategories/search?q=term
export const searchSubcategories = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        ok: false,
        message: "Search query is required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        ss.id,
        ss.category_id,
        ss.name,
        ss.slug,
        ss.description,
        ss.price_model,
        ss.base_price,
        ss.min_price,
        ss.max_price,
        ss.minimum_hours,
        ss.estimated_duration_min,
        ss.estimated_duration_max,
        ss.skill_level,
        ss.icon,
        ss.popular,
        sc.name AS category_name,
        COUNT(DISTINCT hs.helper_id) FILTER (
          WHERE hs.available = true
          AND hs.verification_status = 'APPROVED'
        ) AS helper_count
      FROM service_subcategories ss
      JOIN service_categories sc
        ON sc.id = ss.category_id
      LEFT JOIN helper_skills hs
        ON hs.subcategory_id = ss.id
      WHERE ss.is_active = true
        AND (
          LOWER(ss.name) LIKE LOWER($1)
          OR LOWER(COALESCE(ss.description, '')) LIKE LOWER($1)
          OR LOWER(sc.name) LIKE LOWER($1)
        )
      GROUP BY ss.id, sc.name
      ORDER BY ss.popular DESC, ss.display_order ASC, ss.name ASC
      `,
      [`%${q}%`]
    );

    return res.status(200).json({
      ok: true,
      subcategories: result.rows,
    });
  } catch (error) {
    console.error("searchSubcategories error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to search subcategories",
    });
  }
};

// GET /api/subcategories/popular
export const getPopularSubcategories = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        ss.id,
        ss.category_id,
        ss.name,
        ss.slug,
        ss.description,
        ss.price_model,
        ss.base_price,
        ss.min_price,
        ss.max_price,
        ss.minimum_hours,
        ss.estimated_duration_min,
        ss.estimated_duration_max,
        ss.skill_level,
        ss.icon,
        ss.popular,
        sc.name AS category_name,
        COUNT(DISTINCT hs.helper_id) FILTER (
          WHERE hs.available = true
          AND hs.verification_status = 'APPROVED'
        ) AS helper_count
      FROM service_subcategories ss
      JOIN service_categories sc
        ON sc.id = ss.category_id
      LEFT JOIN helper_skills hs
        ON hs.subcategory_id = ss.id
      WHERE ss.is_active = true
        AND ss.popular = true
      GROUP BY ss.id, sc.name
      ORDER BY ss.display_order ASC, ss.name ASC
      `
    );

    return res.status(200).json({
      ok: true,
      subcategories: result.rows,
    });
  } catch (error) {
    console.error("getPopularSubcategories error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch popular subcategories",
    });
  }
};