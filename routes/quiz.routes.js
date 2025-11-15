import express from "express";
import {createQuiz , qetAllQuiz , correctQuiz , deleteQuiz  , getQuizById} from "../controllers/quiz.controller.js";
import {authenticate} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create_quiz", authenticate, createQuiz);

router.get("/quizzes", authenticate, qetAllQuiz);

router.get("/quiz/:id", authenticate, getQuizById);

router.post("/correct_quiz/:id", authenticate, correctQuiz);

router.delete("/delete_quiz/:id", authenticate, deleteQuiz);

export default router;
