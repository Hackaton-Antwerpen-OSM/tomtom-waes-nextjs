import { PointOfInterest, Message } from "@/types";

export async function fetchNearbyPOIs(location: {
  latitude: number;
  longitude: number;
}) {
  const response = await fetch("/api/poi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ location }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch points of interest");
  }

  const data = await response.json();
  return data.pois as PointOfInterest[];
}

export async function generateStoryFromAPI(
  pois: PointOfInterest[],
  messages: Message[]
) {
  const response = await fetch("/api/story", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pois, messages }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate story");
  }

  return response.json();
}

export async function fetchWikipediaInfo(poi: PointOfInterest) {
  const response = await fetch("/api/wikipedia", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ poi }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Wikipedia information");
  }

  const data = await response.json();
  return data.wikipediaInfo as string;
}

export async function translateText(text: string) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("Failed to translate text");
  }

  const data = await response.json();
  return data.translatedText as string;
}
