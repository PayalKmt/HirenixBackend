
import { getGoogleAuthURL, handleGoogleCallback, getLinkedInAuthURL, handleLinkedInCallback } from "../service/oauth.service.js";
import { ENV } from "../utils/env.js";

const googleAuth = (req, res) => {
    const url = getGoogleAuthURL();
    res.redirect(url);
};

const googleCallbacks = async (req, res) => {
    try {
        const code = req.query.code;

        const userData = await handleGoogleCallback(code);

        //  here you can generate JWT / session
        const token = await userData.generateAuthToken();


        // 7 day Access
        res.cookie("token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
            secure: ENV.NODE_ENV === "development" ? false : true,
        });
        //TODO: after login Success then move to which route
        // res.redirect("http://localhost:5173/dashboard"); 
        res.redirect("https://www.google.com/");

    } catch (error) {
        console.error(error.message);
        res.send("OAuth failed");
    }
};

// LINKED IN PART
const linkedinAuth = (req, res) => {
    const url = getLinkedInAuthURL();
    res.redirect(url);
};

const linkedinCallbacks = async (req, res) => {
    try {
        const code = req.query.code;

        const userData = await handleLinkedInCallback(code);

        //  here you can generate JWT / session
        const token = await userData.generateAuthToken();


        // 7 day Access
        res.cookie("token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
            secure: ENV.NODE_ENV === "development" ? false : true,
        });
        //TODO: after login Success then move to which route
        // res.redirect("http://localhost:5173/dashboard"); 
        res.redirect("https://www.linkedin.com/");

    } catch (error) {
        console.error(error.message);
        res.send("OAuth failed");
    }
};

export { googleAuth, googleCallbacks, linkedinAuth, linkedinCallbacks };
