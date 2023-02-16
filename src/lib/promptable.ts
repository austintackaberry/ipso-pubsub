import {
  Prompt,
  OpenAI,
  LLMChain,
  setTraceConfig,
  Trace,
  graphTraces,
} from "promptable";
import {
  isScheduleRequestPromptTemplate,
  toStructuredJsonPromptTemplate,
} from "./prompt";

const apiKey = process.env.OPENAI_API_KEY || "missing";

export default async function run() {
  const traces: Trace[] = [];

  setTraceConfig({
    send: (trace) => {
      console.log("Received Trace", trace);
      traces.push(trace);
    },
  });

  const openai = new OpenAI(apiKey);

  const isScheduleRequestPrompt = new Prompt(isScheduleRequestPromptTemplate, [
    "email",
  ]);
  const toStructuredJsonPrompt = new Prompt(toStructuredJsonPromptTemplate, [
    "date",
    "text",
  ]);

  const llmChain = new LLMChain(isScheduleRequestPrompt, openai);

  // const poem = await llmChain.run({ topic: "the moon" });

  graphTraces(traces);
}
