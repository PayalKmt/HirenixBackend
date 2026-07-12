import fileModel from "../model/file.model.js";
import { STATUS } from "../utils/constant/statusCode.js";
import AppError from "../utils/ErrorHandler/AppError.js";
import cloudinary from "../config/cloudinary.js";
import { convertDocxToPdf } from "../utils/convertDocxToPdf.js";
import mammoth from "mammoth";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

GlobalWorkerOptions.workerSrc = import.meta.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const uploadToCloudinary = (buffer, options) =>
    new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        }).end(buffer);
    });

const extractPdfText = async (buffer) => {
    const pdf = await getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise;
    const pageTexts = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pageTexts.push(content.items.map((item) => item.str).join(" "));
    }
    return pageTexts.join("\n").trim();
};

const extractDocxText = async (buffer) => {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
};

const fileUploadService = async ({ file, userId }) => {
    let fileBuffer = file.buffer;
    let originalName = file.originalname;
    const fileType = file.mimetype;

    if (!fileBuffer) {
        throw new AppError(STATUS.BAD_REQUEST, "Invalid file upload");
    }

    let rawText = "";
    try {
        rawText = fileType === DOCX_MIME
            ? await extractDocxText(fileBuffer)
            : await extractPdfText(fileBuffer);
        console.log(`[text-extract] ${rawText.length} chars extracted`);
    } catch (err) {
        console.error("[text-extract] failed:", err.message);
    }

    // DOCX: convert to PDF before uploading; PDF: upload as-is
    if (fileType === DOCX_MIME) {
        fileBuffer = await convertDocxToPdf(fileBuffer);
        originalName = originalName.replace(/\.docx$/i, ".pdf");
    }

    // Pass base64 PDF to analysis as fallback when rawText is too short
    const pdfBase64 = fileBuffer.toString("base64");

    const result = await uploadToCloudinary(fileBuffer, {
        folder: "resumes",
        resource_type: "image",
        format: "pdf",
    });

    if (!result?.secure_url) {
        throw new AppError(STATUS.SERVER_ERROR, "Failed to upload to cloud storage");
    }

    const uploadedFile = await fileModel.create({
        userId,
        fileUrl: result.secure_url,
        publicId: result.public_id,
        rawText,
        originalName,
        fileType: "application/pdf",
    });

    return { doc: uploadedFile, pdfBase64 };
};

export { fileUploadService };
