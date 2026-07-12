import mongoose from "mongoose";
import experienceSchema from "./experienceSchema.model.js";
import educationSchema from "./educationSchema.model.js";
import projectSchema from "./projectSchema.model.js";
import sectionScoresSchema from "./sectionScoreSchema.model.js";
import suggestionSchema from "./suggestionSchema.model.js";

const resumeAnalysisSchema = new mongoose.Schema(
    {

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true,
        },
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "file",
            required: true,
        },


        experienceLevel: {
            type: String,
            enum: ["fresher", "mid", "senior"],
            default: "fresher",

        },

        sections: {
            summary: {
                content: { type: String, default: "" },
                length: { type: Number, default: 0 },
            },
            skills: {
                technical: { type: [String], default: [] },
                soft: { type: [String], default: [] },
                total: { type: Number, default: 0 },
            },
            experience: { type: [experienceSchema], default: [] },
            education: { type: [educationSchema], default: [] },
            projects: { type: [projectSchema], default: [] },
        },


        overallScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        overallPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,

        },
        overallGrade: {
            type: String,
            enum: ["A+", "A", "B+", "B", "C+", "C", "D", "F"],
            default: "F",
        },


        sectionScores: {
            type: sectionScoresSchema,
            default: () => ({}),
        },


        //
        graphData: {

            radar: [
                {
                    section: { type: String },
                    percentage: { type: Number },
                    grade: { type: String },
                    _id: false,
                },
            ],

            bar: [
                {
                    section: { type: String },
                    percentage: { type: Number },
                    grade: { type: String },
                    _id: false,
                },
            ],

            trend: [
                {
                    analyzedAt: { type: Date },
                    overallPercentage: { type: Number },
                    _id: false,
                },
            ],
        },


        suggestions: { type: [suggestionSchema], default: [] },


        suggestionSummary: {
            total: { type: Number, default: 0 },
            critical: { type: Number, default: 0 },
            high: { type: Number, default: 0 },
            medium: { type: Number, default: 0 },
            low: { type: Number, default: 0 },
            bySection: {
                summary: { type: Number, default: 0 },
                skills: { type: Number, default: 0 },
                experience: { type: Number, default: 0 },
                education: { type: Number, default: 0 },
                projects: { type: Number, default: 0 },
                keywords: { type: Number, default: 0 },
                formatting: { type: Number, default: 0 },
                general: { type: Number, default: 0 },
            },
        },


        improvedContent: {
            summary: { type: String, default: "" },
            experience: { type: String, default: "" },
            projects: { type: String, default: "" },
        },


        detectedRole: { type: String, default: "" },

        analysisDepth: {
            type: String,
            enum: ["basic", "standard", "advanced_semantic"],
            default: "standard",
        },

        status: {
            type: String,
            enum: ["processing", "completed", "failed"],
            default: "processing",
            index: true,
        },
        errorMessage: { type: String, default: null },
    },
    { timestamps: true }
);

export default resumeAnalysisSchema;