import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { getOrigin } from "./utils";

const getOauthClient = () =>
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${getOrigin()}/api/auth/callback/google`
  );

export const watchInbox = async (accessToken: string) => {
  const oAuth2Client = getOauthClient();
  oAuth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
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

export const getEmails = async (accessToken: string, historyId: string) => {
  const oAuth2Client = getOauthClient();
  oAuth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  const res = await gmail.users.history.list({
    userId: "me",
    startHistoryId: historyId,
  });
  return res.data;
};
