"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toEmailDb = void 0;
const toEmailDb = (email) => {
    return {
        email_id: email.emailId,
        thread_id: email.threadId,
        subject: email.subject,
        body: email.body,
        user_id: email.userId,
        is_schedule_request: email.isScheduleRequest,
        gpt_answer: JSON.stringify(email.gptAnswer),
    };
};
exports.toEmailDb = toEmailDb;
