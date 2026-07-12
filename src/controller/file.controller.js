import AppError from "../utils/ErrorHandler/AppError.js";
import { STATUS } from "../utils/constant/statusCode.js";
import { fileUploadService } from "../service/file.service.js";
import { initiateAnalysis } from "../service/analysis.service.js";

const fileUploadController = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      throw new AppError(STATUS.BAD_REQUEST, "No file uploaded");
    }
    const userId = req.auth._id;
    const experienceLevel = req.body.experienceLevel || "fresher";

    const { doc: uploadResult, pdfBase64 } = await fileUploadService({ file, userId });
    if (!uploadResult) {
      throw new AppError(STATUS.BAD_REQUEST, "failed to upload file");
    }

    const analysis = await initiateAnalysis({
      fileId: uploadResult._id,
      userId,
      fileUrl: uploadResult.fileUrl,
      rawText: uploadResult.rawText,
      pdfBase64,
      experienceLevel,
    });

    res.status(STATUS.CREATED).json({
      message: "File uploaded successfully....",
      fileId: uploadResult._id,
      filename: uploadResult.originalName,
      fileUrl: uploadResult.fileUrl,
      analysisId: analysis._id,
      status: analysis.status,
    });

  } catch (err) {
    const statusCode = err.statusCode || STATUS.SERVER_ERROR;
    res.status(statusCode).json({ message: err.message });
  }

}

export { fileUploadController };