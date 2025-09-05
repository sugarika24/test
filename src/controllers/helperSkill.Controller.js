import { pool } from "../db/db.js";

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
    hourly_rate || null,
    fixed_rate || null,
    available ?? true,
  ]
);

    res.status(201).json({
      ok: true,
      skill: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(400).json({
        ok: false,
        message: "Skill already exists",
      });
    }

    res.status(500).json({
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

    res.json({
      ok: true,
      skills: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
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

    const result = await pool.query(
      `
      UPDATE helper_skills
      SET
        experience_years = COALESCE($1, experience_years),
        hourly_rate = COALESCE($2, hourly_rate),
        fixed_rate = COALESCE($3, fixed_rate),
        available = COALESCE($4, available)
      WHERE id = $5 AND helper_id = $6
      RETURNING *
      `,
      [experience_years, hourly_rate, fixed_rate, available, id, helperId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Skill not found",
      });
    }

    res.json({
      ok: true,
      skill: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
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

    res.json({
      ok: true,
      message: "Skill removed",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      message: "Failed to delete skill",
    });
  }
};