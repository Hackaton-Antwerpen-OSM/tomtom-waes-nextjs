import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Message } from "../types";
import { Navigation, User } from "lucide-react";

interface StoryCardProps {
  message: Message;
  isLastMessage: boolean;
  onButtonClick?: () => void;
  onShowDirections?: () => void;
}

const StoryCard: React.FC<StoryCardProps> = ({
  message,
  isLastMessage,
  onButtonClick,
  onShowDirections,
}) => {
  const isAssistant = message.role === "assistant";

  // Function to convert text to paragraphs
  const formatText = (text: string) => {
    return text.split("\n\n").map((paragraph, idx) => (
      <p key={idx} className={`mb-4 ${!isAssistant ? "text-white" : ""}`}>
        {paragraph}
      </p>
    ));
  };

  return (
    <div
      className={`flex ${
        isAssistant ? "justify-start" : "justify-end"
      } mb-4 animate-fade-in text-sm`}
    >
      <div className="flex items-start gap-2 max-w-[85%] md:max-w-[70%]">
        {isAssistant && (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="TomTom Waes" className="h-8 w-8" />
          </div>
        )}
        <Card
          className={`${isAssistant ? "bg-white" : "bg-blue-500 text-white"} border-0`}
        >
          <CardContent className="p-3 border-0">
            <div className="narrative-text">{formatText(message.content)}</div>

            {isLastMessage &&
              isAssistant &&
              (onButtonClick || onShowDirections) && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  {onButtonClick && (
                    <Button
                      onClick={onButtonClick}
                      className="bg-blue-600 hover:bg-green-300/90 text-white"
                    >
                      &apos;k zen daar!
                    </Button>
                  )}
                  {onShowDirections && (
                    <Button
                      onClick={onShowDirections}
                      variant="outline"
                      className="border-blue-500 text-blue-500 hover:bg-blue-500"
                    >
                      <Navigation className="mr-1 h-4 w-4" />
                      Route
                    </Button>
                  )}
                </div>
              )}
          </CardContent>
        </Card>
        {!isAssistant && (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryCard;
