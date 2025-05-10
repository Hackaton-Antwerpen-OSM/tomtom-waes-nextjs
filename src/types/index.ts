
export interface Location {
  latitude: number;
  longitude: number;
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  distance?: number;
  description?: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface StoryResponse {
  selectedPOIs: PointOfInterest[];
  story: string;
  nextDestination: PointOfInterest;
}
