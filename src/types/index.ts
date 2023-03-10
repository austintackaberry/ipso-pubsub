import { DateTime } from "luxon";

export interface Event {
  start: Date;
  end: Date;
  title: string;
}

export interface DateTextAnswer {
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
}

export interface DateAnswer {
  dtStart: DateTime;
  dtEnd: DateTime;
}

export interface Email {
  emailId: string;
  threadId: string;
  subject: string;
  body: string;
  userId: string;
  isScheduleRequest: boolean;
  gptAnswer: DateAnswer[];
  times: DateRange[];
}

export interface EmailDb {
  email_id: string;
  thread_id: string;
  subject: string;
  body: string;
  user_id: string;
  is_schedule_request: boolean;
  gpt_answer: string;
  times: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateTimeRange {
  start: DateTime;
  end: DateTime;
}

export interface PromptInput {
  template: string;
  vars: string[];
}
