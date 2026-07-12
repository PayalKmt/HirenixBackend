import mongoose from "mongoose";
const sectionScoreDetailSchema = new mongoose.Schema(
    {
        score: { type: Number, default: 0, min: 0 },
        maxScore: { type: Number, default: 20 },
        percentage: { type: Number, default: 0, min: 0, max: 100 },
        grade: {
            type: String,
            enum: ["A+", "A", "B+", "B", "C+", "C", "D", "F"],
            default: "F",
        },
        status: {
            type: String,
            enum: ["optimized", "needs_review", "action_needed"],
            default: "needs_review",
        },

        breakdown: [
            {
                label: { type: String },
                earned: { type: Number },
                max: { type: Number },
                _id: false,
            },
        ],
    },
    { _id: false }
);

export default sectionScoreDetailSchema;