import { GoogleGenAI } from "@google/genai";
import { ENV } from "../utils/env.js";

const genAI = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

export default genAI;
