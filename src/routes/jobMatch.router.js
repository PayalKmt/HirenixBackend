import express from "express";
import userMiddleware from "../middleware/user.middleware.js";
import { getJobMatchesController } from "../controller/jobMatch.controller.js";

const router = express.Router();

router.get("/job-match/:analysisId", userMiddleware, getJobMatchesController);

export default router;
