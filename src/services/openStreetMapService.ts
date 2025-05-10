import { Location, PointOfInterest } from "../types";

const OSM_OVERPASS_API = "https://overpass-api.de/api/interpreter";

// List of types to exclude from results
const EXCLUDED_TYPES = [
  "traffic_signals",
  "crossing",
  "street_lamp",
  "tree",
  "waste_basket",
  "post_box",
  "bollard",
  "bench",
  "recycling",
  "bicycle_parking",
  "surveillance",
  "parking",
  "parking_entrance",
  "parking_space",
  "car_sharing",
  "bus_stop",
  "restaurant",
  "fast_food",
];

// List of amenities we want to keep (higher value POIs)
const VALUABLE_AMENITIES = [
  "cafe",
  "pub",
  "bar",
  "tourist_attraction",
  "poi",
  "poi_category",
  "monument",
  "historic",
  "park",
  "church",
  "cinema",
  "theatre",
  "museum",
  "library",
  "marketplace",
  "arts_centre",
  "fountain",
  "nightclub",
  "gallery",
];

/**
 * Fetches points of interest near a location with an expanding radius if needed
 */
export async function getNearbyPointsOfInterest(
  location: Location,
  initialRadius: number = 500
): Promise<PointOfInterest[]> {
  // Try with increasing radius until we find something or hit max radius
  const maxRadius = 5000; // 5km max search radius
  const radiusStep = 900; // Increase by 900m each time

  let radius = initialRadius;
  let pois: PointOfInterest[] = [];

  while (radius <= maxRadius) {
    try {
      console.log(`Searching for POIs with radius: ${radius}m`);
      pois = await fetchPointsOfInterest(location, radius);

      // If we found POIs, exit the loop
      if (pois.length > 0) {
        console.log(
          `Found ${pois.length} points of interest within ${radius}m`
        );
        break;
      }

      // Increase radius and try again
      radius += radiusStep;
      console.log(`No POIs found, expanding search radius to ${radius}m`);
    } catch (error) {
      console.error(`Error searching with radius ${radius}m:`, error);
      radius += radiusStep;
      console.log(`Error occurred, trying with expanded radius: ${radius}m`);
    }
  }

  return pois;
}

/**
 * Fetches points of interest from OpenStreetMap for a specific location and radius
 */
async function fetchPointsOfInterest(
  location: Location,
  radius: number
): Promise<PointOfInterest[]> {
  try {
    // Build Overpass QL query to find interesting nodes around the user's location
    // Fixed syntax issues with the regex operators
    const overpassQuery = `
      [out:json];
      (
         node["historic"](around:${radius}, ${location.latitude}, ${location.longitude});
  way["historic"](around:${radius}, ${location.latitude}, ${location.longitude});
  relation["historic"](around:${radius}, ${location.latitude}, ${location.longitude});
  node["tourism"~"museum|attraction|viewpoint|gallery|zoo"](around:${radius}, ${location.latitude}, ${location.longitude});
  way["tourism"~"museum|attraction|viewpoint|gallery|zoo"](around:${radius}, ${location.latitude}, ${location.longitude});
  relation["tourism"~"museum|attraction|viewpoint|gallery|zoo"](around:${radius}, ${location.latitude}, ${location.longitude});
      );
      out body;
    `;

    const response = await fetch(OSM_OVERPASS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch from Overpass API: ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log("💩 OSM data", data);

    // Transform OSM data to our PointOfInterest format
    const pois: PointOfInterest[] = data.elements.map((element: any) => {
      // Calculate distance from current location to the POI
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        element.lat,
        element.lon
      );

      // Determine POI type based on OSM tags
      let poiType = "unknown";
      if (element.tags) {
        if (element.tags.shop) poiType = element.tags.shop;
        else if (element.tags.tourism) poiType = element.tags.tourism;
        else if (element.tags.amenity) poiType = element.tags.amenity;
        else if (element.tags.historic) poiType = element.tags.historic;
        else if (element.tags.leisure) poiType = element.tags.leisure;
        else if (element.tags.natural) poiType = element.tags.natural;
        else if (element.tags.man_made) poiType = element.tags.man_made;
        else if (element.tags.memorial) poiType = element.tags.memorial;
      }

      return {
        id: element.id.toString(),
        name:
          element.tags?.name ||
          element.tags?.operator ||
          `${poiType} at ${Math.round(distance)}m`,
        type: poiType,
        latitude: element.lat,
        longitude: element.lon,
        distance: Math.round(distance),
      };
    });

    // Apply more rigorous filtering
    return pois
      .filter((poi) => {
        // Must have a name
        if (!poi.name || poi.name.trim() === "") return false;

        // Filter out excluded types
        if (EXCLUDED_TYPES.includes(poi.type)) return false;

        // If it's an amenity, make sure it's one we want to keep
        if (poi.type === "amenity" && !VALUABLE_AMENITIES.includes(poi.type))
          return false;

        // Make sure it has a reasonable name (not just a number or very short string)
        const nameWithoutNumbers = poi.name.replace(/[0-9]/g, "").trim();
        if (nameWithoutNumbers.length <= 2) return false;

        return true;
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 30); // Return more POIs (15 instead of 10) since we're searching a larger area
  } catch (error) {
    console.error("Error fetching POIs:", error);
    throw error;
  }
}

// Haversine formula to calculate distance between two lat/lng points in meters
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function getWikipediaInfo(poi: PointOfInterest): Promise<string> {
  try {
    // First search for relevant Wikipedia articles near the POI coordinates
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${poi.latitude}|${poi.longitude}&gsradius=500&gslimit=1&format=json&origin=*`;

    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      throw new Error("Failed to fetch Wikipedia search results");
    }

    const searchData = await searchResponse.json();

    if (
      !searchData.query.geosearch ||
      searchData.query.geosearch.length === 0
    ) {
      return `I couldn't find specific information about ${poi.name} on Wikipedia. This place appears to be a ${poi.type} located about ${poi.distance}m from your current position.`;
    }

    const pageId = searchData.query.geosearch[0].pageid;

    // Get the extract (summary) from the page
    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&pageids=${pageId}&format=json&origin=*`;

    const extractResponse = await fetch(extractUrl);

    if (!extractResponse.ok) {
      throw new Error("Failed to fetch Wikipedia extract");
    }

    const extractData = await extractResponse.json();
    const extract = extractData.query.pages[pageId].extract;

    if (!extract || extract.trim() === "") {
      return `${poi.name} is a ${poi.type} located about ${poi.distance}m from your current position, but I couldn't find detailed information about it.`;
    }

    return extract;
  } catch (error) {
    console.error("Error fetching Wikipedia info:", error);
    return `${poi.name} is a ${poi.type} located about ${poi.distance}m from your current position. I couldn't retrieve additional information due to an error.`;
  }
}
