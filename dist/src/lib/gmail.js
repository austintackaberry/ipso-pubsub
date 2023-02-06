"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmails = exports.watchInbox = void 0;
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
const utils_1 = require("./utils");
const getOauthClient = () => new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${(0, utils_1.getOrigin)()}/api/auth/callback/google`);
const watchInbox = async (accessToken) => {
    const oAuth2Client = getOauthClient();
    oAuth2Client.setCredentials({ access_token: accessToken });
    const gmail = googleapis_1.google.gmail({ version: "v1", auth: oAuth2Client });
    const watchRequest = {
        labelIds: ["INBOX"],
        topicName: "projects/ipso-375715/topics/ipso-gmail",
    };
    const res = await gmail.users.watch({
        userId: "me",
        requestBody: watchRequest,
    });
    console.log(res.data);
};
exports.watchInbox = watchInbox;
const getEmails = async (accessToken, historyId) => {
    const oAuth2Client = getOauthClient();
    oAuth2Client.setCredentials({ access_token: accessToken });
    const gmail = googleapis_1.google.gmail({ version: "v1", auth: oAuth2Client });
    const res = await gmail.users.history.list({
        userId: "me",
        startHistoryId: historyId,
    });
    return res.data;
};
exports.getEmails = getEmails;
