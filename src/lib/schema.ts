import { Email, EmailDb } from "../types";

export const toEmailDb = (email: Email): EmailDb => {
  return {
    email_id: email.emailId,
    thread_id: email.threadId,
    subject: email.subject,
    body: email.body,
    user_id: email.userId,
    is_schedule_request: email.isScheduleRequest,
    gpt_answer: JSON.stringify(email.gptAnswer),
    times: JSON.stringify(email.times),
  };
};
