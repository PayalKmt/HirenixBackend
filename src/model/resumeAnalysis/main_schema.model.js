
import mongoose from "mongoose";
import resumeAnalysisSchema from "./resumeAnalysisSchema.model.js";

resumeAnalysisSchema.index({ userId: 1, createdAt: -1 });
resumeAnalysisSchema.index({ fileId: 1 });


resumeAnalysisSchema.statics.getGrade = function (percentage) {
  if (percentage >= 95) return "A+";
  if (percentage >= 85) return "A";
  if (percentage >= 75) return "B+";
  if (percentage >= 65) return "B";
  if (percentage >= 55) return "C+";
  if (percentage >= 45) return "C";
  if (percentage >= 35) return "D";
  return "F";
};


resumeAnalysisSchema.pre("save", async function () {
  const SECTIONS = [
    "summary", "skills", "experience",
    "education", "projects", "keywords", "formatting",
  ];


  if (this.isModified("sectionScores")) {
    let totalPct = 0;
    let counted = 0;

    SECTIONS.forEach((key) => {
      const s = this.sectionScores?.[key];
      if (!s) return;

      const pct = s.maxScore > 0
        ? Math.round((s.score / s.maxScore) * 100)
        : 0;

      s.percentage = Math.min(pct, 100);
      s.grade = this.constructor.getGrade(s.percentage);

      totalPct += s.percentage;
      counted++;
    });


    const avgPct = counted > 0 ? Math.round(totalPct / counted) : 0;
    this.overallPercentage = avgPct;
    this.overallGrade = this.constructor.getGrade(avgPct);
    this.overallScore = avgPct;
  }

  if (this.isModified("sectionScores")) {
    SECTIONS.forEach((key) => {
      const s = this.sectionScores?.[key];
      if (!s) return;
      if (s.percentage >= 80) s.status = "optimized";
      else if (s.percentage >= 50) s.status = "needs_review";
      else s.status = "action_needed";
    });
  }

  if (this.isModified("sectionScores")) {
    const radarData = SECTIONS.map((key) => ({
      section: key,
      percentage: this.sectionScores?.[key]?.percentage ?? 0,
      grade: this.sectionScores?.[key]?.grade ?? "F",
    }));

    this.graphData.radar = radarData;
    // Bar chart: sorted highest → lowest percentage
    this.graphData.bar = [...radarData].sort(
      (a, b) => b.percentage - a.percentage
    );

    // Append to trend history
    this.graphData.trend.push({
      analyzedAt: new Date(),
      overallPercentage: this.overallPercentage,
    });
  }


  if (this.isModified("suggestions")) {
    const summary = {
      total: this.suggestions.length,
      critical: 0, high: 0, medium: 0, low: 0,
      bySection: {
        summary: 0, skills: 0, experience: 0,
        education: 0, projects: 0, keywords: 0,
        formatting: 0, general: 0,
      },
    };

    const priorityMap = { critical: 4, high: 3, medium: 2, low: 1 };

    this.suggestions = this.suggestions.map((s) => {
      s.priority = priorityMap[s.severity] ?? 0;
      if (s.severity in summary) summary[s.severity]++;
      if (s.section in summary.bySection) summary.bySection[s.section]++;
      return s;
    });

    this.suggestions.sort((a, b) => b.priority - a.priority);
    this.suggestionSummary = summary;
  }
});


// Mark analysis as failed
resumeAnalysisSchema.methods.markFailed = async function (reason = "Unknown error") {
  this.status = "failed";
  this.errorMessage = reason;
  return this.save();
};

// Mark analysis as completed
resumeAnalysisSchema.methods.markCompleted = async function () {
  this.status = "completed";
  this.errorMessage = null;
  return this.save();
};

// Get suggestions for one section
resumeAnalysisSchema.methods.getSectionSuggestions = function (section) {
  return this.suggestions.filter((s) => s.section === section);
};

// Get only ATS-critical suggestions
resumeAnalysisSchema.methods.getAtsSuggestions = function () {
  return this.suggestions.filter((s) => s.atsImpact === true);
};

// Get weakest sections (percentage < threshold, default 60)
resumeAnalysisSchema.methods.getWeakSections = function (threshold = 60) {
  return this.graphData.bar.filter((s) => s.percentage < threshold);
};

resumeAnalysisSchema.virtual("isReady").get(function () {
  return this.status === "completed";
});


const resume = mongoose.model("resumeAnalysis", resumeAnalysisSchema);
export default resume;


/* ═══════════════════════════════════════════════════════════

  EXAMPLE STORED DOCUMENT (for reference)

  {
    "userId": "665abc...",
    "fileId": "665def...",
    "experienceLevel": "fresher",
    "overallScore": 74,
    "overallPercentage": 74,
    "overallGrade": "B+",

    "sectionScores": {
      "summary":    { "score": 14, "maxScore": 20, "percentage": 70, "grade": "B+" },
      "skills":     { "score": 18, "maxScore": 20, "percentage": 90, "grade": "A"  },
      "experience": { "score": 12, "maxScore": 20, "percentage": 60, "grade": "C+" },
      "education":  { "score": 16, "maxScore": 20, "percentage": 80, "grade": "A"  },
      "projects":   { "score": 15, "maxScore": 20, "percentage": 75, "grade": "B+" },
      "keywords":   { "score": 14, "maxScore": 20, "percentage": 70, "grade": "B+" },
      "formatting": { "score": 17, "maxScore": 20, "percentage": 85, "grade": "A"  }
    },

    "graphData": {
      "radar": [
        { "section": "skills",     "percentage": 90, "grade": "A"  },
        { "section": "formatting", "percentage": 85, "grade": "A"  },
        { "section": "education",  "percentage": 80, "grade": "A"  },
        { "section": "projects",   "percentage": 75, "grade": "B+" },
        { "section": "keywords",   "percentage": 70, "grade": "B+" },
        { "section": "summary",    "percentage": 70, "grade": "B+" },
        { "section": "experience", "percentage": 60, "grade": "C+" }
      ],
      "bar": [ ...same, sorted high→low ],
      "trend": [
        { "analyzedAt": "2024-06-01", "overallPercentage": 68 },
        { "analyzedAt": "2024-06-15", "overallPercentage": 74 }
      ]
    },

    "suggestionSummary": {
      "total": 5, "critical": 1, "high": 2, "medium": 2, "low": 0,
      "bySection": { "experience": 2, "keywords": 2, "summary": 1 }
    },

    "status": "completed"
  }

═══════════════════════════════════════════════════════════ */