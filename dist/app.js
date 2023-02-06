"use strict";
// Copyright 2020 Google LLC. All rights reserved.
// Use of this source code is governed by the Apache 2.0
// license that can be found in the LICENSE file.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// [START cloudrun_pubsub_server_setup]
// [START run_pubsub_server_setup]
const express_1 = __importDefault(require("express"));
const calendars_1 = require("./src/lib/calendars");
const gmail_1 = require("./src/lib/gmail");
const supabase_1 = require("./src/lib/supabase");
const app = (0, express_1.default)();
// This middleware is available in Express v4.16.0 onwards
app.use(express_1.default.json());
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
        const data = JSON.parse(Buffer.from(pubSubMessage.data, "base64").toString());
        console.log({
            messageId: pubSubMessage.messageId,
            publishTime: pubSubMessage.publishTime,
            data,
        });
        const { emailAddress, historyId } = data;
        const userId = await (0, supabase_1.getUserIdByEmail)(emailAddress);
        const accessToken = await (0, calendars_1.getAccessToken)("google", userId);
        const history = await (0, gmail_1.getEmails)(accessToken, historyId);
        const messages = (history.history || [])
            .map((h) => (h === null || h === void 0 ? void 0 : h.messages) || [])
            .flat();
        const gmail = (0, gmail_1.getGmail)(accessToken);
        const emails = await Promise.all(messages.map(async (msg) => {
            const res = await gmail.users.messages.get({
                userId: "me",
                id: msg.id || "",
            });
            console.log(JSON.stringify(res));
            return res.data;
        }));
        console.log(JSON.stringify(emails, null, 2));
    }
    res.status(204).send();
});
app.get("/", (req, res) => {
    res.status(200).send({ message: "Hello World!" });
});
// [END run_pubsub_handler]
// [END cloudrun_pubsub_handler]
exports.default = app;
