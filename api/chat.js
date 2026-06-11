import { convertToModelMessages, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  TRUSTVIEW_CONTEXT,
  TRUSTVIEW_GUARDRAILS,
  TRUSTVIEW_SYSTEM_PROMPT,
} from "./prompts.js";

const ALLOWED_ORIGINS = [
  "https://nightly.app.trustview.eu",
  "http://localhost:3000",
];

function logIncomingUserParts(messages) {
  const lastUserMessage = [...(messages ?? [])]
    .reverse()
    .find((message) => message.role === "user");

  if (!lastUserMessage?.parts?.length) {
    console.log("Incoming user message: no parts array on last user message");
    return;
  }

  console.log(
    "Incoming user message parts:",
    lastUserMessage.parts.map((part) => ({
      type: part.type,
      mediaType: part.mediaType,
      hasUrl: Boolean(part.url),
      urlPrefix: typeof part.url === "string" ? part.url.slice(0, 40) : undefined,
      textLength: part.text?.length,
    })),
  );
}

export default async function handler(req, res) {
  try {
    const origin = req.headers.origin;

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }

    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (req.method !== "POST") {
      return res.status(405).end();
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const messages = body?.messages;

    if (!messages?.length) {
      return res.status(400).json({ error: "Missing messages" });
    }

    logIncomingUserParts(messages);

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: `
${TRUSTVIEW_SYSTEM_PROMPT}

${TRUSTVIEW_CONTEXT}

${TRUSTVIEW_GUARDRAILS}
`,
      messages: await convertToModelMessages(messages),
    });

    result.pipeUIMessageStreamToResponse(res);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error?.message || "Server error",
    });
  }
}
