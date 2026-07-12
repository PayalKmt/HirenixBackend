import { STATUS } from "../constant/statusCode.js";

class AppError extends Error{
    constructor(statusCode,message){
        super(message)
        this.statusCode=statusCode;
        this.message=message;
        Error.captureStackTrace(this,this.constructor)
    }
}

export default AppError;