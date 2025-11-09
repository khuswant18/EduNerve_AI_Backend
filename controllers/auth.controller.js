import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db/config.js";
import config from "../config/config.js";

export async function register(req, res, next) {
  try {
    const { email, password, name, role, experience, skills } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: "Email and name are required",
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        provider: "credentials",
        role: role || null,
        experience: experience || null,
        skills: skills || [],
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        role: true,
        experience: true,
        skills: true,
        createdAt: true,
      },
    });

    console.log("✅ User created successfully:", {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret || "your-secret-key",
      { expiresIn: "7d" }
    );

    console.log("✅ JWT token generated for user:", user.email);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
      token,
    });
  } catch (error) {
    console.error("Error in register:", error);
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Check if user registered with Google OAuth (no password)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: "This account uses Google Sign-In. Please login with Google.",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        experience: user.experience,
        skills: user.skills,
      },
      token,
    });
  } catch (error) {
    console.error("Error in login:", error);
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        experience: true,
        skills: true,
        createdAt: true,
        interviews: {
          select: {
            id: true,
            role: true,
            interviewType: true,
            status: true,
            overallScore: true,
            technicalScore: true,
            communicationScore: true,
            problemSolvingScore: true,
            startedAt: true,
            completedAt: true,
            feedback: true,
            strengths: true,
            weakAreas: true,
            transcript: true,
            aiAnalysis: true,
            duration: true,
          },
          orderBy: {
            startedAt: "desc",
          },
          take: 10,
        },
        quizResults: {
          select: {
            id: true,
            score: true,
            total: true,
            percentage: true,
            level: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const { name, role, experience, skills } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(experience && { experience }),
        ...(skills && { skills }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        experience: true,
        skills: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    next(error);
  }
}

export async function googleAuth(req, res, next) {
  try {
    const { email, name, googleId, picture } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({
        success: false,
        error: "Email and Google ID are required",
      });
    }

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { googleId }],
      },
    });

    if (user) {
      // User exists - update their info if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatar: picture || user.avatar,
          provider: "google",
          name: name || user.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          googleId: true,
          provider: true,
          role: true,
          experience: true,
          skills: true,
          createdAt: true,
        },
      });

      console.log("✅ Existing Google user logged in:", user.email);
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          googleId,
          avatar: picture,
          provider: "google",
          password: null, // No password for Google users
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          googleId: true,
          provider: true,
          role: true,
          experience: true,
          skills: true,
          createdAt: true,
        },
      });

      console.log("✅ New Google user created:", {
        id: user.id,
        email: user.email,
        name: user.name,
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret || "your-secret-key",
      { expiresIn: "7d" }
    );

    console.log("✅ JWT token generated for Google user:", user.email);

    res.json({
      success: true,
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    console.error("Error in googleAuth:", error);
    next(error);
  }
}

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