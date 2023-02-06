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
const openai_1 = require("./src/lib/openai");
const schema_1 = require("./src/lib/schema");
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
        await Promise.all(messages.map(async (msg) => {
            var _a, _b, _c;
            const res = await gmail.users.messages.get({
                userId: "me",
                id: msg.id || "",
            });
            console.log("Got email", res.data);
            console.log("Determining if schedule request");
            const isScheduleRequest = await (0, openai_1.getIsScheduleRequest)(res.data.snippet);
            console.log("isScheduleRequest", isScheduleRequest);
            let gptAnswer = [];
            if (isScheduleRequest) {
                console.log("Found scheduling request, running GPT-3");
                gptAnswer = await (0, openai_1.getGpt)(res.data.snippet || "");
            }
            const emailDb = (0, schema_1.toEmailDb)({
                userId,
                emailId: res.data.id || "",
                threadId: res.data.threadId || "",
                body: res.data.snippet || "",
                subject: ((_c = (_b = (_a = res.data.payload) === null || _a === void 0 ? void 0 : _a.headers) === null || _b === void 0 ? void 0 : _b.find((h) => h.name === "Subject")) === null || _c === void 0 ? void 0 : _c.value) || "",
                isScheduleRequest,
                gptAnswer,
            });
            console.log("Saving email to db", emailDb);
            const emailRes = await (0, supabase_1.createEmailRecord)(emailDb);
            console.log("Saved email to db", emailRes);
            return res.data;
        }));
    }
    res.status(204).send();
});
app.get("/", (req, res) => {
    res.status(200).send({ message: "Hello World!" });
});
// [END run_pubsub_handler]
// [END cloudrun_pubsub_handler]
exports.default = app;
