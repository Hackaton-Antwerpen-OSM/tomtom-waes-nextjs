import { GoogleGenAI } from "@google/genai";
import { NextApiRequest, NextApiResponse } from "next";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { prompt } = req.body;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: prompt,
  });

  res.status(200).json({ response, text: response.text });
}
