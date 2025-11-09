import express from "express";
import {
  getLearningProfile,
  getQuickSummary,
  getPerformanceTrends,
  getDashboard,
} from "../controllers/learning-profile.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.get("/profile", authenticate, getLearningProfile);
router.get("/quick-summary", authenticate, getQuickSummary);
router.get("/trends", authenticate, getPerformanceTrends);
router.get("/dashboard", authenticate, getDashboard);

export default router;
