import resumeAnalysisModel from "../model/resumeAnalysis/main_schema.model.js";
import fileModel from "../model/file.model.js";
import { STATUS } from "../utils/constant/statusCode.js";
import AppError from "../utils/ErrorHandler/AppError.js";
import { initiateAnalysis } from "../service/analysis.service.js";

const getAnalysis = async (req, res) => {
    try {
        const { analysisId } = req.params;
        const userId = req.auth._id;

        const analysis = await resumeAnalysisModel.findOne({ _id: analysisId, userId });
        if (!analysis) throw new AppError(STATUS.NOT_FOUND, "Analysis not found");

        res.status(STATUS.OK).json(analysis);
    } catch (err) {
        res.status(err.statusCode || STATUS.SERVER_ERROR).json({ message: err.message });
    }
};

const getUserAnalyses = async (req, res) => {
    try {
        const userId = req.auth._id;

        const analyses = await resumeAnalysisModel
            .find({ userId })
            .populate("fileId", "originalName fileUrl")
            .sort({ createdAt: -1 });
        const totalCount = analyses.length;
        res.status(STATUS.OK).json({ totalCount, analyses });
    } catch (err) {
        res.status(err.statusCode || STATUS.SERVER_ERROR).json({ message: err.message });
    }
};

const retriggerAnalysis = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.auth._id;
        const experienceLevel = req.body.experienceLevel || "fresher";

        const file = await fileModel.findOne({ _id: fileId, userId });
        if (!file) throw new AppError(STATUS.NOT_FOUND, "File not found");

        const analysis = await initiateAnalysis({
            fileId: file._id,
            userId,
            fileUrl: file.fileUrl,
            rawText: file.rawText,
            experienceLevel,
        });

        res.status(STATUS.CREATED).json({
            analysisId: analysis._id,
            status: analysis.status,
        });
    } catch (err) {
        res.status(err.statusCode || STATUS.SERVER_ERROR).json({ message: err.message });
    }
};

export { getAnalysis, getUserAnalyses, retriggerAnalysis };
