import { streamText } from "ai";
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

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: `
${TRUSTVIEW_SYSTEM_PROMPT}

${TRUSTVIEW_CONTEXT}

${TRUSTVIEW_GUARDRAILS}
`,
      messages,
    });

    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    for await (const textPart of result.textStream) {
      res.write(textPart);
    }

    res.end();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error?.message || "Server error",
    });
  }
}
