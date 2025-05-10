import { PointOfInterest, Message, StoryResponse } from "../types";

/**
 * Generate a story using Google Gemini API
 */
export async function generateStory(
  pois: PointOfInterest[],
  previousMessages: Message[] = []
): Promise<StoryResponse> {
  try {
    // if (!apiKey) {
    //   console.error("No API key found");
    //   // Fallback to simulated response if API key is not provided
    //   return generateSimulatedStoryResponse(pois, previousMessages);
    // }

    console.log("Generating story with Gemini AI: ", pois);

    // Select the most interesting POIs using Gemini AI
    const selectedPOIs = await selectInterestingPOIs(pois);
    const nextDestination = selectedPOIs[0];

    // Check if there are previous messages to provide context
    //const hasContext = previousMessages.length > 0;

    // Create the prompt for Gemini to generate a story
    const prompt = createStoryPrompt(selectedPOIs, previousMessages);

    // Make the API call to Gemini
    console.log("👉👌 prompt: ", prompt);
    const response = await fetch("/api/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    console.log("💩 Gemini response", response);

    if (!response.ok) {
      console.error("Error from Gemini API");
      throw new Error(`Gemini API error: ${response}`);
    }

    const story = await response.json();
    const storyText = story.text;
    console.log("💩 Gemini JSON response", storyText);

    return {
      selectedPOIs,
      story: storyText,
      nextDestination,
    };
  } catch (error) {
    console.error("Error generating story with Gemini:", error);

    // Fallback to simulated response
    return generateSimulatedStoryResponse(pois, previousMessages);
  }
}

/**
 * Select the most interesting POIs from the list using Gemini AI
 */
async function selectInterestingPOIs(
  pois: PointOfInterest[]
): Promise<PointOfInterest[]> {
  if (pois.length <= 3) {
    // If no API key or not enough POIs, return the first 3 (or fewer)
    console.log("Not enough POIs, returning the first 3");
    return pois.slice(0, 3);
  }

  try {
    // Create a prompt for Gemini to evaluate the POIs
    const prompt = `
You are an AI travel guide tasked with selecting the most interesting locations from a list.
Your goal is to choose exactly 3 diverse and engaging points of interest that would make for an interesting adventure.

Here are the points of interest, with their name, type, and distance from the user:
${pois
  .map(
    (poi, index) =>
      `${index + 1}. ${poi.name} (${poi.type}, ${poi.distance}m away)`
  )
  .join("\n")}

Select the 3 most interesting, diverse, and unique locations from this list.
Format your response as a JSON array with just the indices (1-based) of your selections.
Example: [4, 7, 12]
`;

    console.log("💩 POI selection: Gemini prompt", prompt);

    // Make the API call to Gemini
    const response = await fetch("/api/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    console.log("💩 POI selection: Gemini response", response);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response}`);
    }

    const responseJson = await response.json();
    const selectionText = responseJson.text;
    console.log("💩 POI selection: Gemini response", selectionText);

    // Extract JSON array from the response
    const matches = selectionText.match(/\[.*?\]/);
    if (!matches) {
      throw new Error("Could not parse Gemini response");
    }

    // Parse the indices and select the corresponding POIs
    const selectedIndices = JSON.parse(matches[0]);
    const selectedPOIs = selectedIndices
      .map((index: number) => pois[index - 1])
      .filter((poi: PointOfInterest | undefined) => poi !== undefined);

    // If we couldn't get 3 POIs from the selection, fill with the top POIs
    if (selectedPOIs.length < 3) {
      const remainingPOIs = pois.filter((poi) => !selectedPOIs.includes(poi));
      selectedPOIs.push(...remainingPOIs.slice(0, 3 - selectedPOIs.length));
    }

    console.log("💩 POI selection: Selected POIs", selectedPOIs);

    return selectedPOIs.slice(0, 3);
  } catch (error) {
    console.error("Error selecting POIs with Gemini:", error);
    // Fallback to simple selection
    return pois.slice(0, 3);
  }
}

/**
 * Create a prompt for Gemini to generate a story based on selected POIs and conversation history
 */
function createStoryPrompt(
  selectedPOIs: PointOfInterest[],
  previousMessages: Message[]
): string {
  const poiDescriptions = selectedPOIs
    .map((poi) => `- ${poi.name} (${poi.type}, ${poi.distance}m away)`)
    .join("\n");

  const conversationContext = previousMessages
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  return `You are a local guide and storyteller named Wanderlust Assistant.
The user is currently at a location near these points of interest:
${poiDescriptions}

${
  previousMessages.length > 0
    ? `Previous conversation context:
${conversationContext}`
    : ""
}

Create an engaging narrative that connects these 3 locations. Make the story feel like an adventure or a discovery.
Recommend the first location in the list as the next destination for the user to visit.
Your response should be friendly and conversational, as if you're a knowledgeable local friend showing them around.
Include some brief historical or interesting facts about these places.
End with a question that encourages the user to visit the recommended destination.

Answer in Flemish, more specifically in the dialect of Antwerp, Belgium. Your name is TomTom Waes. 
Use a lot of mannerisms and local expressions and slang, like "manneke toch", "verdoemme toch", "fok he", "wa denkt ge daarvan?", "ge zij van 't stad", "'t stad en de rest is parking" .`;
}

/**
 * Generate a simulated story response when Gemini API is unavailable
 */
function generateSimulatedStoryResponse(
  pois: PointOfInterest[],
  previousMessages: Message[] = []
): StoryResponse {
  // Select 3 POIs
  const selectedPOIs = pois.slice(0, 3);
  const nextDestination = selectedPOIs[0];

  // Generate a simulated story that introduces the points of interest
  const poiDescriptions = selectedPOIs
    .map((poi) => `${poi.name} (${poi.type}, ${poi.distance}m away)`)
    .join(", ");

  // Check if there are previous messages to provide context
  const hasContext = previousMessages.length > 0;

  let storyText = "";

  if (!hasContext) {
    // First interaction - introduce the journey
    storyText = `
’k Heb wa schone plekjes ontdekt ier in de buurt! Zal ik u ne keer nen avontuur aanraden?
Nie ver van ier, vindt ge ${poiDescriptions}.
Ik zou aanraden om eerst naar ${nextDestination.name} te gaan, da’s maar ${nextDestination.distance} meter van ier. ’t Schijnt nen interessante ${nextDestination.type} te zijn. Laat maar weten as ge der zijt, dan vertel ik u nog wa meer!
Wa denkt ge? Goesting om ernaartoe te gaan?`;
  }

  return {
    selectedPOIs,
    story: storyText,
    nextDestination,
  };
}
