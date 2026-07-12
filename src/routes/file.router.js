import express from 'express'
import userMiddleware from '../middleware/user.middleware.js';
import upload from '../config/uploadConfig.js';
import { authlimiter } from '../utils/auth_limiter.js';
import { fileUploadController } from "../controller/file.controller.js";
const router = express.Router();

// router.use(authlimiter(20));
router.post('/upload/file', userMiddleware, upload.single("resume"), fileUploadController);







export default router;