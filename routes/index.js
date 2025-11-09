import express from "express";
import interviewRoutes from "./interview.routes.js";
import quizRoutes from "./quiz.routes.js";
import authRoutes from "./auth.routes.js";
import learningProfileRoutes from "./learning-profile.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/interview", interviewRoutes);
router.use("/quiz", quizRoutes);
router.use("/learning-profile", learningProfileRoutes);

export default router;
