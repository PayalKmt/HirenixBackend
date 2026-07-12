import sectionScoreDetailSchema from "./sectionScoreDetailSchema.model.js";
import mongoose from "mongoose";

const sectionScoresSchema = new mongoose.Schema(
    {
        summary: { type: sectionScoreDetailSchema, default: () => ({}) },
        skills: { type: sectionScoreDetailSchema, default: () => ({}) },
        experience: { type: sectionScoreDetailSchema, default: () => ({}) },
        education: { type: sectionScoreDetailSchema, default: () => ({}) },
        projects: { type: sectionScoreDetailSchema, default: () => ({}) },
        keywords: { type: sectionScoreDetailSchema, default: () => ({}) }, // ATS
        formatting: { type: sectionScoreDetailSchema, default: () => ({}) },
    },
    { _id: false }
);

export default sectionScoresSchema;