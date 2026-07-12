import NodeCache from "node-cache";
import resumeAnalysisModel from "../model/resumeAnalysis/main_schema.model.js";
import { ENV } from "../utils/env.js";
import AppError from "../utils/ErrorHandler/AppError.js";
import { STATUS } from "../utils/constant/statusCode.js";

const jobCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

const fetchJobsPage = async (query, page) => {
    const url = `https://api.openwebninja.com/jsearch/search?query=${encodeURIComponent(query)}&page=${page}`;
    const res = await fetch(url, {
        headers: { "x-api-key": ENV.RAPIDAPI_KEY },
    });
    if (!res.ok) throw new Error(`Job API error: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
};

const getJobMatches = async ({ analysisId, userId }) => {
    const cached = jobCache.get(analysisId);
    if (cached) return { ...cached, cached: true };

    const analysis = await resumeAnalysisModel.findOne({ _id: analysisId, userId });
    if (!analysis) throw new AppError(STATUS.NOT_FOUND, "Analysis not found");
    if (analysis.status !== "completed") throw new AppError(STATUS.BAD_REQUEST, "Analysis not complete yet");

    const detectedRole = analysis.detectedRole || analysis.sections?.skills?.technical?.[0] || "software developer";
    const level = analysis.experienceLevel;

    // Split on | to support multi-role strings like "Flutter Developer | Full Stack Engineer (MERN)"
    const roles = detectedRole.split("|").map((r) => r.trim()).filter(Boolean);

    // Fetch each role in parallel, one page per role
    let rolePages;
    try {
        rolePages = await Promise.all(
            roles.map((r) => fetchJobsPage(`${r} ${level} india`.trim(), 1))
        );
    } catch (err) {
        console.error("[job-match] API fetch failed:", err.message);
        throw new AppError(STATUS.SERVER_ERROR, "Failed to fetch job listings. Please try again later.");
    }

    // Combine all role results, tagging each job with its matched role
    const rawJobs = rolePages.flatMap((page, i) =>
        page.map((j) => ({ ...j, _matchedRole: roles[i] }))
    );

    const jobs = rawJobs.map((j) => ({
        jobId: j.job_id,
        title: j.job_title,
        company: j.employer_name,
        companyLogo: j.employer_logo,
        publisher: j.job_publisher,
        employmentType: j.job_employment_type,
        location: j.job_location,
        city: j.job_city,
        state: j.job_state,
        isRemote: j.job_is_remote,
        postedAt: j.job_posted_at_datetime_utc,
        salary: j.job_salary_string,
        minSalary: j.job_min_salary,
        maxSalary: j.job_max_salary,
        description: j.job_description,
        applyLink: j.job_apply_link,
        matchedRole: j._matchedRole,
        applyOptions: (j.apply_options || []).map((o) => ({
            publisher: o.publisher,
            link: o.apply_link,
            isDirect: o.is_direct,
        })),
        googleLink: j.job_google_link,
    }));

    const result = { detectedRoles: roles, totalJobs: jobs.length, jobs };
    jobCache.set(analysisId, result);
    return { ...result, cached: false };
};

export { getJobMatches };
