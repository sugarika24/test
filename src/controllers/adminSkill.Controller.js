import { pool } from "../db/db.js";

function makeSlug(text = "") {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function getAllSkills(req, res) {
  try {
    const { category_id, is_active } = req.query;

    const values = [];
    const conditions = [];

    if (category_id) {
      values.push(Number(category_id));
      conditions.push(`ss.category_id = $${values.length}`);
    }

    if (typeof is_active !== "undefined") {
      values.push(is_active === "true");
      conditions.push(`ss.is_active = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const result = await pool.query(
      `
      SELECT
        ss.id,
        ss.category_id,
        sc.name AS category_name,
        ss.name,
        ss.slug,
        ss.description,
        ss.price_model,
        ss.base_price,
        ss.min_price,
        ss.max_price,
        ss.is_active,
        ss.created_at,
        ss.updated_at
      FROM service_subcategories ss
      JOIN service_categories sc ON sc.id = ss.category_id
      ${whereClause}
      ORDER BY sc.name ASC, ss.name ASC
      `,
      values
    );

    return res.status(200).json({
      ok: true,
      skills: result.rows,
    });
  } catch (error) {
    console.error("getAllSkills error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch skills",
    });
  }
}

export async function getSkillById(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        ss.id,
        ss.category_id,
        sc.name AS category_name,
        ss.name,
        ss.slug,
        ss.description,
        ss.price_model,
        ss.base_price,
        ss.min_price,
        ss.max_price,
        ss.is_active,
        ss.created_at,
        ss.updated_at
      FROM service_subcategories ss
      JOIN service_categories sc ON sc.id = ss.category_id
      WHERE ss.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Skill not found",
      });
    }

    return res.status(200).json({
      ok: true,
      skill: result.rows[0],
    });
  } catch (error) {
    console.error("getSkillById error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch skill",
    });
  }
}

export async function createSkill(req, res) {
  try {
    const {
      category_id,
      name,
      description,
      price_model,
      base_price,
      min_price,
      max_price,
      is_active,
    } = req.body;

    if (!category_id || !name?.trim()) {
      return res.status(400).json({
        ok: false,
        message: "category_id and name are required",
      });
    }

    const validPriceModels = ["fixed", "hourly", "variable"];
    const normalizedPriceModel = price_model
      ? String(price_model).toLowerCase()
      : "fixed";

    if (!validPriceModels.includes(normalizedPriceModel)) {
      return res.status(400).json({
        ok: false,
        message: "price_model must be one of: fixed, hourly, variable",
      });
    }

    const categoryCheck = await pool.query(
      `SELECT id, name FROM service_categories WHERE id = $1`,
      [category_id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Category not found",
      });
    }

    const duplicateCheck = await pool.query(
      `
      SELECT id
      FROM service_subcategories
      WHERE category_id = $1
        AND LOWER(name) = LOWER($2)
      `,
      [category_id, name.trim()]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "Skill with this name already exists in this category",
      });
    }

    let slug = makeSlug(name);

    if (!slug) {
      return res.status(400).json({
        ok: false,
        message: "Invalid skill name",
      });
    }

    const slugCheck = await pool.query(
      `SELECT id FROM service_subcategories WHERE slug = $1`,
      [slug]
    );

    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const result = await pool.query(
      `
      INSERT INTO service_subcategories (
        category_id,
        name,
        slug,
        description,
        price_model,
        base_price,
        min_price,
        max_price,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, true))
      RETURNING *
      `,
      [
        category_id,
        name.trim(),
        slug,
        description?.trim() || null,
        normalizedPriceModel,
        base_price ?? null,
        min_price ?? null,
        max_price ?? null,
        typeof is_active === "boolean" ? is_active : true,
      ]
    );

    return res.status(201).json({
      ok: true,
      message: "Skill created successfully",
      skill: result.rows[0],
    });
  } catch (error) {
    console.error("createSkill error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to create skill",
      error: error.message,
    });
  }
}

export async function updateSkill(req, res) {
  try {
    const { id } = req.params;
    const {
      category_id,
      name,
      description,
      price_model,
      base_price,
      min_price,
      max_price,
      is_active,
    } = req.body;

    const existingResult = await pool.query(
      `SELECT * FROM service_subcategories WHERE id = $1`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Skill not found",
      });
    }

    const existing = existingResult.rows[0];

    const nextCategoryId = category_id ?? existing.category_id;
    const nextName = name?.trim() || existing.name;
    const nextDescription =
      typeof description === "string" ? description.trim() : existing.description;
    const nextPriceModel = price_model
      ? String(price_model).toLowerCase()
      : existing.price_model;
    const nextBasePrice =
      typeof base_price !== "undefined" ? base_price : existing.base_price;
    const nextMinPrice =
      typeof min_price !== "undefined" ? min_price : existing.min_price;
    const nextMaxPrice =
      typeof max_price !== "undefined" ? max_price : existing.max_price;
    const nextIsActive =
      typeof is_active === "boolean" ? is_active : existing.is_active;

    const validPriceModels = ["fixed", "hourly", "variable"];
    if (!validPriceModels.includes(nextPriceModel)) {
      return res.status(400).json({
        ok: false,
        message: "price_model must be one of: fixed, hourly, variable",
      });
    }

    const categoryCheck = await pool.query(
      `SELECT id FROM service_categories WHERE id = $1`,
      [nextCategoryId]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Category not found",
      });
    }

    const duplicateCheck = await pool.query(
      `
      SELECT id
      FROM service_subcategories
      WHERE category_id = $1
        AND LOWER(name) = LOWER($2)
        AND id <> $3
      `,
      [nextCategoryId, nextName, id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "Another skill with this name already exists in this category",
      });
    }

    let nextSlug = existing.slug;
    if (name && name.trim() !== existing.name) {
      nextSlug = makeSlug(nextName);

      const slugCheck = await pool.query(
        `
        SELECT id
        FROM service_subcategories
        WHERE slug = $1
          AND id <> $2
        `,
        [nextSlug, id]
      );

      if (slugCheck.rows.length > 0) {
        nextSlug = `${nextSlug}-${Date.now()}`;
      }
    }

    const result = await pool.query(
      `
      UPDATE service_subcategories
      SET
        category_id = $1,
        name = $2,
        slug = $3,
        description = $4,
        price_model = $5,
        base_price = $6,
        min_price = $7,
        max_price = $8,
        is_active = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
      `,
      [
        nextCategoryId,
        nextName,
        nextSlug,
        nextDescription,
        nextPriceModel,
        nextBasePrice,
        nextMinPrice,
        nextMaxPrice,
        nextIsActive,
        id,
      ]
    );

    return res.status(200).json({
      ok: true,
      message: "Skill updated successfully",
      skill: result.rows[0],
    });
  } catch (error) {
    console.error("updateSkill error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to update skill",
      error: error.message,
    });
  }
}

export async function toggleSkillStatus(req, res) {
  try {
    const { id } = req.params;

    const existingResult = await pool.query(
      `SELECT id, is_active FROM service_subcategories WHERE id = $1`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Skill not found",
      });
    }

    const current = existingResult.rows[0];

    const result = await pool.query(
      `
      UPDATE service_subcategories
      SET
        is_active = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [!current.is_active, id]
    );

    return res.status(200).json({
      ok: true,
      message: `Skill ${result.rows[0].is_active ? "activated" : "deactivated"} successfully`,
      skill: result.rows[0],
    });
  } catch (error) {
    console.error("toggleSkillStatus error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to update skill status",
      error: error.message,
    });
  }
}

export async function deleteSkill(req, res) {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        ok: false,
        message: "Valid skill id is required",
      });
    }

    await client.query("BEGIN");

    // 1. Check if skill exists
    const skillResult = await client.query(
      `
      SELECT id, name
      FROM service_subcategories
      WHERE id = $1
      `,
      [id]
    );

    if (skillResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        ok: false,
        message: "Skill not found",
      });
    }

    const skill = skillResult.rows[0];

    // 2. Check if used in helper_skills
    const helperSkillCheck = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM helper_skills
      WHERE subcategory_id = $1
      `,
      [id]
    );

    const helperSkillCount = helperSkillCheck.rows[0].count;

    if (helperSkillCount > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        ok: false,
        message: "Cannot delete skill because it is assigned to helpers",
        usage: {
          helper_skills: helperSkillCount,
        },
      });
    }

    // 3. Check if used in bookings
    const bookingCheck = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM bookings
      WHERE subcategory_id = $1
      `,
      [id]
    );

    const bookingCount = bookingCheck.rows[0].count;

    if (bookingCount > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        ok: false,
        message: "Cannot delete skill because it is already used in bookings",
        usage: {
          bookings: bookingCount,
        },
      });
    }

    // 4. Delete skill
    const deleteResult = await client.query(
      `
      DELETE FROM service_subcategories
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      ok: true,
      message: "Skill deleted successfully",
      skill: deleteResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("deleteSkill error:", error);

    return res.status(500).json({
      ok: false,
      message: "Failed to delete skill",
      error: error.message,
    });
  } finally {
    client.release();
  }
}