"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDateAnswer = exports.getOrigin = void 0;
const luxon_1 = require("luxon");
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
