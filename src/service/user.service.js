import BlacklistModel from "../model/blacklist.model.js";
import user from "../model/user.model.js";
import { STATUS } from "../utils/constant/statusCode.js";
import AppError from "../utils/ErrorHandler/AppError.js";
import jwt from "jsonwebtoken";

const userRegisterService = async ({ email, hashPassword, fullname }) => {


  const userExist = await user.findOne({ email });
  if (userExist) {
    throw new AppError(STATUS.CONFLICT, "Email already registered");
  }
  const registerUser = await user.create(
    { email, fullname, password: hashPassword }
  );

  if (!registerUser) {
    throw new AppError(STATUS.SERVER_ERROR, "user not register");
  }
  return registerUser;
};

const userLoginService = async ({ email, password, enable30Day }) => {
  const finduser = await user.findOne({ email }).select("+password");
  if (!finduser) {
    throw new AppError(STATUS.UNAUTHORIZED, "Invalid credentials");
  }
  const matchPassword = await finduser.comparePassword(password);
  if (!matchPassword) {
    throw new AppError(STATUS.UNAUTHORIZED, "Invalid credentials");
  }
  if (enable30Day) {
    finduser.enable30Day = true;
    await finduser.save();
  }
  return finduser;
};

const userLogoutService = async ({ user_id, token }) => {
  const foundUser = await user.findOne({ _id: user_id._id });
  if (!foundUser) {
    throw new AppError(STATUS.UNAUTHORIZED, "Invalid credentials");
  }

  if (!token) {
    throw new AppError(STATUS.UNAUTHORIZED, "unauthorized access");
  }

  // Decode (no verify needed — middleware already verified) to get the JWT's own expiry
  const decoded = jwt.decode(token);
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // fallback: 7d

  const blockToken = await BlacklistModel.create({ token, expiresAt });
  if (!blockToken) {
    throw new AppError(STATUS.UNAUTHORIZED, "unauthorized access");
  }

  return true;
};

export { userRegisterService, userLoginService, userLogoutService };
