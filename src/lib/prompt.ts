import { DateTime } from "luxon";

export const getPrompt = (email: string) => {
  return `Email: hey, how are you? just reaching out to see if you're interested in buying my product
This email warrants a response that includes offering times to meet (yes or no): no

Email: hi, we should catch up. how about next week?
This email warrants a response that includes offering times to meet (yes or no): yes

Email: hi, have you heard the news?
This email warrants a response that includes offering times to meet (yes or no): no

Email: Hi there, I am selling a product. Do you want to chat some time to discuss?
This email warrants a response that includes offering times to meet (yes or no): yes

Email: ${email}
This email warrants a response that includes offering times to meet (yes or no):`;
};

export const getLangPrompt = (
  q: string,
  d: Date
) => `Question: Today is Monday January 23, 2023. Want to get coffee some time next week? I'm busy on Tuesday.
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is next week?
  Intermediate answer: Monday January 30, 2023 to Sunday February 5, 2023
  Follow up: Which days are not available to meet?
  Intermediate answer: Tuesday, January 31, 2023
  Follow up: What are reasonable times to get coffee?
  Intermediate answer: 9AM to 4PM
  So the final answer in English is: Sunday January 29, 2023 to Monday January 30, 2023 or Wednesday January 25, 2023 to Saturday February 4, 2023, some time between 9AM and 4PM
  And the final answer in json is: [{"start_date": "January 29, 2023", "end_date": "January 30, 2023", "start_time": "9:00 AM", "end_time": "4:00 PM"},{"start_date": "January 25, 2023", "end_date": "February 4, 2023", "start_time": "9:00 AM", "end_time": "4:00 PM"}]
  
  Question: Today is Friday March 3rd, 2023. Do you want to catch up tomorrow?
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is tomorrow?
  Intermediate answer: Saturday March 4, 2023
  So the final answer in English is: Saturday March 4, 2023
  And the final answer in json is: [{"start_date": "March 4, 2023", "end_date": "March 4, 2023"}]
  
  Question: Today is Wednesday March 7, 2023. We should catch up. How about this weekend?
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is this weekend?
  Intermediate answer: Saturday March 11, 2023 to Sunday March 12, 2023
  So the final answer in English is: Saturday March 11, 2023 to Sunday March 12, 2023
  And the final answer in json is: [{"start_date": "March 11, 2023", "end_date": "March 12, 2023"}]
  
  Question: Today is Wednesday June 14, 2023. Are you free to meet up? I'm free next week but I'm not available later in the week
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is next week?
  Intermediate answer: Monday June 19, 2023 to Sunday June 25, 2023
  Follow up: When is later in the next week?
  Intermediate answer: Thursday June 22, 2023 to Sunday June 25, 2023
  Follow up: Which days are not available?
  Intermediate answer: Thursday June 22, 2023 to Sunday June 25, 2023
  So the final answer in English is: Monday June 19, 2023 to Wednesday June 21, 2023
  And the final answer in json is: [{"start_date": "June 19, 2023", "end_date": "June 21, 2023"}]
  
  Question: Today is Tuesday April 25, 2023. Are you free to grab a coffee some time this week?
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is this week?
  Intermediate answer: Tuesday April 25, 2023 to Sunday April 30, 2023
  Follow up: Which days from this week are too soon to reasonably schedule a meeting?
  Intermediate answer: Tuesday April 25, 2023
  Follow up: What are reasonable times to get coffee?
  Intermediate answer: 9AM to 4PM
  So the final answer in English is: Wednesday April 26, 2023 to Saturday April 29, 2023 some time between 9AM and 4PM
  And the final answer in json is: [{"start_date": "April 26, 2023", "end_date": "April 29, 2023", "start_time": "9:00 AM", "end_time": "4:00 PM"}]
  
  Question: Today is Tuesday September 19, 2023. Want to hang out next week? I should be free earlier in the week.
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is next week?
  Intermediate answer: Monday September 25, 2023 to Sunday October 1, 2023
  Follow up: When is earlier in the week next week?
  Intermediate answer: Monday September 25, 2023 to Wednesday September 27, 2023
  So the final answer in English is: Monday September 25, 2023 to Wednesday September 27, 2023
  And the final answer in json is: [{"start_date": "September 25, 2023", "end_date": "September 27, 2023"}]
  
  Question: Today is Tuesday September 19, 2023. Are you free to chat some time tomorrow?
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: No.
  So the final answer in English is: Wednesday September 20, 2023
  And the final answer in json is: [{"start_date": "September 20, 2023", "end_date": "September 20, 2023"}]
  
  Question: Today is Tuesday October 3rd, 2023. Do you want to get brunch this weekend?
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is this weekend?
  Intermediate answer: Saturday October 7, 2023 to Sunday October 8, 2023
  Follow up: When are reasonable times to get brunch?
  Intermediate answer: 10AM to 3PM
  So the final answer in English is: Saturday October 7, 2023 to Sunday October 8, 2023 some time between 10AM and 3PM
  And the final answer in json is: [{"start_date": "October 7, 2023", "end_date": "October 8, 2023", "start_time": "10:00 AM", "end_time": "3:00 PM"}]
  
  Question: Today is Sunday July 9, 2023. Are you free to grab brunch next month? We could also do coffee if you prefer.
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is next month?
  Intermediate answer: Tuesday August 1, 2023 to Saturday August 31, 2023
  Follow up: When are reasonable times to get brunch or coffee?
  Intermediate answer: 10AM to 3PM for brunch, 9AM to 4PM for coffee
  Follow up: What is the combined time range for brunch and coffee?
  Intermediate answer: 9AM to 4PM
  So the final answer in English is: Tuesday August 1, 2023 to Saturday August 31, 2023 some time between 9AM and 4PM.
  And the final answer in json is: [{"start_date": "August 1, 2023", "end_date": "August 31, 2023", "start_time": "9:00 AM", "end_time": "4:00 PM"}]
  
  Question: Today is Wednesday November 15, 2023. When should we schedule the morning meeting? Are you free on Friday? Can push it back to next week too.
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is Friday?
  Intermediate answer: Friday November 17, 2023
  Follow up: When is next week?
  Intermediate answer: Monday November 20, 2023 to Sunday November 26, 2023
  Follow up: When is a reasonable time for a morning meeting?
  Intermediate answer: 9AM to 12PM
  So the final answer in English is: Friday November 17, 2023 some time between 9AM and 12PM or Sunday November 19, 2023 to Saturday November 25, 2023 some time between 9AM and 12PM.
  And the final answer in json is: [{"start_date": "November 17, 2023", "end_date": "November 17, 2023", "start_time": "9:00 AM", "end_time": "12:00 PM"}, {"start_date": "November 19, 2023", "end_date": "November 25, 2023", "start_time": "9:00 AM", "end_time": "12:00 PM"}]
  
  Question: Today is Monday July 10, 2023. Hey we should hang out this week! I'm mostly free but Thursday is a busy day for me. How about dinner?
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is this week?
  Intermediate answer: Monday July 10, 2023 to Sunday July 16, 2023
  Follow up: Which days from this week are too soon to reasonably be able to schedule a time to meet?
  Intermediate answer: Monday July 10, 2023
  Follow up: Which days aren't available?
  Intermediate answer: Thursday July 13, 2023
  Follow up: When is a reasonable time for dinner?
  Intermediate answer: 6PM to 9PM
  So the final answer in English is: Tuesday July 11, 2023 to Wednesday July 12, 2023 or Friday July 14, 2023 to Sunday July 16th some time between 6PM and 9PM
  And the final answer in json is: [{"start_date": "July 11, 2023", "end_date": "July 12, 2023", "start_time": "6:00 PM", "end_time": "9:00 PM"}, {"start_date": "July 14, 2023", "end_date": "July 16, 2023", "start_time": "6:00 PM", "end_time": "9:00 PM"}]
  
  Question: Today is Thursday July 27, 2023. Yoo it's been way too long. We should get lunch at the taco place like we used to. I'm busy this week and next week but maybe some time after that?
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is this week?
  Intermediate answer: Thursday July 27, 2023 to Sunday July 30, 2023
  Follow up: When is next week?
  Intermediate answer: Monday July 31, 2023 to Sunday August 6, 2023
  Follow up: When is after that?
  Intermediate answer: Monday August 7, 2023 to Sunday August 13, 2023
  Follow up: What are reasonable times for lunch?
  Intermediate answer: 11AM to 2PM
  So the final answer in English is: Monday August 7, 2023 to Sunday August 13, 2023 some time between 11AM and 2PM.
  And the final answer in json is: [{"start_date": "August 7, 2023", "end_date": "August 13, 2023", "start_time": "11:00 AM", "end_time": "2:00 PM"}]
  
  Question: Today is Sunday December 3rd, 2023. Are you free sometime this week. Tuesday works good for me. Maybe meet up for dinner
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is this week?
  Intermediate answer: Monday December 4, 2023 to Sunday December 10, 2023
  Follow up: When is Tuesday?
  Intermediate answer: Tuesday December 5, 2023
  Follow up: What are reasonable times for dinner?
  Intermediate answer: 6PM to 9PM
  So the final answer in English is: Tuesday December 5, 2023 some time between 6PM and 9PM.
  And the final answer in json is: [{"start_date": "December 5, 2023", "end_date": "December 5, 2023", "start_time": "6:00 PM", "end_time": "9:00 PM"}]
  
  Question: Today is Tuesday April 18, 2023. Hey when do you think we can schedule that 1-1? I should be free Thurs 1-3PM or Fri 8-11AM this week or some time in the afternoon next week
  
  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is this week?
  Intermediate answer: Tuesday April 18, 2023 to Sunday April 23rd, 2023
  Follow up: When is next week?
  Intermediate answer: Monday April 24, 2023 to Sunday April 30, 2023
  Follow up: When is the afternoon?
  Intermediate answer: 12PM to 5PM
  Follow up: What are the available times for this week?
  Intermediate answer: Thursday April 20, 2023 1PM to 3PM or Friday April 21, 2023 8AM to 11AM
  Follow up: What are the available times for next week?
  Intermediate answer: Monday April 24, 2023 to Sunday April 30, 2023 12PM to 5PM
  So the final answer in English is: Thursday April 20, 2023 1PM to 3PM or Friday April 21, 2023 8AM to 11AM or Monday April 24, 2023 to Sunday April 30, 2023 12PM to 5PM
  And the final answer in json is: [{"start_date": "April 20, 2023", "end_date": "April 20, 2023", "start_time": "1:00 PM", "end_time": "3:00 PM"}, {"start_date": "April 21, 2023", "end_date": "April 21, 2023", "start_time": "8:00 AM", "end_time": "11:00 AM"}, {"start_date": "April 24, 2023", "end_date": "April 30, 2023", "start_time": "12:00 PM", "end_time": "5:00 PM"}]
  
  Question: Today is Thursday February 16, 2023. hey do you want to grab coffee some time tomorrow?

  Let's work this out in a step by step way to be sure we have the right answer.
  Are follow up questions needed here: Yes.
  Follow up: When is tomorrow?
  Intermediate answer: Friday February 17, 2023
  Follow up: What are reasonable times for coffee?
  Intermediate answer: 9AM to 3PM
  So the final answer in English is: Friday February 17, 2023 9AM to 3PM.
  And the final answer in json is: [{"start_date": "February 17, 2023", "end_date": "February 17, 2023", "start_time": "9:00 AM", "end_time": "3:00 PM"}]

  Question: Today is ${DateTime.fromJSDate(d)
    .setZone("America/Los_Angeles")
    .toFormat("cccc LLLL d, yyyy")}. ${q}
  
  `;

export const getEmailToSendPrompt = (
  d: Date,
  formattedDates: string,
  emailThread: string
) => {
  return `Today is Wednesday November 15, 2023.
---Email thread starts here---
Harry Brown: Hey do you want to grab coffee sometime this week?
Austin Johnson: Yeah sure. When are you free?
Harry Brown: How about tomorrow?
---Email thread ends here---
Austin is available these times: Thursday November 15, 2023 8AM to 11AM
We want to figure out a reasonable response for Austin given the thread above and Austin's availability with the ultimate goal of scheduling a meeting.
---Austin's response starts here---
Hey Harry,

I'm available tomorrow between 8am and 11am. Let me know if that works for you.
---Austin's response ends here---

Today is Thursday February 16, 2023.
---Email thread starts here---
Haefa Jackson: Hey when do you want to do our 1-1?
Austin Brown: I'm free early next week
Haefa Jackson: How about monday? Maybe in the morning since I'm busy in the afternoon
---Email thread ends here---
Austin is available these times: Monday February 20, 2023 10AM to 11AM
We want to figure out a reasonable response for Austin given the thread above and Austin's availability with the ultimate goal of scheduling a meeting.
---Austin's response starts here---
Hey Haefa,

That works! How about 10am?
---Austin's response ends here---

Today is Monday March 6, 2023.
---Email thread starts here---
Matt Jones: Hey Sam, want to grab drinks next week?
Sam Stone: Yeah, let's do it. I should be free Tuesday or Wednesday
Matt Jones: How about Tuesday?
---Email thread ends here---
Sam Stone is available these times: Tuesday March 14, 2023 7PM to 10PM
We want to figure out a reasonable response for Sam given the thread above and Sam's availability with the ultimate goal of scheduling a meeting.
---Sam's response starts here---
Hey Matt,

Tuesday works for me. How about 7pm?
---Sam's response ends here---

Today is Monday March 6, 2023.
---Email thread starts here---
Michael Scott: Hey Sam, want to grab drinks next week?
---Email thread ends here---
Sam Stone is available these times: Monday March 13, 2023 7PM to 10PM, Tuesday March 14, 2023 7PM to 10PM, Wednesday March 14, 2023 7PM to 10PM
We want to figure out a reasonable response for Sam given the thread above and Sam's availability with the ultimate goal of scheduling a meeting.
---Sam's response starts here---
Hey Michael,

I'm free early next week. How about Tuesday?
---Sam's response ends here---

Today is Monday June 4, 2023.
---Email thread starts here---
Jill Wright: Are you free to chat next week? I’m free most mornings before 10am, except Tuesday.
---Email thread ends here---
Austin Porter is available these times: No available times
We want to figure out a reasonable response for Austin given the thread above and Austin's availability with the ultimate goal of scheduling a meeting.
---Austin's response starts here---
Hey Jill,

I'm not available next week before 10am. Can we try for the following week?
---Austin's response ends here---

Today is Friday February 17, 2023.
---Email thread starts here---
Haefa Mansour: Let’s get a 1:1 on the calendar. I’m open Tuesday from 8am-9am and 1-1:30pm and Wednesday from 3-3:30pm. Do any of those times work for you?
---Email thread ends here---
Austin Porter is available these times: Tuesday February 21, 2023 8AM to 9AM, Wednesday February 22, 2023 3PM to 3:30PM
We want to figure out a reasonable response for Austin given the thread above and Austin's availability with the ultimate goal of scheduling a meeting.
---Austin's response starts here---
Hey Haefa,

Tuesday at 8am works for me. Let's meet then.
---Austin's response ends here---

Today is Friday February 17, 2023.
---Email thread starts here---
Haefa Mansour: We should set up a time to chat. I’m open Tuesday from 1-1:30pm and Wednesday from 3-3:30pm. Do any of those times work for you?
---Email thread ends here---
Austin Porter is available these times: Tuesday February 21, 2023 1PM to 1:30PM, Wednesday February 22, 2023 3PM to 3:30PM
We want to figure out a reasonable response for Austin given the thread above and Austin's availability with the ultimate goal of scheduling a meeting.
---Austin's response starts here---
Hey Haefa,

Tuesday at 1pm works for me. Let's meet then.
---Austin's response ends here---

Today is Monday February 27, 2023.
---Email thread starts here---
Haefa Mansour: Do you want to grab coffee tomorrow? I'm free 10-11am and 1-2pm.
---Email thread ends here---
Austin Brown is available these times: Tuesday February 28, 2023 10AM to 11AM, Wednesday February 28, 2023 1PM to 2PM
We want to figure out a reasonable response for Austin given the thread above and Austin's availability with the ultimate goal of scheduling a meeting.
---Austin's response starts here---
Hey Haefa,

Tuesday at 10am sounds perfect. See you then.
---Austin's response ends here---

Today is Monday June 4, 2023.
---Email thread starts here---
Jill Wright: Hey Austin, when are you availabile this week? Trying to find time to chat about the new project.
---Email thread ends here---
Austin Porter is available these times: Tuesday June 5, 2023 10AM to 11AM, Wednesday June 6, 2023 2PM to 3PM, Thursday June 7, 2023 1PM to 3PM, Friday June 8, 2023 4PM to 5PM
We want to figure out a reasonable response for Austin given the thread above and Austin's availability with the ultimate goal of scheduling a meeting.
---Austin's response starts here---
Hey Jill,

I'm free the following times:
- Tuesday 6/5 10-11am
- Wednesday 6/6 2-3pm
- Thursday 6/7 1-3pm
- Friday 6/8 4-5pm

Let me know if any of those times work for you.
---Austin's response ends here---

Today is Monday June 4, 2023.
---Email thread starts here---
Jill Wright: Hey Austin, are you available tomorrow for a call?
---Email thread ends here---
Austin Porter is available these times: No available times
We want to figure out a reasonable response for Austin given the thread above and Austin's availability with the ultimate goal of scheduling a meeting.
---Austin's response starts here---
Hey Jill,

Tomorrow doesn't work for me. Can we try some other time?
---Austin's response ends here---

Today is Thursday February 16, 2023.
---Email thread starts here---
Jill Wright: hey what is your availability next week? would like to fit in our 1-1. maybe some time later in the week?
---Email thread ends here---
Austin Porter is available these times: Thursday February 23, 2023 11AM to 3PM, Thursday February 23, 2023 5PM to 6PM, Friday February 24, 2023 3PM to 6PM
We want to figure out a reasonable response for Austin given the thread above and Austin's availability with the ultimate goal of scheduling a meeting.
---Austin's response starts here---
Hey Jill,

I'm available next week at these times:
- Thursday 11am-3pm and 5-6pm PST
- Friday 3-6pm PST

Let me know if any of those times work for you.
---Austin's response ends here---

Today is ${DateTime.fromJSDate(d)
    .setZone("America/Los_Angeles")
    .toFormat("cccc LLLL d, yyyy")}.
---Email thread starts here---
${emailThread}
---Email thread ends here---
Austin is available these times: ${formattedDates || "No available times"}
---Austin's response starts here---
`;
};
