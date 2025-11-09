import express from "express";
import {
  // createQuiz,
  generateQuiz,
  saveQuizResult,
  getAllQuizzes,
  getQuizById,
  deleteQuiz,
  submitQuizWithFeedback,
  getQuizHistory,
  getQuizResultById,
  getQuizStatistics,
  saveQuizSet,
  getQuizSets,
  getQuizSetById,
  deleteQuizSet,
  saveQuizResultWithSet,
} from "../controllers/quiz.controller.js";
import { authenticate, optionalAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// AI quiz generation
router.post("/generate-quiz", generateQuiz);
router.post("/generate", generateQuiz);

// Quiz Set operations (NEW)
router.post("/save-set", authenticate, saveQuizSet);
router.get("/sets", optionalAuth, getQuizSets);
router.get("/set/:id", optionalAuth, getQuizSetById);
router.delete("/set/:id", authenticate, deleteQuizSet);

// Quiz CRUD operations (old individual questions)
// router.post("/quizzes", authenticate, createQuiz);
router.get("/quizzes", getAllQuizzes);
router.get("/quizzes/:id", getQuizById);
router.delete("/quizzes/:id", authenticate, deleteQuiz);

// Quiz results operations
router.post("/result", authenticate, saveQuizResultWithSet); // NEW - with quiz set
router.get("/results", authenticate, getQuizHistory);
router.post("/quiz-results", authenticate, saveQuizResult);
router.get("/quiz-results", authenticate, getQuizHistory);
router.get("/quiz-results/:id", authenticate, getQuizResultById);

// Additional features
router.post("/submit-with-feedback", optionalAuth, submitQuizWithFeedback);
router.get("/statistics", authenticate, getQuizStatistics);

// Legacy routes
// router.post("/save", authenticate, createQuiz);
router.get("/all", getAllQuizzes);
router.post("/submit", authenticate, saveQuizResult);
router.get("/history", authenticate, getQuizHistory);
router.get("/result/:id", authenticate, getQuizResultById);

export default router;