import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        techStack: { type: [String], default: [] },
        link: { type: String, trim: true },
    },
    { _id: false }
);

export default projectSchema;