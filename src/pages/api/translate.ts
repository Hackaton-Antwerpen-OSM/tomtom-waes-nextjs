import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI } from "@google/genai";

type ResponseData = {
  translatedText: string;
  error?: string;
};

// Initialize the Gemini AI client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }
  return new GoogleGenAI({ apiKey });
};

async function translateToFlemish(text: string): Promise<string> {
  try {
    const ai = getAiClient();
    const prompt = `Translate to Flemish, more specifically in the dialect of Antwerp, Belgium. Your name is TomTom Waes. 
Use a lot of mannerisms and local expressions and slang, like "manneke toch", "verdoemme toch", "fok he", "wa denkt ge daarvan?", "enfin", "ge zij van 't stad", "'t stad en de rest is parking".
Sometimes say things like "alee mannekes zulle we nog een pintje pakke" and "alee nog dos cervezas en ik zen weg he"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents:
        prompt +
        "\n\n" +
        text +
        "\n\nJust reply in text, do not include markdown.",
    });

    return response.text || "";
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      translatedText: "",
      error: "Method not allowed",
    });
  }

  try {
    const { text } = req.body;

    console.log("👉👌 text: ", text);

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        translatedText: "",
        error: "Invalid input. Please provide text to translate.",
      });
    }

    const translatedText = await translateToFlemish(text);

    if (!translatedText) {
      return res.status(500).json({
        translatedText: "",
        error: "Translation failed",
      });
    }

    return res.status(200).json({ translatedText });
  } catch (error) {
    console.error("Error translating text:", error);
    return res.status(500).json({
      translatedText: "",
      error: "Failed to translate text",
    });
  }
}
