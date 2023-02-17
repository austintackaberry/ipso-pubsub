// Copyright 2020 Google LLC. All rights reserved.
// Use of this source code is governed by the Apache 2.0
// license that can be found in the LICENSE file.

// [START cloudrun_pubsub_server_setup]
// [START run_pubsub_server_setup]
import express from "express";
import { DateTime } from "luxon";
import {
  getAccessToken,
  getCalendarsForUser,
  getGoogleEvents,
} from "./src/lib/calendars";
import { getEmails, getGmail } from "./src/lib/gmail";
import { getIsScheduleRequest, getGpt, getRawGpt } from "./src/lib/openai";
import { getEmailToSendPrompt } from "./src/lib/prompt";
import { toEmailDb } from "./src/lib/schema";
import {
  createEmailRecord,
  getUserIdByEmail,
  publicSupabase,
} from "./src/lib/supabase";
import {
  aggregateTimes,
  createGmailDraft,
  findTimes,
  getGmailThread,
} from "./src/lib/utils";
const app = express();

const getCalendarData = async (userId: string, accessToken: string) => {
  const calendars = await getCalendarsForUser("google", userId);
  const calendarIds = calendars.map((c) => c.calendar_id);
  const events = await getGoogleEvents(accessToken, calendarIds);
  return events;
};

// This middleware is available in Express v4.16.0 onwards
app.use(express.json());
// [END run_pubsub_server_setup]
// [END cloudrun_pubsub_server_setup]

// [START cloudrun_pubsub_handler]
// [START run_pubsub_handler]
app.post("/", async (req, res) => {
  if (!req.body) {
    const msg = "no Pub/Sub message received";
    console.error(`error: ${msg}`);
    res.status(400).send(`Bad Request: ${msg}`);
    return;
  }
  if (!req.body.message) {
    const msg = "invalid Pub/Sub message format";
    console.error(`error: ${msg}`);
    res.status(400).send(`Bad Request: ${msg}`);
    return;
  }
  console.log("Received valid Pub/Sub message");
  const pubSubMessage = req.body.message;
  if (!pubSubMessage.data) {
    const msg = "invalid Pub/Sub message format";
    console.error(`error: ${msg}`);
    res.status(400).send(`Bad Request: ${msg}`);
    return;
  }
  const data = JSON.parse(Buffer.from(pubSubMessage.data, "base64").toString());
  console.log(
    JSON.stringify({
      messageId: pubSubMessage.messageId,
      publishTime: pubSubMessage.publishTime,
      data,
    })
  );
  const { emailAddress, historyId } = data;
  let userId = "";
  try {
    userId = await getUserIdByEmail(emailAddress);
  } catch (e: any) {
    console.log("Error getting user id", e);
    res.status(204).send();
    return;
  }
  console.log("Getting access token");
  const accessToken = await getAccessToken("google", userId);

  console.log("Getting history");
  const history = await getEmails(accessToken, historyId, userId);
  console.log(JSON.stringify({ history }));
  const messages = (history.history || []).map((h) => h?.messages || []).flat();
  console.log(JSON.stringify({ messages }));
  const gmail = getGmail(accessToken);
  console.log("Building functions");
  // run async logic on each message in series
  for (const msg of messages) {
    try {
      console.log("Getting email");
      const res = await gmail.users.messages.get({
        userId: "me",
        id: msg.id || "",
      });
      console.log(JSON.stringify({ res }));
      // Ignore email if it is a draft
      if (res.data.labelIds?.includes("DRAFT")) {
        console.log("Ignoring draft");
        continue;
      }
      console.log("Got email");
      console.log(res.data.snippet);
      console.log("Determining if schedule request");
      const isScheduleRequest = await getIsScheduleRequest(res.data.snippet);
      console.log("isScheduleRequest", isScheduleRequest);
      if (!isScheduleRequest) {
        console.log("Not a scheduling request, skipping...");
        continue;
      }
      console.log("Found scheduling request, running GPT-3");
      const gptAnswer = await getGpt(res.data.snippet || "");
      console.log(JSON.stringify({ gptAnswer }));
      // get from email address
      const fromEmail = res.data.payload?.headers?.find(
        (h) => h.name === "From"
      )?.value;

      const emailId = res.data.id || "";
      // continue if email is already in db
      const emailFromDb = await publicSupabase
        .from("emails")
        .select("*")
        .eq("email_id", emailId)
        .single();
      if (emailFromDb.data) {
        console.log("Email already in db");
        continue;
      }

      console.log("Getting calendar data");
      const events = await getCalendarData(userId, accessToken);
      console.log("finding times");
      console.log(JSON.stringify({ events, gptAnswer }));
      const times = findTimes(events, gptAnswer);
      console.log("received times", JSON.stringify({ times }));
      console.log("aggregating times");
      const aggregatedTimes = aggregateTimes(times);
      const emailDb = toEmailDb({
        userId,
        emailId,
        threadId: res.data.threadId || "",
        body: res.data.snippet || "",
        subject:
          res.data.payload?.headers?.find((h) => h.name === "Subject")?.value ||
          "",
        isScheduleRequest,
        gptAnswer,
        times: aggregatedTimes,
      });
      console.log("Saving email to db");
      await createEmailRecord(emailDb);
      console.log("Saved email to db");
      console.log(
        "received aggregated times",
        JSON.stringify({ aggregatedTimes })
      );
      const formattedTimes = aggregatedTimes
        .map(({ start, end }) => {
          return `${DateTime.fromJSDate(new Date(start))
            .setZone("America/Los_Angeles")
            .toFormat("ccc LLL dd h:mm")} – ${DateTime.fromJSDate(new Date(end))
            .setZone("America/Los_Angeles")
            .toFormat("h:mm a ZZZZ")}`;
        })
        .join("\n");
      console.log("Getting gmail thread");
      const emailThread = await getGmailThread(
        accessToken,
        res.data.threadId || "",
        emailAddress
      );
      console.log("Received email thread");
      console.log(JSON.stringify({ emailThread }));
      console.log("Getting email to send prompt");
      const emailToSendPrompt = getEmailToSendPrompt(
        new Date(),
        formattedTimes,
        emailThread
      );
      console.log("get raw gpt");
      const resAnswer = await getRawGpt(
        emailToSendPrompt,
        "---Austin's response starts here---"
      );
      const reply = resAnswer?.split("---Austin's response ends here---")[0];
      // TODO: Create a draft email with the times
      console.log("create gmail draft");
      await createGmailDraft(
        accessToken,
        res.data.threadId || "",
        emailAddress,
        fromEmail || "",
        reply || ""
      );
      // save reply to db in emails table for a given emailId
      console.log("save reply to db");
      const { data: emailData, error: emailError } = await publicSupabase
        .from("emails")
        .update({ reply, times })
        .eq("email_id", emailId);
      if (emailError) {
        console.error("Error saving reply to db", emailError);
        continue;
      }
      console.log("Saved reply to db");
    } catch (e: any) {
      console.error("Error processing email", e);
    }
  }
  console.log("Done calling functions");

  res.status(204).send();
});

app.get("/", (req, res) => {
  res.status(200).send({ message: "Hello World!" });
});
// [END run_pubsub_handler]
// [END cloudrun_pubsub_handler]

export default app;
