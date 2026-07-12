import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../utils/env.js";

const anthropic = new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY });

export default anthropic;