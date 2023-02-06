import { Event } from "@/src/types";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

import { pool } from "./db";
import { getOrigin } from "./utils";

export const refreshTokenGoogle = async (refreshToken: string) => {
  const url =
    "https://oauth2.googleapis.com/token?" +
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

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
export const getAccessToken = async (
  provider: "google" | "azure-ad",
  userId: string
): Promise<string> => {
  const result = await pool.query(
    `SELECT access_token, refresh_token, expires_at from next_auth.accounts where "userId" = $1 and provider = $2`,
    [userId, provider]
  );
  if (result.rows.length === 0) {
    throw new Error("Account not set up");
  }
  const { access_token, refresh_token, expires_at } = result.rows[0];
  if (Date.now() < expires_at * 1000) {
    return access_token;
  }
  const refreshedTokens = await refreshTokenGoogle(refresh_token);
  if (refreshedTokens.error === "invalid_grant") {
    await pool.query(
      `DELETE FROM next_auth.accounts
      WHERE "userId" = $1 AND provider = $2`,
      [userId, provider]
    );
    throw new Error("Token has been expired or revoked");
  }
  const newToken = {
    accessToken: refreshedTokens.access_token,
    accessTokenExpires: refreshedTokens.expires_in,
    refreshToken: refreshedTokens.refresh_token ?? refresh_token, // Fall back to old refresh token
  };
  await pool.query(
    `UPDATE next_auth.accounts SET 
        access_token = $1,
        refresh_token = $2,
        expires_at = $3
      WHERE "userId" = $4 AND provider = $5`,
    [
      newToken.accessToken,
      newToken.refreshToken,
      newToken.accessTokenExpires,
      userId,
      provider,
    ]
  );
  return newToken.accessToken;
};

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${getOrigin()}/api/auth/callback/google`
);

export const getGoogleEvents = async (
  accessToken: string,
  calendarIds: string[]
): Promise<Event[]> => {
  oAuth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
  // Use the map method to call the list method for each calendar ID
  const events = await Promise.all(
    calendarIds.map((calendarId) =>
      calendar.events.list({
        calendarId,
        timeMin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        maxResults: 200,
        singleEvents: true,
        orderBy: "startTime",
      })
    )
  );

  // Use the flatMap method to flatten the array of event lists into a single array
  const flattenedEvents = events
    .flatMap((eventRes) => eventRes.data.items)
    // Filter out events where the user is an attendee and has declined the event
    .filter((e) => {
      if (!e?.attendees) {
        return true;
      }
      const selfAttendee = e?.attendees.find((a) => a.self);
      if (!selfAttendee) {
        return true;
      }
      if (selfAttendee.responseStatus === "declined") {
        return false;
      }
      return true;
    });
  return flattenedEvents.map((event, i) => {
    return {
      start: new Date(event?.start?.dateTime || ""),
      end: new Date(event?.end?.dateTime || ""),
      title: event?.summary,
    } as Event;
  });
};

export const getGoogleCalendars = async (accessToken: string) => {
  oAuth2Client.setCredentials({ access_token: accessToken });
  // Create a new Google Calendar API client
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  // Fetch a list of the user's calendars
  const res = await calendar.calendarList.list();
  return res.data.items;
};

export const getCalendarsForUser = async (provider: string, userId: string) => {
  const result = await pool.query(
    `SELECT * FROM calendars WHERE user_id = $1 and provider_id = $2`,
    [userId, provider]
  );
  return result.rows;
};

export const getGoogleScopes = async (accessToken: string) => {
  const tokenInfo = await oAuth2Client.getTokenInfo(accessToken);
  return tokenInfo.scopes;
};

export const deleteAccount = (userId: string, provider: string) => {
  return pool.query(
    `DELETE FROM next_auth.accounts
      WHERE "userId" = $1 AND provider = $2`,
    [userId, provider]
  );
};
