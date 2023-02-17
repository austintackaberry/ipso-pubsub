"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promptable_1 = require("promptable");
const apiKey = process.env.OPENAI_API_KEY || "missing";
async function run() {
    const traces = [];
    (0, promptable_1.setTraceConfig)({
        send: (trace) => {
            console.log("Received Trace", trace);
            traces.push(trace);
        },
    });
    const openai = new promptable_1.OpenAI(apiKey);
    const isScheduleRequestPrompt = new promptable_1.Prompt(isScheduleRequestPromptTemplate, [
        "email",
    ]);
    const toStructuredJsonPrompt = new promptable_1.Prompt(toStructuredJsonPromptTemplate, [
        "date",
        "text",
    ]);
    const llmChain = new promptable_1.LLMChain(isScheduleRequestPrompt, openai);
    // const poem = await llmChain.run({ topic: "the moon" });
    (0, promptable_1.graphTraces)(traces);
}
exports.default = run;
