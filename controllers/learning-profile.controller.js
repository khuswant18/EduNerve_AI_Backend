import {
  generateLearningSkillProfile,
  generateQuickSkillSummary,
  getPerformanceComparison,
} from "../services/learning-profile.service.js";

/**
 * Get comprehensive learning skill profile
 */
export async function getLearningProfile(req, res, next) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    console.log("Generating learning profile for user:", userId);

    const profile = await generateLearningSkillProfile(userId);

    if (!profile.hasData) {
      return res.status(200).json({
        success: true,
        message: profile.message,
        hasData: false,
        profile: null,
      });
    }

    res.json({
      success: true,
      message: "Learning profile generated successfully",
      hasData: true,
      profile,
    });
  } catch (error) {
    console.error("Error in getLearningProfile:", error);
    next(error);
  }
}

/**
 * Get quick skill summary (lighter endpoint)
 */
export async function getQuickSummary(req, res, next) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const summary = await generateQuickSkillSummary(userId);

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error in getQuickSummary:", error);
    next(error);
  }
}

/**
 * Get performance comparison over time
 */
export async function getPerformanceTrends(req, res, next) {
  try {
    const userId = req.user?.userId;
    const { period } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const comparison = await getPerformanceComparison(userId, period);

    res.json({
      success: true,
      comparison,
    });
  } catch (error) {
    console.error("Error in getPerformanceTrends:", error);
    next(error);
  }
}

/**
 * Get combined dashboard data
 */
export async function getDashboard(req, res, next) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Get all data in parallel
    const [quickSummary, monthlyTrends, quarterlyTrends] = await Promise.all([
      generateQuickSkillSummary(userId),
      getPerformanceComparison(userId, "month"),
      getPerformanceComparison(userId, "quarter"),
    ]);

    res.json({
      success: true,
      dashboard: {
        quickSummary,
        trends: {
          monthly: monthlyTrends,
          quarterly: quarterlyTrends,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in getDashboard:", error);
    next(error);
  }
}
