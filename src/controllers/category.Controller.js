import { pool } from "../db/db.js";

// GET /api/categories
export const getAllCategories = async (req, res) => {
  try {
    const { search, featured } = req.query;

    let query = `
      SELECT
        sc.id,
        sc.name,
        sc.slug,
        sc.description,
        sc.icon,
        sc.color,
        sc.display_order,
        sc.is_active,
        sc.is_featured,
        sc.created_at,
        COUNT(DISTINCT hs.helper_id) FILTER (
          WHERE hs.available = true
          AND hs.verification_status = 'APPROVED'
        ) AS helper_count
      FROM service_categories sc
      LEFT JOIN service_subcategories ss
        ON ss.category_id = sc.id
        AND ss.is_active = true
      LEFT JOIN helper_skills hs
        ON hs.subcategory_id = ss.id
      WHERE sc.is_active = true
    `;

    const values = [];
    let paramIndex = 1;

    if (search) {
      query += `
        AND (
          LOWER(sc.name) LIKE LOWER($${paramIndex})
          OR LOWER(COALESCE(sc.description, '')) LIKE LOWER($${paramIndex})
        )
      `;
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (featured === "true") {
      query += ` AND sc.is_featured = true`;
    }

    query += `
      GROUP BY sc.id
      ORDER BY sc.display_order ASC, sc.name ASC
    `;

    const result = await pool.query(query, values);

    return res.status(200).json({
      ok: true,
      categories: result.rows,
    });
  } catch (error) {
    console.error("getAllCategories error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch categories",
    });
  }
};

// GET /api/categories/:id
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        sc.id,
        sc.name,
        sc.slug,
        sc.description,
        sc.icon,
        sc.color,
        sc.display_order,
        sc.is_active,
        sc.is_featured,
        sc.created_at,
        COUNT(DISTINCT hs.helper_id) FILTER (
          WHERE hs.available = true
          AND hs.verification_status = 'APPROVED'
        ) AS helper_count
      FROM service_categories sc
      LEFT JOIN service_subcategories ss
        ON ss.category_id = sc.id
        AND ss.is_active = true
      LEFT JOIN helper_skills hs
        ON hs.subcategory_id = ss.id
      WHERE sc.id = $1
        AND sc.is_active = true
      GROUP BY sc.id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      ok: true,
      category: result.rows[0],
    });
  } catch (error) {
    console.error("getCategoryById error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch category",
    });
  }
};