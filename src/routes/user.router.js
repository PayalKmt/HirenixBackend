import express from 'express'
const router = express.Router();
import { userRegister, userLogin, userLogout, deleteAccount } from "../controller/user.controller.js";
import { authlimiter } from "../utils/auth_limiter.js";
import userMiddleware from '../middleware/user.middleware.js';
import { googleAuth, googleCallbacks, linkedinAuth, linkedinCallbacks } from '../controller/oauth.controller.js';

router.use(authlimiter());
router.post('/register', userRegister);
router.post('/user/login', userLogin);
router.get('/logout', userMiddleware, userLogout);
router.delete('/user/account', userMiddleware, deleteAccount);

// Google Authentication using (OAuth)
router.get('/auth/google', googleAuth);
router.get('/auth/google/callback', googleCallbacks);

// LinkedIn Authentication 

router.get('/auth/linkedin', linkedinAuth);
router.get('/auth/linkedin/callback', linkedinCallbacks);

export default router;