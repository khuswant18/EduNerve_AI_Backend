import jwt from "jsonwebtoken";
import config from "../config/config.js";

export function authenticate(req, res, next) {
  try {
    // Check cookie first
    let token = req.cookies?.token;

    // Fallback to Authorization header if no cookie
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. No token found.",
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    console.log("✅ Token verified for user:", decoded.userId);

    next();
  } catch (error) {
    console.error("❌ Authentication error:", error.message);
    return res.status(401).json({
      success: false,
      error: error.message || "Invalid or expired token",
    });
  }
}
