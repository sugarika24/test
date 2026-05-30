import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: "Invalid or expired token.",
    });
  }
}

export function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized.",
      });
    }

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        ok: false,
        message: "Admin access required.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Authorization error.",
    });
  }
}