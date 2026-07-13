import { getGoogleAuthURL, handleGoogleCallback, getLinkedInAuthURL, handleLinkedInCallback } from "../service/oauth.service.js";
import { ENV } from "../utils/env.js";

const REDIRECT_URI = "hirenix://auth/callback";

const googleAuth = (req, res) => {
    const url = getGoogleAuthURL();
    res.redirect(url);
};

const googleCallbacks = async (req, res) => {
    try {
        const code = req.query.code;
        const userData = await handleGoogleCallback(code);
        const token = await userData.generateAuthToken();

        // Also set the cookie (for web)
        res.cookie("token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
            secure: ENV.NODE_ENV === "development" ? false : true,
        });

        // Redirect back to app with token
        res.redirect(`${REDIRECT_URI}?token=${token}`);
    } catch (error) {
        console.error(error.message);
        res.redirect(`${REDIRECT_URI}?error=${encodeURIComponent(error.message)}`);
    }
};

const linkedinAuth = (req, res) => {
    const url = getLinkedInAuthURL();
    res.redirect(url);
};

const linkedinCallbacks = async (req, res) => {
    try {
        const code = req.query.code;
        const userData = await handleLinkedInCallback(code);
        const token = await userData.generateAuthToken();

        res.cookie("token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
            secure: ENV.NODE_ENV === "development" ? false : true,
        });

        res.redirect(`${REDIRECT_URI}?token=${token}`);
    } catch (error) {
        console.error(error.message);
        res.redirect(`${REDIRECT_URI}?error=${encodeURIComponent(error.message)}`);
    }
};

export { googleAuth, googleCallbacks, linkedinAuth, linkedinCallbacks };
