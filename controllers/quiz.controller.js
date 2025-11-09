import prisma from "../db/config.js";
import {
  generateQuizQuestions,
  generateQuizWithFeedback,
} from "../services/quiz.service.js";

// export async function createQuiz(req, res, next) {
//   try {
//     const { prompt } = req.body;

//     if (!prompt) {
//       return res.status(400).json({
//         success: false,
//         error: "Prompt is required",
//       });
//     }

//     const quizData = await generateQuizQuestions(prompt);
//     console.log("Generated quiz data:", quizData);
//     const savedQuizzes = [];
//     for (const question of quizData.questions) {
//       const quiz = await prisma.quiz.create({
//         data: {
//           question: question.question,
//           options: question.options,
//           answer: question.answer,
//         },
//       });
//       savedQuizzes.push(quiz);
//     }

//     res.status(201).json({
//       success: true,
//       message: "Quiz created successfully",
//       prompt: prompt,
//       questions: quizData.questions,
//       savedQuizzes: savedQuizzes,
//     });
//   } catch (err) {
//     console.error("Error creating quiz:", err);
//     next(err);
//   }
// }

export async function generateQuiz(req, res, next) {
  try {
    const { prompt, numberOfQuestions } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    const numQuestions = numberOfQuestions || 10;

    console.log("🎯 Generating quiz with AI...");
    const quizData = await generateQuizQuestions(prompt, numQuestions);

    console.log(`✅ AI generated ${quizData.questions.length} questions`);
    console.log("💾 Saving questions to database...");

    // Save all generated questions to Quiz table
    const savedQuizzes = await Promise.all(
      quizData.questions.map(async (question) => {
        return await prisma.quiz.create({
          data: {
            question: question.question,
            options: question.options,
            answer: question.answer,
            category: prompt,
          },
        });
      })
    );

    console.log(`✅ Saved ${savedQuizzes.length} quiz questions to database`);

    res.status(200).json({
      success: true,
      message: "Quiz generated and saved successfully",
      questions: quizData.questions,
      total: quizData.questions.length,
      savedQuizIds: savedQuizzes.map(q => q.id), // Send back the IDs
      category: prompt,
    });
  } catch (err) {
    console.error("❌ Error generating quiz:", err);
    next(err);
  }
}

// ...existing code...

export async function saveQuizResult(req, res, next) {
  try {
    const { score, total, percentage, level} = req.body;
    const userId = req.user?.userId || null;
    
    console.log("💾 Saving quiz result for user:", userId);
    console.log("   Score:", score, "/", total);
    console.log("   Percentage:", percentage, "%");
    console.log("   Level:", level);

    if (score === undefined || !total || percentage === undefined || !level) {
      return res.status(400).json({
        success: false,
        error: "Score, total, percentage, and level are required",
      });
    }

    const result = await prisma.quizResult.create({
      data: {
        userId,
        score,
        total,
        percentage,
        level,
      },
    });

    console.log("✅ Quiz result saved with ID:", result.id);

    res.status(201).json({
      success: true,
      message: "Quiz result saved successfully",
      result,
    });
  } catch (err) {
    console.error("❌ Error saving quiz result:", err);
    next(err);
  }
}


export async function getAllQuizzes(req, res, next) {
  try {
    console.log("🔍 GET ALL QUIZZES CALLED - Fetching from Quiz table");
    
    const quizzes = await prisma.quiz.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ Retrieved ${quizzes.length} quiz questions from Quiz table`);
    console.log("📊 First quiz:", quizzes[0]);

    res.json({
      success: true,
      count: quizzes.length,
      results: quizzes,
    });
  } catch (err) {
    console.error("Error fetching quizzes:", err);
    next(err);
  }
}

export async function getQuizById(req, res, next) {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(id) },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found",
      });
    }

    res.json({
      success: true,
      quiz,
    });
  } catch (err) {
    console.error("Error fetching quiz:", err);
    next(err);
  }
}

export async function deleteQuiz(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.quiz.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting quiz:", err);
    next(err);
  }
}

export async function submitQuizWithFeedback(req, res, next) {
  try {
    const { prompt, answers, questions } = req.body;
    const userId = req.user?.userId || null;

    console.log("📝 Quiz submission received:");
    console.log("   User ID:", userId || "Anonymous");
    console.log("   Prompt:", prompt);
    console.log("   Answers count:", answers?.length || 0);

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Answers array is required and must not be empty",
      });
    }

    // Validate answers structure
    const isValidStructure = answers.every(
      (ans) =>
        ans.question &&
        ans.userAnswer !== undefined &&
        ans.correctAnswer !== undefined &&
        ans.options &&
        Array.isArray(ans.options)
    );

    if (!isValidStructure) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid answers structure. Each answer must have: question, userAnswer, correctAnswer, options",
      });
    }

    console.log("✅ Validation passed, generating AI feedback...");

    // Generate AI feedback
    const feedbackData = await generateQuizWithFeedback(answers, prompt);

    console.log("✅ AI feedback generated");

    // Save quiz questions and results to database
    let savedQuizData = null;
    let savedResult = null;

    if (userId) {
      try {
        console.log("💾 Saving quiz data to database for user:", userId);

        // Step 1: Save individual quiz questions to Quiz table
        const savedQuestions = await Promise.all(
          answers.map(async (answer) => {
            return await prisma.quiz.create({
              data: {
                question: answer.question,
                options: answer.options,
                answer: answer.correctAnswer,
              },
            });
          })
        );

        console.log(`✅ Saved ${savedQuestions.length} quiz questions`);

        // Step 2: Save quiz result to QuizResult table
        savedResult = await prisma.quizResult.create({
          data: {
            userId,
            category: prompt,
            subtopics: feedbackData.weakAreas || [],
            score: feedbackData.correctAnswers,
            total: feedbackData.totalQuestions,
            percentage: feedbackData.percentage,
            level:
              feedbackData.percentage >= 80
                ? "advanced"
                : feedbackData.percentage >= 60
                ? "intermediate"
                : "beginner",
          },
        });

        console.log("✅ Quiz result saved with ID:", savedResult.id);

        // Step 3: Store detailed quiz attempt data
        savedQuizData = {
          quizResultId: savedResult.id,
          questions: savedQuestions.map((q, index) => ({
            id: q.id,
            question: q.question,
            userAnswer: answers[index].userAnswer,
            correctAnswer: q.answer,
            isCorrect: answers[index].userAnswer === answers[index].correctAnswer,
          })),
        };

        console.log("✅ Complete quiz data stored successfully");

      } catch (dbError) {
        console.error("❌ Database error while saving quiz:", dbError);
        // Continue even if save fails - still return feedback
      }
    } else {
      console.log("⚠️  Anonymous user - quiz data not saved to database");
    }

    res.status(200).json({
      success: true,
      message: userId 
        ? "Quiz submitted, feedback generated, and results saved successfully"
        : "Quiz submitted and feedback generated successfully (not saved - please login)",
      feedback: feedbackData,
      savedResult,
      savedQuizData,
      userAuthenticated: !!userId,
    });
  } catch (err) {
    console.error("❌ Error submitting quiz with feedback:", err);
    next(err);
  }
}

/**
 * Get quiz history for authenticated user
 */
export async function getQuizHistory(req, res, next) {
  try {
    const userId = req.user?.userId;

    console.log("🔍 GET QUIZ HISTORY CALLED - Fetching from QuizResult table");
    console.log("   User ID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const results = await prisma.quizResult.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    console.log(`✅ Retrieved ${results.length} quiz results for user:`, userId);

    res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (err) {
    console.error("Error fetching quiz history:", err);
    next(err);
  }
}

/**
 * Get specific quiz result by ID
 */
export async function getQuizResultById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const result = await prisma.quizResult.findFirst({
      where: {
        id: parseInt(id),
        userId, // Ensure user can only access their own results
      },
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Quiz result not found",
      });
    }

    res.json({
      success: true,
      result,
    });
  } catch (err) {
    console.error("Error fetching quiz result:", err);
    next(err);
  }
}

/**
 * Get quiz statistics for user
 */
export async function getQuizStatistics(req, res, next) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const results = await prisma.quizResult.findMany({
      where: { userId },
    });

    if (results.length === 0) {
      return res.json({
        success: true,
        message: "No quiz data available",
        statistics: {
          totalQuizzes: 0,
          averageScore: 0,
          averagePercentage: 0,
          totalQuestionsAnswered: 0,
          totalCorrectAnswers: 0,
          categoriesAttempted: [],
        },
      });
    }

    const statistics = {
      totalQuizzes: results.length,
      averageScore: (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(2),
      averagePercentage: (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2),
      totalQuestionsAnswered: results.reduce((sum, r) => sum + r.total, 0),
      totalCorrectAnswers: results.reduce((sum, r) => sum + r.score, 0),
      categoriesAttempted: [...new Set(results.map(r => r.category))],
      levelDistribution: {
        beginner: results.filter(r => r.level === 'beginner').length,
        intermediate: results.filter(r => r.level === 'intermediate').length,
        advanced: results.filter(r => r.level === 'advanced').length,
      },
      recentQuizzes: results.slice(0, 5).map(r => ({
        id: r.id,
        category: r.category,
        score: r.score,
        total: r.total,
        percentage: r.percentage,
        level: r.level,
        date: r.createdAt,
      })),
    };

    console.log("✅ Quiz statistics calculated for user:", userId);

    res.json({
      success: true,
      statistics,
    });
  } catch (err) {
    console.error("Error calculating quiz statistics:", err);
    next(err);
  }
}

// ...existing code...

export async function saveGeneratedQuiz(req, res, next) {
  try {
    const { questions, prompt } = req.body;
    console.log("Request body for saving generated quiz:", req.body);
    console.log("📝 SAVE REQUEST RECEIVED");
    console.log("   Request body:", JSON.stringify(req.body, null, 2));
    console.log("   Questions count:", questions?.length);
    console.log("   Prompt:", prompt);

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.log("❌ Validation failed: Questions array missing or empty");
      return res.status(400).json({
        success: false,
        error: "Questions array is required",
      });
    }

    // Validate question structure
    const isValid = questions.every(
      (q) => q.question && q.options && Array.isArray(q.options) && q.answer
    );

    if (!isValid) {
      console.log("❌ Validation failed: Invalid question structure");
      console.log("   First question:", questions[0]);
      return res.status(400).json({
        success: false,
        error: "Invalid question structure. Each question must have: question, options, answer",
      });
    }

    console.log("✅ Validation passed, saving to database...");

    // Save all questions to database
    const savedQuizzes = await Promise.all(
      questions.map(async (question) => {
        return await prisma.quiz.create({
          data: {
            question: question.question,
            options: question.options,
            answer: question.answer,
            category: prompt || "General",
          },
        });
      })
    );

    console.log(`✅ Saved ${savedQuizzes.length} quiz questions to database`);

    res.status(201).json({
      success: true,
      message: "Quiz saved successfully",
      count: savedQuizzes.length,
      results: savedQuizzes,
    });
  } catch (err) {
    console.error("❌ Error saving quiz:", err);
    next(err);
  }
}

// ...existing code...

// ...existing code...

/**
 * Save a complete quiz set with all questions
 */
export async function saveQuizSet(req, res, next) {
  try {
    const { title, topic, difficulty, numberOfQuestions, questions } = req.body;
    const userId = req.user?.userId || null;

    console.log("📝 Saving quiz set for user:", userId);
    console.log("📊 Quiz data:", { title, topic, difficulty, questionCount: questions?.length });

    if (!title || !topic || !questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, topic, questions (array)",
      });
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Questions array cannot be empty",
      });
    }

    const quizSet = await prisma.quizSet.create({
      data: {
        title,
        topic,
        difficulty: difficulty || "medium",
        numberOfQuestions: questions.length,
        userId,
        questions: {
          create: questions.map((q, index) => ({
            question: q.question,
            options: q.options,
            answer: q.answer,
            order: index,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    console.log("✅ Quiz set created with ID:", quizSet.id);

    res.json({
      success: true,
      message: "Quiz set saved successfully",
      quizSet,
    });
  } catch (error) {
    console.error("❌ Error saving quiz set:", error);
    next(error);
  }
}

/**
 * Get all quiz sets for the user
 */
export async function getQuizSets(req, res, next) {
  try {
    const userId = req.user?.userId;

    console.log("📚 Fetching quiz sets for user:", userId);

    const quizSets = await prisma.quizSet.findMany({
      where: userId ? { userId } : {},
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            questions: true,
            results: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ Found ${quizSets.length} quiz sets`);

    res.json({
      success: true,
      quizSets,
    });
  } catch (error) {
    console.error("❌ Error fetching quiz sets:", error);
    next(error);
  }
}

/**
 * Get a specific quiz set with all questions
 */
export async function getQuizSetById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    console.log("🔍 Fetching quiz set:", id);

    const quizSet = await prisma.quizSet.findFirst({
      where: {
        id,
        ...(userId && { userId }),
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quizSet) {
      return res.status(404).json({
        success: false,
        error: "Quiz set not found",
      });
    }

    console.log("✅ Quiz set found with", quizSet.questions.length, "questions");

    res.json({
      success: true,
      quizSet,
    });
  } catch (error) {
    console.error("❌ Error fetching quiz set:", error);
    next(error);
  }
}

/**
 * Delete a quiz set
 */
export async function deleteQuizSet(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    console.log("🗑️ Deleting quiz set:", id);

    const quizSet = await prisma.quizSet.findFirst({
      where: {
        id,
        ...(userId && { userId }),
      },
    });

    if (!quizSet) {
      return res.status(404).json({
        success: false,
        error: "Quiz set not found",
      });
    }

    await prisma.quizSet.delete({
      where: { id },
    });

    console.log("✅ Quiz set deleted successfully");

    res.json({
      success: true,
      message: "Quiz set deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting quiz set:", error);
    next(error);
  }
}

/**
 * Save quiz result with quiz set reference
 */
export async function saveQuizResultWithSet(req, res, next) {
  try {
    const { quizSetId, score, total, percentage, level, timeTaken, answers } = req.body;
    const userId = req.user?.userId || null;

    console.log("💾 Saving quiz result for user:", userId);
    console.log("📊 Result data:", { quizSetId, score, total, percentage });

    if (!quizSetId || score === undefined || !total) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: quizSetId, score, total",
      });
    }

    const result = await prisma.quizResult.create({
      data: {
        userId,
        quizSetId,
        score,
        total,
        percentage: percentage || (score / total) * 100,
        level: level || "beginner",
        timeTaken: timeTaken || 0,
        answers: answers || [],
      },
      include: {
        quizSet: {
          select: {
            id: true,
            title: true,
            topic: true,
            difficulty: true,
          },
        },
      },
    });

    console.log("✅ Result saved with ID:", result.id);

    res.json({
      success: true,
      message: "Result saved successfully",
      result,
    });
  } catch (error) {
    console.error("❌ Error saving result:", error);
    next(error);
  }
}

// ...existing code...