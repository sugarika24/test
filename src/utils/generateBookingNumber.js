export const generateBookingNumber = async (pool) => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const datePart = `${y}${m}${d}`;

  const query = `
    SELECT COUNT(*)::int AS total
    FROM bookings
    WHERE DATE(created_at) = CURRENT_DATE
  `;

  const { rows } = await pool.query(query);
  const next = String(rows[0].total + 1).padStart(5, "0");

  return `HOM-${datePart}-${next}`;
};