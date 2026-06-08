import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Vercel-safe body parsing
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const messages = body?.messages;

    if (!messages) {
      return res.status(400).json({ error: "Missing messages" });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 👈 najjeftiniji stabilan model za testiranje
      messages,
    });

    return res.status(200).json({
      message: completion.choices[0].message.content,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error?.message || "Server error",
    });
  }
}