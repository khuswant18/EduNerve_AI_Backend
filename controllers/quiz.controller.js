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

    res.status(201).json({
      success: true,
      quiz: {
        ...Data,
        questions: JSON.parse(Data.questions),
        correctAnswers: JSON.parse(Data.correctAnswers),
      },
      id: Data.id, // Explicitly return the ID for frontend
    });
  } catch (err) {
    console.error("Error creating quiz:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const qetAllQuiz = async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany();
    const parsedQuizzes = quizzes.map((quiz) => ({
      ...quiz,
      questions: JSON.parse(quiz.questions),
      correctAnswers: JSON.parse(quiz.correctAnswers),
    }));
    res.status(200).json({ success: true, data: parsedQuizzes });
  } catch (err) {
    console.error("Error fetching quizzes:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const correctQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // frontend sends answers: []

    const quiz = await prisma.quiz.findUnique({
      where: { id: id },
    });

    if (!quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    const correctAnswers = JSON.parse(quiz.correctAnswers);
    let score = 0;

    for (let i = 0; i < correctAnswers.length; i++) {
      if (correctAnswers[i] === answers[i]) score++;
    }

    res.status(200).json({ success: true, score });
  } catch (err) {
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.delete({
      where: { id: id },
    });

    if (!quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Quiz deleted successfully" });
  } catch (err) {
    console.error("Error deleting quiz:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id: id },
    });

    if (!quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        ...quiz,
        questions: JSON.parse(quiz.questions),
        correctAnswers: JSON.parse(quiz.correctAnswers),
      },
    });
  } catch (err) {
    console.error("Error fetching quiz by ID:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
