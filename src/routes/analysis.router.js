import express from "express";
import userMiddleware from "../middleware/user.middleware.js";
import { getAnalysis, getUserAnalyses, retriggerAnalysis } from "../controller/analysis.controller.js";

const router = express.Router();

router.get("/analysis/history", userMiddleware, getUserAnalyses);
router.get("/analysis/:analysisId", userMiddleware, getAnalysis);
router.post("/analysis/start/:fileId", userMiddleware, retriggerAnalysis);

export default router;
