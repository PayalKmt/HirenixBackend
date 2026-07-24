import { STATUS } from "../utils/constant/statusCode.js";
import AppError from "../utils/ErrorHandler/AppError.js";
import user from "../model/user.model.js";
import {
  userRegisterService,
  userLoginService,
  userLogoutService,
  deleteAccountService
} from "../service/user.service.js";
import {
  userValidation,
  userLoginValidator,
} from "../validation/user.validation.js";
import { ENV } from "../utils/env.js";

const userRegister = async (req, res) => {
  try {
    const validateData = userValidation.safeParse(req.body);

    if (!validateData.success) {
      throw new AppError(STATUS.BAD_REQUEST, "Validation failed");
    }
    const { fullname, email, password } = validateData.data;

    const hashPassword = await user.hashPassword(password);
    const createdUser = await userRegisterService({
      email,
      hashPassword,
      fullname,
    });

    if (!createdUser) {
      throw new AppError(STATUS.SERVER_ERROR, "user not register");
    }

    const token = createdUser.generateAuthToken();
    if (!token) {
      throw new AppError(STATUS.SERVER_ERROR, "user not register");
    }

    res.cookie("token", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: ENV.NODE_ENV === "development" ? false : true,
    });

    res.status(STATUS.CREATED).json({ token, createdUser });
  } catch (err) {
    const statusCode = err.statusCode || STATUS.SERVER_ERROR;
    res.status(statusCode).json({ message: err.message });
  }
};

const userLogin = async (req, res) => {
  try {
    const validateData = userLoginValidator.safeParse(req.body);
    if (!validateData.success) {
      throw new AppError(STATUS.BAD_REQUEST, "Validation failed");
    }

    const { email, password, enable30Day } = validateData.data;

    const updatedUser = await userLoginService({
      email,
      password,
      enable30Day,
    });
    if (!updatedUser) {
      throw new AppError(STATUS.SERVER_ERROR, "failed to login");
    }
    const token = updatedUser.generateAuthToken();

    res.cookie("token", token, {
      maxAge: enable30Day ? 30 * 24 * 60 * 60 * 1000 :  24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: ENV.NODE_ENV === "development" ? false : true,
    });

    res.status(STATUS.OK).json({ token, updatedUser });
  } catch (err) {
    const statusCode = err.statusCode || STATUS.SERVER_ERROR;
    res.status(statusCode).json({ message: err.message });
  }
};

const userLogout = async(req,res)=>{
  try{
    const user_id = req.auth;
    if(!user_id){
      throw new AppError(STATUS.UNAUTHORIZED,"unauthorized access");
    }

    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    const logoutSuccess = await userLogoutService({ user_id, token });
    if(!logoutSuccess){
      throw new AppError(STATUS.UNAUTHORIZED,"unauthorized access");
    }

    res.clearCookie("token");
    return res.status(STATUS.OK).json({message:"logout successfully..."});

  }catch (err) {
    const statusCode = err.statusCode || STATUS.SERVER_ERROR;
    res.status(statusCode).json({ message: err.message });
  }
}

const deleteAccount = async (req, res) => {
  try {
    const user_id = req.auth;
    if (!user_id) {
      throw new AppError(STATUS.UNAUTHORIZED, "unauthorized access");
    }

    const { password } = req.body;
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    await deleteAccountService({ user_id, password, token });

    res.clearCookie("token");
    return res.status(STATUS.OK).json({ message: "Account deleted successfully" });
  } catch (err) {
    const statusCode = err.statusCode || STATUS.SERVER_ERROR;
    res.status(statusCode).json({ message: err.message });
  }
};

export { userRegister, userLogin, userLogout, deleteAccount };
