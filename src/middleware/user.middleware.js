import { STATUS } from "../utils/constant/statusCode.js";
import AppError from "../utils/ErrorHandler/AppError.js";
import jwt from "jsonwebtoken";
import { ENV } from '../utils/env.js';
import BlackList from "../model/blacklist.model.js"
import user from "../model/user.model.js";
const userMiddleware = async (req, res, next) => {
    try {
        let storeToken = req.cookies.token || req.headers.authorization?.split(" ")[1];
        const headerToken = req.headers.authorization;

        if (!storeToken && !headerToken) {
            throw new AppError(STATUS.UNAUTHORIZED, "unauthorized access !");
        } else if (headerToken && !storeToken) {
            const part = headerToken.split(" ");

            if (part.length !== 2 || part[0] !== "Bearer") {
                throw new AppError(STATUS.UNAUTHORIZED, "Invalid token format");
            }
            storeToken = part[1];
        }


        const isBlacklist = await BlackList.findOne({ token: storeToken });

        if (isBlacklist) {
            throw new AppError(STATUS.UNAUTHORIZED, "unauthorized access !");
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(storeToken, ENV.JWT_SECRET);
        } catch (jwtErr) {
            const msg = jwtErr.name === "TokenExpiredError"
                ? "Session expired, please login again"
                : "Invalid token";
            throw new AppError(STATUS.UNAUTHORIZED, msg);
        }

        const userData = await user.findOne({ _id: decodedToken._id });
        if (!userData) {
            throw new AppError(STATUS.SERVER_ERROR, "Internal server error");
        }
        req.auth = userData;
        next();
    } catch (err) {
        const statusCode = err.statusCode || STATUS.SERVER_ERROR;
        return res.status(statusCode).json({
            success: false,
            message: err.message
        });
    }
}

export default userMiddleware;