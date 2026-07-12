import mongoose from "mongoose";

const educationSchema = new mongoose.Schema(
    {
        degree: { type: String, trim: true },
        institution: { type: String, trim: true },
        year: { type: String, trim: true },
        score: { type: String, trim: true },
    },
    { _id: false }
);

export default educationSchema;