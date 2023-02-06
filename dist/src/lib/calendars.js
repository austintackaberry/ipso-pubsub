"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.getGoogleScopes = exports.getCalendarsForUser = exports.getGoogleCalendars = exports.getGoogleEvents = exports.getAccessToken = exports.refreshTokenGoogle = void 0;
const googleapis_1 = require("googleapis");
const db_1 = require("./db");
const gmail_1 = require("./gmail");
const refreshTokenGoogle = async (refreshToken) => {
    const url = "https://oauth2.googleapis.com/token?" +
        new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        });
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
    });
    return await response.json();
};
exports.refreshTokenGoogle = refreshTokenGoogle;
/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
const getAccessToken = async (provider, userId) => {
    var _a;
    const result = await db_1.pool.query(`SELECT access_token, refresh_token, expires_at from next_auth.accounts where "userId" = $1 and provider = $2`, [userId, provider]);
    if (result.rows.length === 0) {
        throw new Error("Account not set up");
    }
    const { access_token, refresh_token, expires_at } = result.rows[0];
    if (Date.now() < expires_at * 1000) {
        return access_token;
    }
    const refreshedTokens = await (0, exports.refreshTokenGoogle)(refresh_token);
    if (refreshedTokens.error === "invalid_grant") {
        await db_1.pool.query(`DELETE FROM next_auth.accounts
      WHERE "userId" = $1 AND provider = $2`, [userId, provider]);
        throw new Error("Token has been expired or revoked");
    }
    const newToken = {
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: refreshedTokens.expires_in,
        refreshToken: (_a = refreshedTokens.refresh_token) !== null && _a !== void 0 ? _a : refresh_token, // Fall back to old refresh token
    };
    await db_1.pool.query(`UPDATE next_auth.accounts SET 
        access_token = $1,
        refresh_token = $2,
        expires_at = $3
      WHERE "userId" = $4 AND provider = $5`, [
        newToken.accessToken,
        newToken.refreshToken,
        newToken.accessTokenExpires,
        userId,
        provider,
    ]);
    return newToken.accessToken;
};
exports.getAccessToken = getAccessToken;
const getGoogleEvents = async (accessToken, calendarIds) => {
    const oAuth2Client = (0, gmail_1.getOauthClient)();
    oAuth2Client.setCredentials({ access_token: accessToken });
    const calendar = googleapis_1.google.calendar({ version: "v3", auth: oAuth2Client });
    // Use the map method to call the list method for each calendar ID
    const events = await Promise.all(calendarIds.map((calendarId) => calendar.events.list({
        calendarId,
        timeMin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        maxResults: 200,
        singleEvents: true,
        orderBy: "startTime",
    })));
    // Use the flatMap method to flatten the array of event lists into a single array
    const flattenedEvents = events
        .flatMap((eventRes) => eventRes.data.items)
        // Filter out events where the user is an attendee and has declined the event
        .filter((e) => {
        if (!(e === null || e === void 0 ? void 0 : e.attendees)) {
            return true;
        }
        const selfAttendee = e === null || e === void 0 ? void 0 : e.attendees.find((a) => a.self);
        if (!selfAttendee) {
            return true;
        }
        if (selfAttendee.responseStatus === "declined") {
            return false;
        }
        return true;
    });
    return flattenedEvents.map((event, i) => {
        var _a, _b;
        return {
            start: new Date(((_a = event === null || event === void 0 ? void 0 : event.start) === null || _a === void 0 ? void 0 : _a.dateTime) || ""),
            end: new Date(((_b = event === null || event === void 0 ? void 0 : event.end) === null || _b === void 0 ? void 0 : _b.dateTime) || ""),
            title: event === null || event === void 0 ? void 0 : event.summary,
        };
    });
};
exports.getGoogleEvents = getGoogleEvents;
const getGoogleCalendars = async (accessToken) => {
    const oAuth2Client = (0, gmail_1.getOauthClient)();
    oAuth2Client.setCredentials({ access_token: accessToken });
    // Create a new Google Calendar API client
    const calendar = googleapis_1.google.calendar({ version: "v3", auth: oAuth2Client });
    // Fetch a list of the user's calendars
    const res = await calendar.calendarList.list();
    return res.data.items;
};
exports.getGoogleCalendars = getGoogleCalendars;
const getCalendarsForUser = async (provider, userId) => {
    const result = await db_1.pool.query(`SELECT * FROM calendars WHERE user_id = $1 and provider_id = $2`, [userId, provider]);
    return result.rows;
};
exports.getCalendarsForUser = getCalendarsForUser;
const getGoogleScopes = async (accessToken) => {
    const oAuth2Client = (0, gmail_1.getOauthClient)();
    const tokenInfo = await oAuth2Client.getTokenInfo(accessToken);
    return tokenInfo.scopes;
};
exports.getGoogleScopes = getGoogleScopes;
const deleteAccount = (userId, provider) => {
    return db_1.pool.query(`DELETE FROM next_auth.accounts
      WHERE "userId" = $1 AND provider = $2`, [userId, provider]);
};
exports.deleteAccount = deleteAccount;
