// Copyright 2020 Google LLC. All rights reserved.
// Use of this source code is governed by the Apache 2.0
// license that can be found in the LICENSE file.

// [START cloudrun_pubsub_server_setup]
// [START run_pubsub_server_setup]
import express from "express";
import { getAccessToken } from "./src/lib/calendars";
import { getEmails, getGmail } from "./src/lib/gmail";
import { getUserIdByEmail } from "./src/lib/supabase";
const app = express();

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
  if (pubSubMessage.data) {
    const data = JSON.parse(
      Buffer.from(pubSubMessage.data, "base64").toString()
    );
    console.log({
      messageId: pubSubMessage.messageId,
      publishTime: pubSubMessage.publishTime,
      data,
    });
    const { emailAddress, historyId } = data;
    const userId = await getUserIdByEmail(emailAddress);
    const accessToken = await getAccessToken("google", userId);
    const history = await getEmails(accessToken, historyId);
    const messages = (history.history || [])
      .map((h) => h?.messages || [])
      .flat();
    const gmail = getGmail(accessToken);
    const emails = await Promise.all(
      messages.map(async (msg) => {
        const res = await gmail.users.messages.get({
          userId: "me",
          id: msg.id || "",
        });
        return res.data;
      })
    );
  }
  res.status(204).send();
});
app.get("/", (req, res) => {
  res.status(200).send({ message: "Hello World!" });
});
// [END run_pubsub_handler]
// [END cloudrun_pubsub_handler]

export default app;
