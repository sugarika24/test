import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function connectDatabase() {
  try {
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_PORT:", process.env.DB_PORT);
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_PASSWORD type:", typeof process.env.DB_PASSWORD);
    console.log("DB_NAME:", process.env.DB_NAME);

    const result = await pool.query("SELECT NOW()");
    console.log("Database connected successfully");
    console.log("DB Time:", result.rows[0].now);
  } catch (error) {
    console.error("Database connection failed");
    console.error(error.message);
    process.exit(1);
  }
}