export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        ok: false,
        message: "Access denied. Admin only.",
      });
    }

    next();
  } catch (error) {
    console.error("requireAdmin error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error",
    });
  }
};