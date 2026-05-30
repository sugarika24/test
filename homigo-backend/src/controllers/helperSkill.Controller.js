import { pool } from "../db/db.js";

async function validateHelperPrice(subcategoryId, hourlyRate, fixedRate) {
  const subcategoryResult = await pool.query(
    `
    SELECT id, name, price_model, base_price, min_price, max_price
    FROM service_subcategories
    WHERE id = $1 AND is_active = true
    `,
    [subcategoryId]
  );

  if (subcategoryResult.rows.length === 0) {
    return {
      ok: false,
      message: "Selected service subcategory not found or inactive",
    };
  }

  const subcategory = subcategoryResult.rows[0];

  const priceModel = String(subcategory.price_model || "").toUpperCase();
  const minPrice = Number(subcategory.min_price || 0);
  const maxPrice = Number(subcategory.max_price || 0);

  const enteredPrice =
    priceModel === "HOURLY" ? Number(hourlyRate || 0) : Number(fixedRate || 0);

  if (!enteredPrice || enteredPrice <= 0) {
    return {
      ok: false,
      message:
        priceModel === "HOURLY"
          ? "Hourly rate is required for hourly service"
          : "Fixed rate is required for fixed price service",
    };
  }

  if (minPrice > 0 && enteredPrice < minPrice) {
    return {
      ok: false,
      message: `Price cannot be less than Rs. ${minPrice}`,
    };
  }

  if (maxPrice > 0 && enteredPrice > maxPrice) {
    return {
      ok: false,
      message: `Price cannot be more than Rs. ${maxPrice}`,
    };
  }

  return {
    ok: true,
    subcategory,
    priceModel,
    enteredPrice,
  };
}

export const addHelperSkill = async (req, res) => {
  try {
    const helperId = req.user.id;

    if (req.user.role !== "HELPER") {
      return res.status(403).json({
        ok: false,
        message: "Only helpers can add skills",
      });
    }

    const {
      subcategory_id,
      experience_years,
      hourly_rate,
      fixed_rate,
      available,
    } = req.body;

    if (!subcategory_id) {
      return res.status(400).json({
        ok: false,
        message: "subcategory_id is required",
      });
    }

    const validation = await validateHelperPrice(
      subcategory_id,
      hourly_rate,
      fixed_rate
    );

    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        message: validation.message,
      });
    }

    const isHourly = validation.priceModel === "HOURLY";

    const result = await pool.query(
      `
      INSERT INTO helper_skills
      (
        helper_id,
        subcategory_id,
        experience_years,
        hourly_rate,
        fixed_rate,
        available,
        verification_status
      )
      VALUES ($1,$2,$3,$4,$5,$6,'APPROVED')
      RETURNING *
      `,
      [
        helperId,
        subcategory_id,
        experience_years || 0,
        isHourly ? validation.enteredPrice : null,
        isHourly ? null : validation.enteredPrice,
        available ?? true,
      ]
    );

    return res.status(201).json({
      ok: true,
      message: "Skill added successfully",
      skill: result.rows[0],
    });
  } catch (error) {
    console.error("addHelperSkill error:", error);

    if (error.code === "23505") {
      return res.status(400).json({
        ok: false,
        message: "Skill already exists",
      });
    }

    return res.status(500).json({
      ok: false,
      message: "Failed to add skill",
    });
  }
};

export const getMyHelperSkills = async (req, res) => {
  try {
    const helperId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        hs.*,
        ss.name AS subcategory_name,
        ss.price_model,
        ss.base_price,
        ss.min_price,
        ss.max_price,
        sc.name AS category_name
      FROM helper_skills hs
      JOIN service_subcategories ss
        ON ss.id = hs.subcategory_id
      JOIN service_categories sc
        ON sc.id = ss.category_id
      WHERE hs.helper_id = $1
      ORDER BY hs.created_at DESC
      `,
      [helperId]
    );

    return res.json({
      ok: true,
      skills: result.rows,
    });
  } catch (error) {
    console.error("getMyHelperSkills error:", error);

    return res.status(500).json({
      ok: false,
      message: "Failed to fetch skills",
    });
  }
};

export const updateHelperSkill = async (req, res) => {
  try {
    const helperId = req.user.id;
    const { id } = req.params;

    const { experience_years, hourly_rate, fixed_rate, available } = req.body;

    const skillResult = await pool.query(
      `
      SELECT 
        hs.*,
        ss.price_model,
        ss.min_price,
        ss.max_price
      FROM helper_skills hs
      JOIN service_subcategories ss
        ON ss.id = hs.subcategory_id
      WHERE hs.id = $1 AND hs.helper_id = $2
      `,
      [id, helperId]
    );

    if (skillResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Skill not found",
      });
    }

    const currentSkill = skillResult.rows[0];
    const priceModel = String(currentSkill.price_model || "").toUpperCase();

    const nextHourlyRate =
      hourly_rate !== undefined ? hourly_rate : currentSkill.hourly_rate;

    const nextFixedRate =
      fixed_rate !== undefined ? fixed_rate : currentSkill.fixed_rate;

    const validation = await validateHelperPrice(
      currentSkill.subcategory_id,
      nextHourlyRate,
      nextFixedRate
    );

    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        message: validation.message,
      });
    }

    const isHourly = priceModel === "HOURLY";

    const result = await pool.query(
      `
      UPDATE helper_skills
      SET
        experience_years = COALESCE($1, experience_years),
        hourly_rate = $2,
        fixed_rate = $3,
        available = COALESCE($4, available)
      WHERE id = $5 AND helper_id = $6
      RETURNING *
      `,
      [
        experience_years,
        isHourly ? validation.enteredPrice : null,
        isHourly ? null : validation.enteredPrice,
        available,
        id,
        helperId,
      ]
    );

    return res.json({
      ok: true,
      message: "Skill updated successfully",
      skill: result.rows[0],
    });
  } catch (error) {
    console.error("updateHelperSkill error:", error);

    return res.status(500).json({
      ok: false,
      message: "Failed to update skill",
    });
  }
};

export const deleteHelperSkill = async (req, res) => {
  try {
    const helperId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM helper_skills
      WHERE id = $1 AND helper_id = $2
      RETURNING *
      `,
      [id, helperId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Skill not found",
      });
    }

    return res.json({
      ok: true,
      message: "Skill removed",
    });
  } catch (error) {
    console.error("deleteHelperSkill error:", error);

    return res.status(500).json({
      ok: false,
      message: "Failed to delete skill",
    });
  }
};