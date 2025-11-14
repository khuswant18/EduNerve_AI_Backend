import jwt from "jsonwebtoken";
import config from "../config/config.js";

export function authenticate(req, res, next) {
  try {
    // Check cookie first
    let token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. No token found."
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    console.log("✅ Token verified:", decoded.userId);

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || "Invalid or expired token"
    });
  }
}