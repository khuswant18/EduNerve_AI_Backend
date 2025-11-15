import express from "express";
import { register, login, logout } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register); // Add this for frontend compatibility
router.post("/login", login);
router.post("/logout", logout);

export default router;
