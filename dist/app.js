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
const luxon_1 = require("luxon");
const calendars_1 = require("./src/lib/calendars");
const gmail_1 = require("./src/lib/gmail");
const openai_1 = require("./src/lib/openai");
const prompt_1 = require("./src/lib/prompt");
const schema_1 = require("./src/lib/schema");
const supabase_1 = require("./src/lib/supabase");
const utils_1 = require("./src/lib/utils");
const app = (0, express_1.default)();
const getCalendarData = async (userId, accessToken) => {
    const calendars = await (0, calendars_1.getCalendarsForUser)("google", userId);
    const calendarIds = calendars.map((c) => c.calendar_id);
    const events = await (0, calendars_1.getGoogleEvents)(accessToken, calendarIds);
    return events;
};
// This middleware is available in Express v4.16.0 onwards
app.use(express_1.default.json());
// [END run_pubsub_server_setup]
// [END cloudrun_pubsub_server_setup]
// [START cloudrun_pubsub_handler]
// [START run_pubsub_handler]
app.post("/", async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g;
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
    console.log(JSON.stringify({
        messageId: pubSubMessage.messageId,
        publishTime: pubSubMessage.publishTime,
        data,
    }));
    const { emailAddress, historyId } = data;
    let userId = "";
    try {
        userId = await (0, supabase_1.getUserIdByEmail)(emailAddress);
    }
    catch (e) {
        console.log("Error getting user id", e);
        res.status(204).send();
        return;
    }
    console.log("Getting access token");
    const accessToken = await (0, calendars_1.getAccessToken)("google", userId);
    console.log("Getting history");
    const history = await (0, gmail_1.getEmails)(accessToken, historyId, userId);
    console.log(JSON.stringify({ history }));
    const messages = (history.history || []).map((h) => (h === null || h === void 0 ? void 0 : h.messages) || []).flat();
    console.log(JSON.stringify({ messages }));
    const gmail = (0, gmail_1.getGmail)(accessToken);
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
            if ((_a = res.data.labelIds) === null || _a === void 0 ? void 0 : _a.includes("DRAFT")) {
                console.log("Ignoring draft");
                continue;
            }
            console.log("Got email");
            console.log(res.data.snippet);
            console.log("Determining if schedule request");
            const isScheduleRequest = await (0, openai_1.getIsScheduleRequest)(res.data.snippet);
            console.log("isScheduleRequest", isScheduleRequest);
            let gptAnswer = [];
            if (isScheduleRequest) {
                console.log("Found scheduling request, running GPT-3");
                gptAnswer = await (0, openai_1.getGpt)(res.data.snippet || "");
            }
            // get from email address
            const fromEmail = (_d = (_c = (_b = res.data.payload) === null || _b === void 0 ? void 0 : _b.headers) === null || _c === void 0 ? void 0 : _c.find((h) => h.name === "From")) === null || _d === void 0 ? void 0 : _d.value;
            const emailId = res.data.id || "";
            // continue if email is already in db
            const emailFromDb = await supabase_1.publicSupabase
                .from("emails")
                .select("*")
                .eq("email_id", emailId)
                .single();
            if (emailFromDb.data) {
                console.log("Email already in db");
                continue;
            }
            const emailDb = (0, schema_1.toEmailDb)({
                userId,
                emailId,
                threadId: res.data.threadId || "",
                body: res.data.snippet || "",
                subject: ((_g = (_f = (_e = res.data.payload) === null || _e === void 0 ? void 0 : _e.headers) === null || _f === void 0 ? void 0 : _f.find((h) => h.name === "Subject")) === null || _g === void 0 ? void 0 : _g.value) ||
                    "",
                isScheduleRequest,
                gptAnswer,
            });
            console.log("Saving email to db");
            const emailRes = await (0, supabase_1.createEmailRecord)(emailDb);
            console.log("Saved email to db");
            console.log("Getting calendar data");
            const events = await getCalendarData(userId, accessToken);
            console.log("finding times");
            const times = (0, utils_1.findTimes)(events, gptAnswer);
            console.log("received times", JSON.stringify({ times }));
            console.log("aggregating times");
            const aggregatedTimes = (0, utils_1.aggregateTimes)(times);
            console.log("received aggregated times", JSON.stringify({ aggregatedTimes }));
            const formattedTimes = aggregatedTimes
                .map(({ start, end }) => {
                return `${luxon_1.DateTime.fromJSDate(new Date(start))
                    .setZone("America/Los_Angeles")
                    .toFormat("ccc LLL dd h:mm")} – ${luxon_1.DateTime.fromJSDate(new Date(end))
                    .setZone("America/Los_Angeles")
                    .toFormat("h:mm a ZZZZ")}`;
            })
                .join("\n");
            console.log("Getting gmail thread");
            const emailThread = await (0, utils_1.getGmailThread)(accessToken, res.data.threadId || "", emailAddress);
            console.log("Received email thread", JSON.stringify({ emailThread }));
            console.log("Getting email to send prompt");
            const emailToSendPrompt = (0, prompt_1.getEmailToSendPrompt)(new Date(), formattedTimes, emailThread);
            console.log("get raw gpt");
            const resAnswer = await (0, openai_1.getRawGpt)(emailToSendPrompt, "---Austin's response starts here---");
            const reply = resAnswer === null || resAnswer === void 0 ? void 0 : resAnswer.split("---Austin's response ends here---")[0];
            // TODO: Create a draft email with the times
            console.log("create gmail draft");
            await (0, utils_1.createGmailDraft)(accessToken, res.data.threadId || "", emailAddress, fromEmail || "", reply || "");
            // save reply to db in emails table for a given emailId
            console.log("save reply to db");
            const { data: emailData, error: emailError } = await supabase_1.publicSupabase
                .from("emails")
                .update({ reply })
                .eq("email_id", emailId);
            if (emailError) {
                console.error("Error saving reply to db", emailError);
                continue;
            }
            console.log("Saved reply to db");
        }
        catch (e) {
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
exports.default = app;
