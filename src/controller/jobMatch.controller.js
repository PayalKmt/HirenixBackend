import { STATUS } from "../utils/constant/statusCode.js";
import { getJobMatches } from "../service/jobMatch.service.js";

const getJobMatchesController = async (req, res) => {
    try {
        const { analysisId } = req.params;
        const userId = req.auth._id;
        const result = await getJobMatches({ analysisId, userId });
        res.status(STATUS.OK).json(result);
    } catch (err) {
        res.status(err.statusCode || STATUS.SERVER_ERROR).json({ message: err.message });
    }
};

export { getJobMatchesController };
