import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { getOrigin } from "./utils";
import { publicSupabase } from "./supabase";

export const getOauthClient = () =>
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${getOrigin()}/api/auth/callback/google`
  );

export const getGmail = (accessToken: string) => {
  const oAuth2Client = getOauthClient();
  oAuth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oAuth2Client });
};

export const watchInbox = async (accessToken: string, userId: string) => {
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
  // Get historyId from response
  const historyId = res.data.historyId;
  // Save historyId to public.profile table in supabase for userId
  const { data, error } = await publicSupabase
    .from("profiles")
    .update({ history_id: historyId })
    .eq("id", userId);
  if (error) {
    console.error(error);
  }
  return;
};

// get gmail emails starting from and including the message for a given history id
export const getEmails = async (
  accessToken: string,
  msgHistoryId: string,
  userId: string
) => {
  console.log(accessToken, msgHistoryId, userId);
  const { data, error } = await publicSupabase
    .from("profiles")
    .select("history_id")
    .eq("id", userId);
  if (error) {
    throw error;
  }
  console.log("data", JSON.stringify(data));
  const historyId = data[0].history_id;
  const oAuth2Client = getOauthClient();
  oAuth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const res = await gmail.users.history.list({
    userId: "me",
    startHistoryId: historyId,
  });

  console.log(JSON.stringify(res));

  // Update history id in public.profile table with msgHistoryId
  const { data: updateData, error: updateError } = await publicSupabase
    .from("profiles")
    .update({ history_id: msgHistoryId })
    .eq("id", userId);
  if (updateError) {
    throw updateError;
  }

  return res.data;
};
