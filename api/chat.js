import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { messages } = JSON.parse(req.body || "{}");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    return res.status(200).json({
      message: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}