import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const voiceId = "xa5P2GIVter8sHLWI9Cr";
    const { text, voiceSettings } = JSON.parse(req.body) || req.body;
    console.log("🤮 Text:", text);
    console.log("🤮 Voice Settings:", voiceSettings);

    // Get API key from environment variables or request headers
    const apiKey = process.env.ELEVENLABS_API_KEY || "";

    if (!apiKey) {
      console.error("No API key found");
      return res.status(400).json({ error: "API key is required" });
    }

    if (!voiceId || !text) {
      console.error("🤮 Voice ID and text are required");
      return res.status(400).json({ error: "Voice ID and text are required" });
    }

    const baseUrl = "https://api.elevenlabs.io/v1/text-to-speech";
    const headers = {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    };

    const requestBody = {
      text,
      voice_settings: voiceSettings || {
        stability: 0.5,
        similarity_boost: 0.75,
      },
      model_id: "eleven_turbo_v2_5",
      language_code: "nl",
    };

    const elevenlabsResponse = await axios.post(
      `${baseUrl}/${voiceId}`,
      requestBody,
      {
        headers,
        responseType: "arraybuffer",
      }
    );

    // Set appropriate headers
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-cache");

    return res.status(200).send(elevenlabsResponse.data);
  } catch (error) {
    console.error("TTS API error:", error);
    return res
      .status(500)
      .json({ error: "Failed to process text-to-speech request" });
  }
}
