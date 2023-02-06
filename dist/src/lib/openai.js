"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGpt = exports.getIsScheduleRequest = void 0;
const openai_1 = require("openai");
const prompt_1 = require("./prompt");
const utils_1 = require("./utils");
const configuration = new openai_1.Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new openai_1.OpenAIApi(configuration);
const getIsScheduleRequest = async (email) => {
    if (!email)
        return false;
    const prompt = (0, prompt_1.getPrompt)(email);
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
exports.getIsScheduleRequest = getIsScheduleRequest;
const getGpt = async (email) => {
    var _a;
    const prompt = (0, prompt_1.getLangPrompt)(email, new Date());
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        temperature: 0,
        max_tokens: 350,
        top_p: 1,
    });
    const resultArr = (_a = response.data.choices[0].text) === null || _a === void 0 ? void 0 : _a.split("And the final answer in json is: ");
    const result = resultArr === null || resultArr === void 0 ? void 0 : resultArr[resultArr.length - 1];
    const jsonResult = JSON.parse(result || "");
    return (0, utils_1.toDateAnswer)(jsonResult);
};
exports.getGpt = getGpt;
