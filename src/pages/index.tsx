import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Compass, Locate, Navigation, Car, Send } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
import {
  getNearbyPointsOfInterest,
  getWikipediaInfo,
} from "@/services/openStreetMapService";
import { generateStory } from "@/services/storyGenerationService";
import { PointOfInterest, Message } from "@/types";
import Map from "@/components/Map";
import StoryCard from "@/components/StoryCard";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import TTSTestButton from "@/components/TTSTestButton";
import { Input } from "@/components/ui/input";
import { translateText } from "@/services/helper";
import { playStory } from "@/services/narrate";

const Index = () => {
  const { toast } = useToast();
  const { location, error, loading, getCurrentLocation } = useLocation();
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>(
    []
  );
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fetchingPOIs, setFetchingPOIs] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [transportMode, setTransportMode] = useState<"car" | "foot">("car");
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    if (error) {
      toast({
        title: "Geen Locatie",
        description:
          "Zet uw locatie aan, manneke, anders kunnen we nie verder!",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleExploreClick = async () => {
    if (!location) {
      toast({
        title: "Geen Locatie",
        description:
          "Zet uw locatie aan, manneke, anders kunnen we nie verder!",
        variant: "destructive",
      });
      return;
    }

    try {
      setFetchingPOIs(true);
      const pois = await getNearbyPointsOfInterest(location);
      setPointsOfInterest(pois);

      if (pois.length === 0) {
        toast({
          title: "Geen Interessante Plekjes",
          description:
            "Verdoemme toch, hier is niks te doen! Ga maar naar nen andere plek, manneke.",
        });
        return;
      }

      setGeneratingStory(true);
      const storyResponse = await generateStory(pois, messages);

      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: "Tell me about interesting places around here.",
        },
      ]);

      // Add assistant response with story
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: storyResponse.story,
        },
      ]);

      // Play the story
      playStory(storyResponse.story);

      setSelectedPOI(storyResponse.nextDestination);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Fok he!",
        description:
          "Da is nie gelukt, manneke. Kunnen de interessante plekjes nie vinden.",
        variant: "destructive",
      });
    } finally {
      setFetchingPOIs(false);
      setGeneratingStory(false);
    }
  };

  const handleArrivalConfirmed = async () => {
    if (!selectedPOI) return;

    try {
      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `I've arrived at ${selectedPOI.name}.`,
        },
      ]);

      // Fetch more info about the location from Wikipedia
      const wikipediaInfo = await getWikipediaInfo(selectedPOI);

      const translatedInfo = await translateText(
        `You've arrived at ${selectedPOI.name}! ${wikipediaInfo}\n\nWould you like to explore more places nearby?`
      );

      // Add assistant response with location info
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: translatedInfo,
        },
      ]);

      // Play the story
      playStory(translatedInfo);

      // Reset selection to enable exploring again
      setSelectedPOI(null);
    } catch (error) {
      console.error("Error fetching location info:", error);
      toast({
        title: "Error",
        description: "Failed to fetch information about this location.",
        variant: "destructive",
      });
    }
  };

  const toggleDirections = () => {
    if (!selectedPOI) {
      toast({
        title: "Geen Bestemming Gekozen",
        description:
          "Klik eerst op 'Vertel me erover' om nen plek te kiezen, manneke!",
      });
      return;
    }

    setShowDirections((prev) => !prev);

    toast({
      title: showDirections ? "Route Verborgen" : "Route Getoond",
      description: showDirections
        ? "De route is nu weg, manneke."
        : `Hier hebt ge de ${
            transportMode === "foot" ? "wandel" : "auto"
          }route naar ${selectedPOI.name}, manneke!`,
    });
  };

  // Handle transport mode change
  const handleTransportModeChange = (value: string) => {
    if (value === "car" || value === "foot") {
      setTransportMode(value);

      if (showDirections && selectedPOI) {
        toast({
          title: `${value === "foot" ? "Wandel" : "Autoroute"}`,
          description: `Nu gaan we ${
            value === "foot" ? "te voet" : "met de auto"
          } naar ${selectedPOI.name}, manneke!`,
        });
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: inputMessage,
      },
    ]);

    // Clear input
    setInputMessage("");

    try {
      setGeneratingStory(true);
      const storyResponse = await generateStory(pointsOfInterest, [
        ...messages,
        { role: "user", content: inputMessage },
      ]);

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: storyResponse.story,
        },
      ]);

      setSelectedPOI(storyResponse.nextDestination);
    } catch (error) {
      console.error("Error generating response:", error);
      toast({
        title: "Error",
        description: "Failed to generate a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingStory(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <header className="bg-black text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <img src="/logo.png" alt="TomTom Waes" className="w-10 h-10" />
          <h1 className="text-2xl font-serif">TomTom Waes</h1>
          <div className="flex gap-2">
            <TTSTestButton />
            {selectedPOI && (
              <Button
                className={`text-white hover:bg-blue-500 ${
                  showDirections ? "bg-blue-500" : ""
                }`}
                onClick={toggleDirections}
              >
                <Navigation className="h-5 w-5" />
              </Button>
            )}
            <Button
              className="text-white hover:bg-blue-500"
              onClick={getCurrentLocation}
              disabled={loading}
            >
              <Locate className={`h-5 w-5 ${loading ? "animate-pulse" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Map Section */}
        <div className="mb-6">
          <Map
            userLocation={location}
            pointsOfInterest={pointsOfInterest}
            selectedPOI={selectedPOI}
            showDirections={showDirections}
            transportMode={transportMode}
          />

          {showDirections && selectedPOI && (
            <div className="mt-2 px-3 py-2 bg-blue-500 rounded-md">
              <div className="flex justify-between items-center">
                <p className="text-sm text-blue-500">
                  <span className="font-medium">Directions:</span> Navigate to{" "}
                  {selectedPOI.name}, {selectedPOI.distance}m away
                </p>
                <ToggleGroup
                  type="single"
                  value={transportMode}
                  onValueChange={handleTransportModeChange}
                  className="bg-white rounded-md"
                >
                  <ToggleGroupItem
                    value="car"
                    aria-label="Drive"
                    title="Driving directions"
                  >
                    <Car className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="foot"
                    aria-label="Walk"
                    title="Walking directions"
                  >
                    <Navigation className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          )}
        </div>

        {/* Location info */}
        <div className="mb-6">
          <div className="bg-white rounded-md shadow-sm p-4">
            <h2 className="font-serif text-lg text-blue-500 mb-2">
              Your Location
            </h2>
            {location ? (
              <p className="text-sm text-gray-600">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                {loading
                  ? "We zoeken u op, manneke..."
                  : "We weten nie waar ge zijt, manneke!"}
              </p>
            )}
          </div>
        </div>

        {/* Gemini API Key Input */}
        {/* <GeminiKeyInput /> */}

        {/* Story/conversation section */}
        <div className="mb-6">
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((message, index) => (
                <StoryCard
                  key={index}
                  message={message}
                  isLastMessage={index === messages.length - 1}
                  onButtonClick={
                    message.role === "assistant" &&
                    index === messages.length - 1 &&
                    selectedPOI
                      ? handleArrivalConfirmed
                      : undefined
                  }
                  onShowDirections={
                    message.role === "assistant" &&
                    index === messages.length - 1 &&
                    selectedPOI &&
                    !showDirections
                      ? toggleDirections
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <h2 className="font-serif text-xl text-blue-500 mb-3">
                Welkom bij TomTom Waes manneke!
              </h2>
              <p className="text-gray-600 mb-6">
                Ontdek de schone plekjes rond u met uw lokale gids TomTom Waes.
                <br />
                Das nogal ne keirel ze!
              </p>
              <div className="inline-block animate-pulse-light">
                <Compass size={48} className="text-blue-500 mx-auto mb-4" />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer with input and explore button */}
      <footer className="bg-white p-4 shadow-lg">
        <div className="container mx-auto space-y-4">
          {/* Message input */}
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              disabled={generatingStory}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || generatingStory}
              className="bg-blue-500 hover:bg-blue-500 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Explore button */}
          <Button
            className="w-full bg-green-300 hover:bg-green-300/90 text-black font-medium py-6"
            onClick={handleExploreClick}
            disabled={!location || fetchingPOIs || generatingStory}
          >
            {fetchingPOIs
              ? "We zoeken schone plekjes..."
              : generatingStory
              ? "We maken nen verhaaltje..."
              : "Ontdek 't stad!"}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Index;
