import express from "express";
import interviewRoutes from "./interview.routes.js";
import authRoutes from "./auth.routes.js";
import quizRoutes from "./quiz.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/interview", interviewRoutes);
router.use("/quiz", quizRoutes);


export default router;
