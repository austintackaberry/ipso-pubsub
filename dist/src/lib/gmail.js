"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmails = exports.watchInbox = exports.getGmail = exports.getOauthClient = void 0;
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
const utils_1 = require("./utils");
const supabase_1 = require("./supabase");
const getOauthClient = () => new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${(0, utils_1.getOrigin)()}/api/auth/callback/google`);
exports.getOauthClient = getOauthClient;
const getGmail = (accessToken) => {
    const oAuth2Client = (0, exports.getOauthClient)();
    oAuth2Client.setCredentials({ access_token: accessToken });
    return googleapis_1.google.gmail({ version: "v1", auth: oAuth2Client });
};
exports.getGmail = getGmail;
const watchInbox = async (accessToken, userId) => {
    const oAuth2Client = (0, exports.getOauthClient)();
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
    // Get historyId from response
    const historyId = res.data.historyId;
    // Save historyId to public.profile table in supabase for userId
    const { data, error } = await supabase_1.publicSupabase
        .from("profiles")
        .update({ history_id: historyId })
        .eq("id", userId);
    if (error) {
        console.error(error);
    }
    return;
};
exports.watchInbox = watchInbox;
// get gmail emails starting from and including the message for a given history id
const getEmails = async (accessToken, msgHistoryId, userId) => {
    console.log(accessToken, msgHistoryId, userId);
    const { data, error } = await supabase_1.publicSupabase
        .from("profiles")
        .select("history_id")
        .eq("id", userId);
    if (error) {
        throw error;
    }
    console.log("data", JSON.stringify(data));
    const historyId = data[0].history_id;
    const oAuth2Client = (0, exports.getOauthClient)();
    oAuth2Client.setCredentials({ access_token: accessToken });
    const gmail = googleapis_1.google.gmail({ version: "v1", auth: oAuth2Client });
    const res = await gmail.users.history.list({
        userId: "me",
        startHistoryId: historyId,
    });
    console.log(JSON.stringify(res));
    // Update history id in public.profile table with msgHistoryId
    const { data: updateData, error: updateError } = await supabase_1.publicSupabase
        .from("profiles")
        .update({ history_id: msgHistoryId })
        .eq("id", userId);
    if (updateError) {
        throw updateError;
    }
    return res.data;
};
exports.getEmails = getEmails;
