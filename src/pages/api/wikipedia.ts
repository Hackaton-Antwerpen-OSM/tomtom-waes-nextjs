import type { NextApiRequest, NextApiResponse } from "next";
import { getWikipediaInfo } from "@/services/openStreetMapService";

type POIData = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  distance?: number;
};

type ResponseData = {
  wikipediaInfo: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ 
      wikipediaInfo: "", 
      error: "Method not allowed" 
    });
  }

  try {
    const { poi } = req.body;
    
    if (!poi || typeof poi !== "object" || 
        typeof poi.latitude !== "number" || 
        typeof poi.longitude !== "number") {
      return res.status(400).json({ 
        wikipediaInfo: "",
        error: "Invalid POI data. Please provide a valid POI with latitude and longitude." 
      });
    }

    const wikipediaInfo = await getWikipediaInfo(poi as POIData);
    return res.status(200).json({ wikipediaInfo });
  } catch (error) {
    console.error("Error fetching Wikipedia info:", error);
    return res.status(500).json({ 
      wikipediaInfo: "",
      error: "Failed to fetch Wikipedia information" 
    });
  }
} 