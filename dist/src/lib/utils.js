"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGmailThread = exports.createGmailDraft = exports.aggregateTimes = exports.findTimes = exports.toDateAnswer = exports.getOrigin = void 0;
const luxon_1 = require("luxon");
const gmail_1 = require("./gmail");
const getOrigin = () => {
    if (typeof location !== "undefined") {
        return location.origin;
    }
    return process.env.NEXTAUTH_URL || "";
};
exports.getOrigin = getOrigin;
const toDateAnswer = (dateTextAnswers) => {
    return dateTextAnswers
        .map((dta) => {
        const { start_date, end_date, start_time = "8:00 AM", end_time = "5:00 PM", } = dta;
        const ans = [];
        const dtStart = luxon_1.DateTime.fromFormat(start_date, "DDD").setZone("America/Los_Angeles", { keepLocalTime: true });
        const dtEnd = luxon_1.DateTime.fromFormat(end_date, "DDD").setZone("America/Los_Angeles", { keepLocalTime: true });
        let dtCurrent = dtStart;
        while (dtCurrent <= dtEnd) {
            ans.push({
                dtStart: luxon_1.DateTime.fromFormat(dtCurrent.toFormat("D") + ", " + start_time, "M/d/y, h:mm a").setZone("America/Los_Angeles", { keepLocalTime: true }),
                dtEnd: luxon_1.DateTime.fromFormat(dtCurrent.toFormat("D") + ", " + end_time, "M/d/y, h:mm a").setZone("America/Los_Angeles", { keepLocalTime: true }),
            });
            dtCurrent = dtCurrent.plus({ days: 1 });
        }
        return ans;
    })
        .flat();
};
exports.toDateAnswer = toDateAnswer;
// findTimes takes calendar events and date answers and returns a list of
// DateRanges that are available for the user to schedule a meeting
const findTimes = (events, dateAnswers) => {
    const potentialOptions = [];
    dateAnswers.forEach((da) => {
        const { dtStart, dtEnd } = da;
        let dtCurrent = dtStart;
        while (dtCurrent <= dtEnd) {
            potentialOptions.push({
                start: dtCurrent,
                end: dtCurrent.plus({ hours: 1 }),
            });
            dtCurrent = dtCurrent.plus({ hours: 1 });
        }
    });
    const dateRanges = potentialOptions.filter((po) => {
        return !events.some((e) => {
            const eventStart = luxon_1.DateTime.fromJSDate(e.start);
            const eventEnd = luxon_1.DateTime.fromJSDate(e.end);
            return ((po.start >= eventStart && po.start < eventEnd) ||
                (po.end >= eventStart && po.end < eventEnd) ||
                (po.start < eventStart && po.end > eventEnd));
        });
    });
    return dateRanges.map((dr) => ({
        start: dr.start.toJSDate(),
        end: dr.end.toJSDate(),
    }));
};
exports.findTimes = findTimes;
// Aggregate times into a list of DateRanges
// Example input is a list of 1hr date ranges that may be adjacent
// Example output is a list of varying time date ranges that are not adjacent
const aggregateTimes = (dateRanges) => {
    const sortedDateRanges = dateRanges.sort((a, b) => {
        const aStart = luxon_1.DateTime.fromJSDate(a.start);
        const bStart = luxon_1.DateTime.fromJSDate(b.start);
        if (aStart < bStart) {
            return -1;
        }
        if (aStart > bStart) {
            return 1;
        }
        return 0;
    });
    const aggregatedDateRanges = [];
    let currentRange = null;
    sortedDateRanges.forEach((dr) => {
        if (!currentRange) {
            currentRange = dr;
            return;
        }
        const currentRangeEnd = luxon_1.DateTime.fromJSDate(currentRange.end);
        const drStart = luxon_1.DateTime.fromJSDate(dr.start);
        if (drStart <= currentRangeEnd) {
            currentRange.end = dr.end;
        }
        else {
            aggregatedDateRanges.push(currentRange);
            currentRange = dr;
        }
    });
    if (currentRange) {
        aggregatedDateRanges.push(currentRange);
    }
    return aggregatedDateRanges;
};
exports.aggregateTimes = aggregateTimes;
// Create draft email reply given access token, thread id, email address, and subject
const createGmailDraft = async (accessToken, threadId, email, toEmail, body) => {
    const gmail = (0, gmail_1.getGmail)(accessToken);
    const res = await gmail.users.drafts.create({
        userId: "me",
        requestBody: {
            message: {
                threadId,
                raw: Buffer.from(`From: ${email}
To: ${toEmail}
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: quoted-printable

${body}
`).toString("base64"),
            },
        },
    });
    return res.data;
};
exports.createGmailDraft = createGmailDraft;
// Get all emails from a given gmail thread then output in the following format:
// Harry: {emailBody}
// Austin: {emailBody}
const getGmailThread = async (accessToken, threadId, email) => {
    const gmail = (0, gmail_1.getGmail)(accessToken);
    const res = await gmail.users.threads.get({
        userId: "me",
        id: threadId,
    });
    const messages = res.data.messages;
    if (!messages) {
        return "";
    }
    // Create a map of email address to a fake name
    // Example: {"janet@gmail.com": "Billy"}
    // There should be one unique fake name per email address
    const listOfFakeLastNames = [
        "Brown",
        "Johnson",
        "Jackson",
        "Davidson",
        "Davis",
        "Young",
    ];
    const emailToName = messages.reduce((acc, m) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const email = (_c = (_b = (_a = m.payload) === null || _a === void 0 ? void 0 : _a.headers) === null || _b === void 0 ? void 0 : _b.find((h) => h.name === "From")) === null || _c === void 0 ? void 0 : _c.value;
        if (!email) {
            return acc;
        }
        // @ts-ignore
        if (acc[email]) {
            return acc;
        }
        const firstName = (_g = (_f = (_e = (_d = m.payload) === null || _d === void 0 ? void 0 : _d.headers) === null || _e === void 0 ? void 0 : _e.find((h) => h.name === "From")) === null || _f === void 0 ? void 0 : _f.value) === null || _g === void 0 ? void 0 : _g.split(" ")[0];
        const randomName = listOfFakeLastNames[Math.floor(Math.random() * listOfFakeLastNames.length)];
        // Remove random name from list so it can't be used again
        listOfFakeLastNames.splice(listOfFakeLastNames.indexOf(randomName), 1);
        // @ts-ignore
        acc[email] = `${firstName} ${randomName}`;
        return acc;
    }, { [email]: "Austin Tackaberry" });
    const emails = messages
        .map((m) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const email = (_c = (_b = (_a = m.payload) === null || _a === void 0 ? void 0 : _a.headers) === null || _b === void 0 ? void 0 : _b.find((h) => h.name === "From")) === null || _c === void 0 ? void 0 : _c.value;
        const body = (_g = (_f = (_e = (_d = m.payload) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e.find((p) => p.mimeType === "text/html")) === null || _f === void 0 ? void 0 : _f.body) === null || _g === void 0 ? void 0 : _g.data;
        return {
            email,
            body: Buffer.from(body || "", "base64").toString(),
        };
    })
        .map((e) => {
        // @ts-ignore
        const name = emailToName[e.email];
        return `${name}: ${e.body}`;
    })
        .join("\n");
    return emails;
};
exports.getGmailThread = getGmailThread;
