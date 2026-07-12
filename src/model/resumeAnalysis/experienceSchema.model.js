import mongoose from "mongoose";
const experienceSchema = new mongoose.Schema(
    {
        role: { type: String, trim: true },
        company: { type: String, trim: true },
        duration: { type: String, trim: true },
        description: { type: [String], default: [] },
        impactScore: { type: Number, default: 0, min: 0, max: 100 },
    },
    { _id: false }
);

export default experienceSchema;