// Copyright 2020 Google LLC. All rights reserved.
// Use of this source code is governed by the Apache 2.0
// license that can be found in the LICENSE file.

// [START cloudrun_pubsub_server]
// [START run_pubsub_server]
import dotenv from "dotenv";

console.log("Loading environment variables");
dotenv.config({
  path:
    process.env.NODE_ENV === "production"
      ? "/secrets/ipso-pubsub"
      : ".env.local",
});

import app from "./app";
import { getAccessToken } from "./src/lib/calendars";
import { watchInbox } from "./src/lib/gmail";
import { getAllUserIds } from "./src/lib/supabase";
const PORT = process.env.PORT || 8080;

const runCode = async () => {
  console.log("Fetching user ids");
  const userIds = await getAllUserIds();

  for (let index = 0; index < userIds.length; index++) {
    const userId = userIds[index];
    console.log(`Getting access token for userId: ${userId}`);
    const accessToken = await getAccessToken("google", userId);
    console.log("Watching inbox");
    await watchInbox(accessToken);
  }
  app.listen(PORT, () => console.log(`ipso-pubsub listening on port ${PORT}`));
};

runCode();

// [END run_pubsub_server]
// [END cloudrun_pubsub_server]
