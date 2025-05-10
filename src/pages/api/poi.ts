import type { NextApiRequest, NextApiResponse } from "next";
import { getNearbyPointsOfInterest } from "@/services/openStreetMapService";
import { PointOfInterest } from "@/types";

type ResponseData = {
  pois: PointOfInterest[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ pois: [], error: "Method not allowed" });
  }

  try {
    const { location } = req.body;
    
    if (!location || typeof location.latitude !== "number" || typeof location.longitude !== "number") {
      return res.status(400).json({ 
        pois: [],
        error: "Invalid location data. Please provide latitude and longitude." 
      });
    }

    const pois = await getNearbyPointsOfInterest(location);
    return res.status(200).json({ pois });
  } catch (error) {
    console.error("Error fetching POIs:", error);
    return res.status(500).json({ 
      pois: [],
      error: "Failed to fetch points of interest" 
    });
  }
} 