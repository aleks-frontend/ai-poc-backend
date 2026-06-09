import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).end();
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const messages = body?.messages;

    const result = streamText({
      model: openai("gpt-4o-mini"),
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