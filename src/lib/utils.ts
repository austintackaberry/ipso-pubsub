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
  console.log(JSON.stringify({ dateTextAnswers }));
  const dateAnswer = dateTextAnswers
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
  console.log(JSON.stringify({ dateAnswer }));
  return dateAnswer;
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

export const shouldCombineDatetimes = (a: DateRange, b: DateRange): boolean => {
  return (
    (b.start >= a.start && b.start <= a.end) ||
    (b.end >= a.start && b.end <= a.end) ||
    (b.start <= a.start && b.end >= a.end)
  );
};

export const doneAggregating = (availability: DateRange[]): boolean => {
  let res = true;
  const sortedAvailability = availability.sort((a, b) =>
    a.start < a.end ? -1 : 1
  );
  return sortedAvailability.every((as, i) => {
    const next = sortedAvailability[i + 1];
    if (!next) {
      return true;
    }
    return !shouldCombineDatetimes(as, next);
  });
};

export const combineDateRanges = (a: DateRange, b: DateRange): DateRange => {
  const start = a.start < b.start ? a.start : b.start;
  const end = a.end > b.end ? a.end : b.end;
  return { start, end };
};

export const aggregateTimes = (dr: DateRange[]): DateRange[] => {
  let aggregatedDateRange = dr.sort((a, b) => (a.start < a.end ? -1 : 1));
  while (!doneAggregating(aggregatedDateRange)) {
    for (let i = 0; i < aggregatedDateRange.length - 1; i++) {
      const first = aggregatedDateRange[i];
      const second = aggregatedDateRange[i + 1];
      if (first && second && shouldCombineDatetimes(first, second)) {
        const dateRange = combineDateRanges(first, second);
        aggregatedDateRange = [
          ...aggregatedDateRange.slice(0, i),
          dateRange,
          ...aggregatedDateRange.slice(i + 2),
        ];
      }
    }
  }
  return aggregatedDateRange;
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
      const body = m.snippet;
      return {
        email,
        body,
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
