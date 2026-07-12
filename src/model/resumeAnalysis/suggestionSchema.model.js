import mongoose from "mongoose";
const suggestionSchema = new mongoose.Schema(
    {
        message: { type: String, required: true, trim: true },
        section: {
            type: String,
            enum: [
                "summary", "skills", "experience",
                "education", "projects", "formatting",
                "keywords", "general",
            ],
            default: "general",
            index: true,
        },
        severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
        },
        type: {
            type: String,
            enum: [
                "missing_content",
                "weak_language",
                "missing_metrics",
                "keyword_gap",
                "formatting_issue",
                "duplicate_content",
                "improvement",
            ],
            default: "improvement",
        },
        fix: { type: String, trim: true },
        example: {
            before: { type: String, trim: true },
            after: { type: String, trim: true },
        },
        atsImpact: { type: Boolean, default: false },
        autoDetected: { type: Boolean, default: true },
        priority: { type: Number, default: 0 },
    },
    { _id: false }
);

export default suggestionSchema;