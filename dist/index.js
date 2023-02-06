"use strict";
// Copyright 2020 Google LLC. All rights reserved.
// Use of this source code is governed by the Apache 2.0
// license that can be found in the LICENSE file.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// [START cloudrun_pubsub_server]
// [START run_pubsub_server]
const dotenv_1 = __importDefault(require("dotenv"));
console.log("Loading environment variables");
dotenv_1.default.config({
    path: process.env.NODE_ENV === "production"
        ? "/secrets/ipso-pubsub"
        : ".env.local",
});
const app_1 = __importDefault(require("./app"));
const calendars_1 = require("./src/lib/calendars");
const gmail_1 = require("./src/lib/gmail");
const supabase_1 = require("./src/lib/supabase");
const PORT = process.env.PORT || 8080;
const runCode = async () => {
    console.log("Fetching user ids");
    const userIds = await (0, supabase_1.getAllUserIds)();
    for (let index = 0; index < userIds.length; index++) {
        const userId = userIds[index];
        console.log(`Getting access token for userId: ${userId}`);
        const accessToken = await (0, calendars_1.getAccessToken)("google", userId);
        console.log("Watching inbox");
        await (0, gmail_1.watchInbox)(accessToken);
    }
    app_1.default.listen(PORT, () => console.log(`ipso-pubsub listening on port ${PORT}`));
};
runCode();
// [END run_pubsub_server]
// [END cloudrun_pubsub_server]
