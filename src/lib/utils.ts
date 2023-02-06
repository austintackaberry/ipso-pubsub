import { DateTime } from "luxon";
import { DateAnswer, DateTextAnswer } from "../types";

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
