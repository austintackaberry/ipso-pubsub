import { DateTime } from "luxon";
import { Prompt, OpenAI } from "promptable";
import { DateTextAnswer } from "../types";
import {
  emailGenerationPromptInput,
  emailToTimesJsonPromptInput,
  isScheduleRequestPromptInput,
} from "./prompt";
import { toDateAnswer } from "./utils";

const apiKey = process.env.OPENAI_API_KEY || "missing";

const runCompletion = async (
  promptTemplate: string,
  inputs: { [vars: string]: string },
  extractionFn: (completion: string) => any,
  options: any
) => {
  const openai = new OpenAI(apiKey);

  const prompt = new Prompt(promptTemplate, Object.keys(inputs));

  const promptText = prompt.format(inputs);

  const output = await openai.generate(promptText, options);

  return extractionFn(output);
};

export const runIsScheduleRequest = (email: string) => {
  const promptTemplate = isScheduleRequestPromptInput.template;
  const inputs = { email };
  const options = {
    model: "text-davinci-003",
    prompt,
    temperature: 0,
    max_tokens: 5,
    top_p: 1,
    stop: "\n",
  };
  const extractionFn = (completion: string) =>
    completion.includes("yes") ? true : false;
  return runCompletion(promptTemplate, inputs, extractionFn, options);
};

export const runEmailToTimesJson = (email: string, d: Date) => {
  const promptTemplate = emailToTimesJsonPromptInput.template;
  const inputs = {
    email,
    date: DateTime.fromJSDate(d)
      .setZone("America/Los_Angeles")
      .toFormat("cccc LLLL d, yyyy"),
  };
  const options = {
    model: "text-davinci-003",
    prompt,
    temperature: 0,
    max_tokens: 400,
    top_p: 1,
  };
  const extractionFn = (completion: string) => {
    const resultArr = completion.split("And the final answer in json is: ");
    const result = resultArr?.[resultArr.length - 1];
    const jsonResult = JSON.parse(result || "") as DateTextAnswer[];
    return toDateAnswer(jsonResult);
  };

  return runCompletion(promptTemplate, inputs, extractionFn, options);
};

export const runEmailGeneration = async (
  date: Date,
  emailThread: string,
  formattedDates: string
) => {
  const promptTemplate = emailGenerationPromptInput.template;
  const inputs = {
    date: DateTime.fromJSDate(date)
      .setZone("America/Los_Angeles")
      .toFormat("cccc LLLL d, yyyy"),
    emailThread,
    formattedDates: formattedDates || "No available times",
  };
  const options = {
    model: "text-davinci-003",
    prompt,
    temperature: 0,
    max_tokens: 400,
    top_p: 1,
  };
  const extractionFn = (completion: string) => {
    const resultArr = completion.split("---Austin's response starts here---");
    const resAnswer = resultArr?.[resultArr.length - 1];
    return resAnswer?.split("---Austin's response ends here---")[0];
  };
  return runCompletion(promptTemplate, inputs, extractionFn, options);
};
