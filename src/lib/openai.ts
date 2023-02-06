import { Configuration, OpenAIApi } from "openai";
import { DateTextAnswer } from "../types";
import { getLangPrompt, getPrompt } from "./prompt";
import { toDateAnswer } from "./utils";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const getIsScheduleRequest = async (
  email: string | null | undefined
): Promise<boolean> => {
  if (!email) return false;
  const prompt = getPrompt(email);
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt,
    temperature: 0,
    max_tokens: 5,
    top_p: 1,
    stop: "\n",
  });
  const ans = response.data.choices[0].text;
  console.log("isScheduleRequest answer:", ans);
  return (ans || "").includes("yes") ? true : false;
};

export const getGpt = async (email: string) => {
  const prompt = getLangPrompt(email, new Date());
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt,
    temperature: 0,
    max_tokens: 350,
    top_p: 1,
  });
  const resultArr = response.data.choices[0].text?.split(
    "And the final answer in json is: "
  );
  const result = resultArr?.[resultArr.length - 1];
  const jsonResult = JSON.parse(result || "") as DateTextAnswer[];
  return toDateAnswer(jsonResult);
};
