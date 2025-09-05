import {pool} from "../db/db.js";

const createNotification = async ({
  user_id,
  title,
 message,
  type,
  ref_table = null,
  ref_id = null,
}) => {
  try {
    await pool.query(
      `
      INSERT INTO notifications (user_id, title, message, type, ref_table, ref_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [user_id, title, message, type, ref_table, ref_id]
    );
  } catch (error) {
    console.error("createNotification error:", error.message);
  }
};

export default createNotification;