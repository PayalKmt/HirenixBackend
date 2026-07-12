import mongoose from 'mongoose';
const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // MongoDB deletes the document exactly when expiresAt is reached
    },
});

const BlacklistModel = mongoose.model("blacklist", blacklistSchema);
export default BlacklistModel;