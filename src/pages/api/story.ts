import type { NextApiRequest, NextApiResponse } from "next";
import { generateStory } from "@/services/storyGenerationService";
import { StoryResponse } from "@/types";

type POIData = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  distance?: number;
};

type ResponseData = StoryResponse | {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { pois, messages } = req.body;
    
    if (!pois || !Array.isArray(pois) || pois.length === 0) {
      return res.status(400).json({ 
        error: "Invalid request. Please provide an array of points of interest." 
      });
    }

    // Validate that we have an array of valid POIs
    const validPois = pois.filter((poi: POIData) => 
      poi && 
      typeof poi.id === "string" && 
      typeof poi.name === "string" && 
      typeof poi.latitude === "number" && 
      typeof poi.longitude === "number"
    );

    if (validPois.length === 0) {
      return res.status(400).json({ 
        error: "No valid points of interest provided." 
      });
    }

    // Generate story with the provided POIs and optional message history
    const storyResponse = await generateStory(validPois, messages || []);
    return res.status(200).json(storyResponse);
  } catch (error) {
    console.error("Error generating story:", error);
    return res.status(500).json({ 
      error: "Failed to generate story" 
    });
  }
} 