import prisma from "../db/config.js";
import { generateQuizQuestions } from "../services/quiz.service.js";

export const createQuiz = async (req, res) => {
  try {
    const { prompt } = req.body;

    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const result = await generateQuizQuestions(prompt);
    const questions = result.questions;

    if (!Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        error: "Generated questions are not in array format",
      });
    }

    const Data = await prisma.quiz.create({
      data: {
        userId: userId,
        title: prompt,
        questions: JSON.stringify(questions),
        correctAnswers: JSON.stringify(questions.map((q) => q.answer)),
      },
    });

    res.status(201).json({ success: true, data: Data });
  } catch (err) {
    console.error("Error creating quiz:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const qetAllQuiz = async (req, res) => {
    try {
        const quizzes = await prisma.quiz.findMany();
        res.status(200).json({ success: true, data: quizzes });
    } catch (err) {
        console.error("Error fetching quizzes:", err);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}

export const correctQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { option1, option2, option3, option4 } = req.body;
        const quiz = await prisma.quiz.findUnique({
            where: { id : id }
        });

        if (!quiz) {
            return res.status(404).json({ success: false, error: "Quiz not found" });
        }

        const correctAnswers = JSON.parse(quiz.correctAnswers);
        const userAnswers = [option1, option2, option3, option4];

        let score = 0;
        for (let i = 0; i < correctAnswers.length; i++) {
            if (correctAnswers[i] === userAnswers[i]) {
                score++;
            }
        }
        
        res.status(200).json({ success: true, score: score });
    } catch (err) {
        console.error("Error correcting quiz:", err);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}

export const deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        const quiz = await prisma.quiz.delete({
            where: { id: id }
        });

        if (!quiz) {
            return res.status(404).json({ success: false, error: "Quiz not found" });
        }

        res.status(200).json({ success: true, message: "Quiz deleted successfully" });
    } catch (err) {
        console.error("Error deleting quiz:", err);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}