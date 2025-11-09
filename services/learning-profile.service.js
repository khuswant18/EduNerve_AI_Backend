import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/config.js";
import prisma from "../db/config.js";

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Generate a comprehensive learning skill profile from interview and quiz data
 */
export async function generateLearningSkillProfile(userId) {
  try {
    // Fetch user's interview history
    const interviews = await prisma.interview.findMany({
      where: { userId, status: "completed" },
      orderBy: { completedAt: "desc" },
      take: 10,
      select: {
        role: true,
        interviewType: true,
        technologies: true,
        technicalScore: true,
        communicationScore: true,
        problemSolvingScore: true,
        overallScore: true,
        weakAreas: true,
        strengths: true,
        feedback: true,
        completedAt: true,
      },
    });

    // Fetch user's quiz results
    const quizResults = await prisma.quizResult.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        category: true,
        subtopics: true,
        score: true,
        total: true,
        percentage: true,
        level: true,
        createdAt: true,
      },
    });

    if (interviews.length === 0 && quizResults.length === 0) {
      return {
        message:
          "No learning data available yet. Complete interviews or quizzes to generate your profile.",
        hasData: false,
      };
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 6000,
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    const prompt = `
You are an expert learning advisor and career coach. Analyze this learner's complete performance data from interviews and quizzes to create a comprehensive learning skill profile.

INTERVIEW HISTORY (${interviews.length} interviews):
${JSON.stringify(interviews, null, 2)}

QUIZ PERFORMANCE (${quizResults.length} quizzes):
${JSON.stringify(quizResults, null, 2)}

Create a comprehensive learning skill profile in this exact JSON format:
{
  "overallSummary": "A comprehensive 250-300 word summary of the learner's journey, progress, patterns, and potential",
  
  "skillLevels": {
    "technical": {
      "level": "intermediate",
      "score": 75.5,
      "trend": "improving",
      "description": "Analysis of technical skills progression"
    },
    "communication": {
      "level": "advanced",
      "score": 85.0,
      "trend": "stable",
      "description": "Analysis of communication skills"
    },
    "problemSolving": {
      "level": "intermediate",
      "score": 70.0,
      "trend": "improving",
      "description": "Analysis of problem-solving abilities"
    },
    "theoreticalKnowledge": {
      "level": "intermediate",
      "score": 78.0,
      "trend": "improving",
      "description": "Analysis based on quiz performance"
    }
  },
  
  "coreStrengths": [
    {
      "skill": "React Development",
      "confidence": "high",
      "evidence": "Consistent high scores in React interviews and quizzes",
      "applications": ["Can build complex SPAs", "Strong component design"]
    }
  ],
  
  "improvementAreas": [
    {
      "skill": "System Design",
      "currentLevel": "beginner",
      "targetLevel": "intermediate",
      "priority": "high",
      "gap": "Limited experience with scalability patterns",
      "estimatedTimeToImprove": "3-4 months"
    }
  ],
  
  "learningStyle": {
    "preferredMethod": "hands-on practice",
    "strengths": ["Quick to grasp concepts", "Good retention"],
    "challenges": ["Needs more practice with complex scenarios"],
    "recommendations": "Focus on project-based learning"
  },
  
  "performanceTrends": {
    "interviewScores": {
      "trend": "improving",
      "averageScore": 75.5,
      "bestScore": 85.0,
      "improvement": "+12% over last 5 interviews"
    },
    "quizAccuracy": {
      "trend": "stable",
      "averageAccuracy": 78.0,
      "bestCategory": "JavaScript",
      "improvementNeeded": "System Design"
    }
  },
  
  "technologyProficiency": [
    {
      "technology": "JavaScript",
      "proficiency": "advanced",
      "score": 85,
      "interviewCount": 5,
      "quizCount": 10,
      "confidence": "high"
    },
    {
      "technology": "React",
      "proficiency": "intermediate",
      "score": 75,
      "interviewCount": 3,
      "quizCount": 5,
      "confidence": "medium"
    }
  ],
  
  "personalizedRecommendations": [
    {
      "category": "skill-development",
      "priority": "high",
      "title": "Master System Design Fundamentals",
      "description": "Based on your interview feedback, focus on scalability patterns",
      "actionItems": [
        "Complete system design course",
        "Practice designing 2-3 systems per week",
        "Read case studies from major tech companies"
      ],
      "estimatedDuration": "3 months",
      "resources": [
        {
          "title": "System Design Primer",
          "type": "documentation",
          "url": "https://github.com/donnemartin/system-design-primer"
        }
      ]
    }
  ],
  
  "careerReadiness": {
    "targetRole": "Senior Software Engineer",
    "currentReadiness": 65,
    "gaps": [
      "System design experience",
      "Advanced algorithms knowledge",
      "Production debugging skills"
    ],
    "timeline": "6-8 months to reach target readiness",
    "nextMilestones": [
      "Complete 10 more technical interviews",
      "Score 85%+ on system design quizzes",
      "Build 2 production-grade projects"
    ]
  },
  
  "motivationalInsights": {
    "achievedGoals": 12,
    "consistencyScore": 85,
    "strongestDay": "Tuesday",
    "learningStreak": 15,
    "encouragement": "You've shown consistent improvement in technical interviews. Keep practicing!"
  },
  
  "nextSteps": {
    "immediate": [
      "Take a system design quiz to assess current level",
      "Complete one mock interview this week",
      "Review weak areas from last interview"
    ],
    "shortTerm": [
      "Master one new technology per month",
      "Increase quiz accuracy to 85%+",
      "Focus on communication clarity in interviews"
    ],
    "longTerm": [
      "Achieve advanced level in all core skills",
      "Complete 50 technical interviews",
      "Build portfolio with 5 major projects"
    ]
  }
}

Guidelines:
- Be specific and data-driven
- Identify clear patterns and trends
- Provide actionable, personalized recommendations
- Be encouraging while honest about gaps
- Consider both interview and quiz performance
- Highlight progress and improvements
- Give realistic timelines
- Focus on growth mindset
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    let cleanText = text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/```\n?/g, "");
    }
    cleanText = cleanText.trim();

    const profileData = JSON.parse(cleanText);

    // Add metadata
    profileData.generatedAt = new Date().toISOString();
    profileData.dataPoints = {
      interviews: interviews.length,
      quizzes: quizResults.length,
      totalActivities: interviews.length + quizResults.length,
    };
    profileData.hasData = true;

    return profileData;
  } catch (error) {
    console.error("Error generating learning skill profile:", error);
    throw error;
  }
}

/**
 * Generate quick skill summary (lighter version)
 */
export async function generateQuickSkillSummary(userId) {
  try {
    // Get recent data only
    const recentInterviews = await prisma.interview.findMany({
      where: { userId, status: "completed" },
      orderBy: { completedAt: "desc" },
      take: 3,
      select: {
        overallScore: true,
        weakAreas: true,
        strengths: true,
        technologies: true,
      },
    });

    const recentQuizzes = await prisma.quizResult.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        category: true,
        percentage: true,
        level: true,
      },
    });

    // Calculate averages
    const avgInterviewScore =
      recentInterviews.length > 0
        ? recentInterviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) /
          recentInterviews.length
        : 0;

    const avgQuizScore =
      recentQuizzes.length > 0
        ? recentQuizzes.reduce((sum, q) => sum + q.percentage, 0) /
          recentQuizzes.length
        : 0;

    // Collect all weak areas and strengths
    const allWeakAreas = recentInterviews.flatMap((i) => i.weakAreas || []);
    const allStrengths = recentInterviews.flatMap((i) => i.strengths || []);
    const allTechnologies = [
      ...new Set(recentInterviews.flatMap((i) => i.technologies || [])),
    ];

    return {
      summary: {
        totalInterviews: recentInterviews.length,
        totalQuizzes: recentQuizzes.length,
        averageInterviewScore: Math.round(avgInterviewScore * 10) / 10,
        averageQuizScore: Math.round(avgQuizScore * 10) / 10,
        overallPerformance: (avgInterviewScore + avgQuizScore) / 2,
      },
      recentStrengths: [...new Set(allStrengths)].slice(0, 5),
      recentWeakAreas: [...new Set(allWeakAreas)].slice(0, 5),
      technologiesWorkedOn: allTechnologies,
      lastActivity:
        recentInterviews[0]?.completedAt || recentQuizzes[0]?.createdAt || null,
    };
  } catch (error) {
    console.error("Error generating quick skill summary:", error);
    throw error;
  }
}

/**
 * Compare performance over time periods
 */
export async function getPerformanceComparison(userId, period = "month") {
  try {
    const now = new Date();
    let startDate;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "quarter":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const interviews = await prisma.interview.findMany({
      where: {
        userId,
        status: "completed",
        completedAt: { gte: startDate },
      },
      orderBy: { completedAt: "asc" },
      select: {
        overallScore: true,
        technicalScore: true,
        communicationScore: true,
        problemSolvingScore: true,
        completedAt: true,
      },
    });

    const quizzes = await prisma.quizResult.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "asc" },
      select: {
        percentage: true,
        category: true,
        createdAt: true,
      },
    });

    return {
      period,
      startDate,
      endDate: now,
      interviews: {
        count: interviews.length,
        scores: interviews.map((i) => ({
          overall: i.overallScore,
          technical: i.technicalScore,
          communication: i.communicationScore,
          problemSolving: i.problemSolvingScore,
          date: i.completedAt,
        })),
        trend: calculateTrend(interviews.map((i) => i.overallScore || 0)),
      },
      quizzes: {
        count: quizzes.length,
        scores: quizzes.map((q) => ({
          percentage: q.percentage,
          category: q.category,
          date: q.createdAt,
        })),
        trend: calculateTrend(quizzes.map((q) => q.percentage)),
      },
    };
  } catch (error) {
    console.error("Error getting performance comparison:", error);
    throw error;
  }
}

/**
 * Helper function to calculate trend
 */
function calculateTrend(scores) {
  if (scores.length < 2) return "insufficient_data";

  const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
  const secondHalf = scores.slice(Math.ceil(scores.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (change > 10) return "significantly_improving";
  if (change > 3) return "improving";
  if (change < -10) return "declining";
  if (change < -3) return "slightly_declining";
  return "stable";
}
