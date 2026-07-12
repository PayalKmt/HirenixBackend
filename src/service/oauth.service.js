import { ENV } from "../utils/env.js";
import user from "../model/user.model.js";
import axios from "axios";
import qs from "querystring";

const getGoogleAuthURL = () => {
    return `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${ENV.GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${ENV.GOOGLE_REDIRECT_URI}` +
        `&response_type=code` +
        `&scope=profile email`;
};


const handleGoogleCallback = async (code) => {


    const tokenRes = await axios.post(
        "https://oauth2.googleapis.com/token",
        {
            code,
            client_id: ENV.GOOGLE_CLIENT_ID,
            client_secret: ENV.GOOGLE_CLIENT_SECRET,
            redirect_uri: ENV.GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code",
        }
    );

    const accessToken = tokenRes.data.access_token;


    const userRes = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    const userData = userRes.data;

    let existingUser = await user.findOne({ email: userData.email });
    if (!existingUser) {
        existingUser = await user.create({
            email: userData.email,
            fullname: userData.name,
            provider: "google",
            googleId: userData.id,
            profilePics: userData.picture,
            password: null
        });
    }

    return existingUser;
};


// LINKEDIN PART
const getLinkedInAuthURL = () => {
    return `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code` +
        `&client_id=${ENV.LINKEDIN_CLIENT_ID}` +
        `&redirect_uri=${ENV.LINKEDIN_REDIRECT_URI}` +
        `&scope=openid profile email`;
};

const handleLinkedInCallback = async (code) => {


    const tokenRes = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        qs.stringify({
            grant_type: "authorization_code",
            code,
            redirect_uri: ENV.LINKEDIN_REDIRECT_URI,
            client_id: ENV.LINKEDIN_CLIENT_ID,
            client_secret: ENV.LINKEDIN_CLIENT_SECRET
        }),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );

    const accessToken = tokenRes.data.access_token;


    const profileRes = await axios.get(
        "https://api.linkedin.com/v2/userinfo",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    const linkedinUser = profileRes.data;


    let existingUser = await user.findOne({
        email: linkedinUser.email
    });

    if (!existingUser) {
        existingUser = await user.create({
            email: linkedinUser.email,
            fullname: linkedinUser.name,
            provider: "linkedin",
            googleId: null,
            password: null,
            profilePics: linkedinUser.picture
        });
    }

    return existingUser;
};


export { getGoogleAuthURL, handleGoogleCallback, getLinkedInAuthURL, handleLinkedInCallback };