import { DateTime } from "luxon";
import {
  DateAnswer,
  DateRange,
  DateTextAnswer,
  DateTimeRange,
  Event,
} from "../types";
import { getGmail } from "./gmail";

export const getOrigin = () => {
  if (typeof location !== "undefined") {
    return location.origin;
  }
  return process.env.NEXTAUTH_URL || "";
};

export const toDateAnswer = (
  dateTextAnswers: DateTextAnswer[]
): DateAnswer[] => {
  return dateTextAnswers
    .map((dta) => {
      const {
        start_date,
        end_date,
        start_time = "8:00 AM",
        end_time = "5:00 PM",
      } = dta;
      const ans: DateAnswer[] = [];
      const dtStart = DateTime.fromFormat(start_date, "DDD").setZone(
        "America/Los_Angeles",
        { keepLocalTime: true }
      );
      const dtEnd = DateTime.fromFormat(end_date, "DDD").setZone(
        "America/Los_Angeles",
        { keepLocalTime: true }
      );
      let dtCurrent = dtStart;
      while (dtCurrent <= dtEnd) {
        ans.push({
          dtStart: DateTime.fromFormat(
            dtCurrent.toFormat("D") + ", " + start_time,
            "M/d/y, h:mm a"
          ).setZone("America/Los_Angeles", { keepLocalTime: true }),
          dtEnd: DateTime.fromFormat(
            dtCurrent.toFormat("D") + ", " + end_time,
            "M/d/y, h:mm a"
          ).setZone("America/Los_Angeles", { keepLocalTime: true }),
        });
        dtCurrent = dtCurrent.plus({ days: 1 });
      }
      return ans;
    })
    .flat();
};

// findTimes takes calendar events and date answers and returns a list of
// DateRanges that are available for the user to schedule a meeting
export const findTimes = (
  events: Event[],
  dateAnswers: DateAnswer[]
): DateRange[] => {
  const potentialOptions: DateTimeRange[] = [];
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
      const eventStart = DateTime.fromJSDate(e.start);
      const eventEnd = DateTime.fromJSDate(e.end);
      return (
        (po.start >= eventStart && po.start < eventEnd) ||
        (po.end >= eventStart && po.end < eventEnd) ||
        (po.start < eventStart && po.end > eventEnd)
      );
    });
  });
  return dateRanges.map((dr) => ({
    start: dr.start.toJSDate(),
    end: dr.end.toJSDate(),
  }));
};

// Aggregate times into a list of DateRanges
// Example input is a list of 1hr date ranges that may be adjacent
// Example output is a list of varying time date ranges that are not adjacent
export const aggregateTimes = (dateRanges: DateRange[]): DateRange[] => {
  const sortedDateRanges = dateRanges.sort((a, b) => {
    const aStart = DateTime.fromJSDate(a.start);
    const bStart = DateTime.fromJSDate(b.start);
    if (aStart < bStart) {
      return -1;
    }
    if (aStart > bStart) {
      return 1;
    }
    return 0;
  });

  const aggregatedDateRanges: DateRange[] = [];
  let currentRange: DateRange | null = null;
  sortedDateRanges.forEach((dr) => {
    if (!currentRange) {
      currentRange = dr;
      return;
    }
    const currentRangeEnd = DateTime.fromJSDate(currentRange.end);
    const drStart = DateTime.fromJSDate(dr.start);
    if (drStart <= currentRangeEnd) {
      currentRange.end = dr.end;
    } else {
      aggregatedDateRanges.push(currentRange);
      currentRange = dr;
    }
  });
  if (currentRange) {
    aggregatedDateRanges.push(currentRange);
  }
  return aggregatedDateRanges;
};

// Create draft email reply given access token, thread id, email address, and subject
export const createGmailDraft = async (
  accessToken: string,
  threadId: string,
  email: string,
  toEmail: string,
  body: string
) => {
  const gmail = getGmail(accessToken);
  const res = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        threadId,
        raw: Buffer.from(
          `From: ${email}
To: ${toEmail}
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: quoted-printable

${body}
`
        ).toString("base64"),
      },
    },
  });
  return res.data;
};

// Get all emails from a given gmail thread then output in the following format:
// Harry: {emailBody}
// Austin: {emailBody}
export const getGmailThread = async (
  accessToken: string,
  threadId: string,
  email: string
) => {
  const gmail = getGmail(accessToken);
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
  const emailToName = messages.reduce(
    (acc, m) => {
      const email = m.payload?.headers?.find((h) => h.name === "From")?.value;
      if (!email) {
        return acc;
      }
      // @ts-ignore
      if (acc[email]) {
        return acc;
      }
      const firstName = m.payload?.headers
        ?.find((h) => h.name === "From")
        ?.value?.split(" ")[0];
      const randomName =
        listOfFakeLastNames[
          Math.floor(Math.random() * listOfFakeLastNames.length)
        ];
      // Remove random name from list so it can't be used again
      listOfFakeLastNames.splice(listOfFakeLastNames.indexOf(randomName), 1);
      // @ts-ignore
      acc[email] = `${firstName} ${randomName}`;

      return acc;
    },
    { [email]: "Austin Tackaberry" }
  );

  const emails = messages
    .map((m) => {
      const email = m.payload?.headers?.find((h) => h.name === "From")?.value;
      const body = m.payload?.parts?.find((p) => p.mimeType === "text/html")
        ?.body?.data;
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
