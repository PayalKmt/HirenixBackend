import mongoose from "mongoose";


const fileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true
    },
    rawText: { type: String, default: "" },
    fileUrl: {
        type: String,
        required: true,
        trim: true
    },
    publicId: {
        type: String,
        required: true,
        trim: true
    },
    originalName: { type: String, required: true, },
    fileType: { type: String, required: true, },

    status: {
        type: String,
        enum: ["active", "processing", "delete"],
        default: "active",
    }


});

const fileModel = mongoose.model("file", fileSchema);
export default fileModel;