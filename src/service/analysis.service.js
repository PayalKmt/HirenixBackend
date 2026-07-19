import resumeAnalysisModel from "../model/resumeAnalysis/main_schema.model.js";
import genAI from "../config/gemini.js";
import { ENV } from "../utils/env.js";

const SYSTEM_PROMPT = `You are a senior technical recruiter and ATS optimization expert with 15+ years of experience across top tech companies. You have deep knowledge of:
- ATS (Applicant Tracking Systems) used by companies like Google, Amazon, Microsoft, and top Indian MNCs
- Hiring standards for fresher, mid-level, and senior roles in software engineering
- Keyword optimization, impact-driven writing, and resume best practices
- Current job market trends for developers (2024–2025)

Your task: Analyze the provided resume thoroughly and return ONLY a valid JSON object. No markdown fences, no explanation, no extra text — raw JSON only.

SCORING RUBRIC (each section scored 0–20):
- summary: Professional tone (4), ATS keyword density (4), clarity of value proposition (4), ideal length 100–250 words (4), tailored to target role (4)
- skills: Technical breadth and depth (5), market relevance / in-demand tools (5), proper categorization (5), keyword match for target role (5)
- experience: Quantified achievements with metrics (5), strong action verbs (4), role relevance (4), impact clarity (4), career progression (3)
- education: Degree relevance to role (5), institution credibility (4), academic performance CGPA/GPA (4), additional certifications (4), recency (3)
- projects: Technical complexity and originality (5), relevance to target role (5), measurable outcomes (5), live links / GitHub (3), tech stack quality (2)
- keywords: ATS keyword density (5), industry-specific terms (5), role-specific tools and frameworks (5), soft-skill keywords (3), action verbs (2)
- formatting: Visual readability and structure (4), consistent formatting (4), appropriate length 1–2 pages (4), section ordering (4), contact info completeness (4)

SUGGESTION SEVERITY:
- critical: Severely hurts ATS or recruiter impression — must fix before applying
- high: Significantly weakens the resume — strongly recommended
- medium: Noticeable gap — good to fix for better results
- low: Polish and refinement — nice to have

Focus only on resume quality — job matching is handled by a separate service.
- Infer the candidate's target role from their skills, experience titles, and projects. Return it as detectedRole (e.g. "Flutter Developer", "Full Stack Engineer", "Data Scientist").`;

const JSON_SCHEMA = `{
  "sections": {
    "summary": {
      "content": "<extracted summary text or empty string if absent>",
      "length": <word count as integer>
    },
    "skills": {
      "technical": ["<skill1>", "<skill2>"],
      "soft": ["<soft skill1>"],
      "total": <total skill count>
    },
    "experience": [
      {
        "role": "<job title>",
        "company": "<company name>",
        "duration": "<e.g. Jan 2024 – Present>",
        "description": ["<bullet point 1>", "<bullet point 2>"],
        "impactScore": <0–100 based on quantified achievements>
      }
    ],
    "education": [
      {
        "degree": "<degree name>",
        "institution": "<institution name>",
        "year": "<graduation year or range>",
        "score": "<CGPA/GPA/percentage or empty>"
      }
    ],
    "projects": [
      {
        "title": "<project name>",
        "description": "<one-line description>",
        "techStack": ["<tech1>", "<tech2>"],
        "link": "<GitHub/live URL or empty>"
      }
    ]
  },
  "sectionScores": {
    "summary":    { "score": <0–20>, "maxScore": 20, "breakdown": [{ "label": "<criterion>", "earned": <points>, "max": <max> }] },
    "skills":     { "score": <0–20>, "maxScore": 20, "breakdown": [{ "label": "<criterion>", "earned": <points>, "max": <max> }] },
    "experience": { "score": <0–20>, "maxScore": 20, "breakdown": [{ "label": "<criterion>", "earned": <points>, "max": <max> }] },
    "education":  { "score": <0–20>, "maxScore": 20, "breakdown": [{ "label": "<criterion>", "earned": <points>, "max": <max> }] },
    "projects":   { "score": <0–20>, "maxScore": 20, "breakdown": [{ "label": "<criterion>", "earned": <points>, "max": <max> }] },
    "keywords":   { "score": <0–20>, "maxScore": 20, "breakdown": [{ "label": "<criterion>", "earned": <points>, "max": <max> }] },
    "formatting": { "score": <0–20>, "maxScore": 20, "breakdown": [{ "label": "<criterion>", "earned": <points>, "max": <max> }] }
  },
  "suggestions": [
    {
      "message": "<clear description of the issue>",
      "section": "<one of: summary | skills | experience | education | projects | keywords | formatting | general>",
      "severity": "<one of: critical | high | medium | low>",
      "type": "<one of: missing_content | weak_language | missing_metrics | keyword_gap | formatting_issue | duplicate_content | improvement>",
      "fix": "<specific, actionable fix instruction>",
      "example": {
        "before": "<exact problematic text from resume>",
        "after": "<improved rewritten version>"
      },
      "atsImpact": <true if this directly affects ATS parsing or scoring>
    }
  ],
  "improvedContent": {
    "summary": "<STRING (not an array/object): fully rewritten professional summary optimized for ATS and the detected target role, as one block of plain text>",
    "experience": "<STRING (not an array/object): rewritten strongest experience bullet points with metrics and action verbs, as one block of plain text using \\n between bullets>",
    "projects": "<STRING (not an array/object): rewritten project descriptions with stronger technical impact statements, as one block of plain text using \\n between projects>"
  },
  "detectedRole": "<inferred target job role, e.g. Flutter Developer | Full Stack Engineer | Data Scientist>",
  "analysisDepth": "advanced_semantic"
}`;

const buildTextPrompt = (rawText, experienceLevel) =>
    `Experience Level: ${experienceLevel}

Resume Text:
${rawText}

Analyze the above resume thoroughly using the scoring rubric and return a JSON object with EXACTLY this structure (fill all fields with real data from the resume):
${JSON_SCHEMA}`;

const buildDocumentPrompt = (experienceLevel) =>
    `Experience Level: ${experienceLevel}

Analyze the resume in the attached PDF thoroughly using the scoring rubric and return a JSON object with EXACTLY this structure (fill all fields with real data from the resume):
${JSON_SCHEMA}`;

const fetchPdfAsBase64 = async (fileUrl) => {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
};

const VALID_TYPES = new Set([
    "missing_content", "weak_language", "missing_metrics",
    "keyword_gap", "formatting_issue", "duplicate_content", "improvement",
]);
const VALID_SEVERITIES = new Set(["low", "medium", "high", "critical"]);
const VALID_SECTIONS = new Set([
    "summary", "skills", "experience", "education",
    "projects", "formatting", "keywords", "general",
]);

const sanitiseSuggestions = (suggestions = []) =>
    suggestions.map((s) => ({
        ...s,
        type: VALID_TYPES.has(s.type) ? s.type : "improvement",
        severity: VALID_SEVERITIES.has(s.severity) ? s.severity : "medium",
        section: VALID_SECTIONS.has(s.section) ? s.section : "general",
    }));

// The model is asked for a plain string per improvedContent field, but LLMs
// occasionally return a structured array/object instead (e.g. mirroring
// `sections.experience`). Coerce defensively so a format deviation never
// crashes the whole analysis via a Mongoose cast error.
const stringifyImprovedContentEntry = (item) => {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return String(item ?? "");

    const heading = [item.role || item.title, item.company].filter(Boolean).join(" — ");
    const meta = [item.duration, Array.isArray(item.techStack) ? item.techStack.join(", ") : null]
        .filter(Boolean)
        .join(" | ");
    const bullets = Array.isArray(item.description)
        ? item.description.map((d) => `- ${d}`).join("\n")
        : item.description || "";

    return [heading, meta, bullets].filter(Boolean).join("\n");
};

const coerceImprovedContentField = (value) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(stringifyImprovedContentEntry).join("\n\n");
    if (value && typeof value === "object") return stringifyImprovedContentEntry(value);
    return value == null ? "" : String(value);
};

const sanitiseImprovedContent = (improvedContent = {}) => ({
    summary: coerceImprovedContentField(improvedContent.summary),
    experience: coerceImprovedContentField(improvedContent.experience),
    projects: coerceImprovedContentField(improvedContent.projects),
});

const initiateAnalysis = async ({ fileId, userId, fileUrl, rawText = "", pdfBase64 = "", experienceLevel = "fresher" }) => {
    const analysis = await resumeAnalysisModel.create({
        userId,
        fileId,
        experienceLevel,
        status: "processing",
    });

    runAnalysis(analysis._id, fileUrl, rawText, pdfBase64, experienceLevel).catch(async (err) => {
        console.error("[analysis] runAnalysis failed:", err.message);
        try {
            const doc = await resumeAnalysisModel.findById(analysis._id);
            if (doc) await doc.markFailed(err.message);
        } catch (saveErr) {
            console.error("[analysis] markFailed error:", saveErr.message);
        }
    });

    return analysis;
};

const runAnalysis = async (analysisId, fileUrl, rawText, pdfBase64, experienceLevel) => {
    let contents;

    if (rawText && rawText.trim().length > 50) {
        contents = buildTextPrompt(rawText, experienceLevel);
    } else {
        const base64Pdf = pdfBase64 || await fetchPdfAsBase64(fileUrl);
        contents = [
            {
                role: "user",
                parts: [
                    { inlineData: { mimeType: "application/pdf", data: base64Pdf } },
                    { text: buildDocumentPrompt(experienceLevel) },
                ],
            },
        ];
    }

    const response = await genAI.models.generateContent({
        model: ENV.GEMINI_MODEL,
        contents,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            maxOutputTokens: 16000,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
        },
    });

    if (response.candidates?.[0]?.finishReason === "MAX_TOKENS") {
        throw new Error("AI response was cut off — increase max_tokens");
    }

    const text = response.text;
    if (!text) throw new Error("No text response from AI");

    const raw = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(raw);

    const analysis = await resumeAnalysisModel.findById(analysisId);
    if (!analysis) throw new Error("Analysis record not found");

    analysis.sections = parsed.sections;
    analysis.sectionScores = parsed.sectionScores;
    analysis.suggestions = sanitiseSuggestions(parsed.suggestions);
    analysis.improvedContent = sanitiseImprovedContent(parsed.improvedContent);
    analysis.detectedRole = parsed.detectedRole || "";
    analysis.analysisDepth = parsed.analysisDepth || "advanced_semantic";

    await analysis.markCompleted();
};

export { initiateAnalysis };
