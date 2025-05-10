import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Message } from "../types";
import { Navigation, User, Bot } from "lucide-react";

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
      } mb-4 animate-fade-in`}
    >
      <div className="flex items-start gap-2 max-w-[85%] md:max-w-[70%] bg-slate-200">
        {isAssistant && (
          <div className="w-8 h-8 rounded-full bg-wanderlust-blue flex items-center justify-center flex-shrink-0">
            <Bot className="h-5 w-5 text-white" />
          </div>
        )}
        <Card
          className={`${
            isAssistant ? "bg-white" : "bg-wanderlust-blue text-white"
          }`}
        >
          <CardContent className="p-4">
            <div className="narrative-text">{formatText(message.content)}</div>

            {isLastMessage &&
              isAssistant &&
              (onButtonClick || onShowDirections) && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  {onButtonClick && (
                    <Button
                      onClick={onButtonClick}
                      className="bg-green-300 hover:bg-green-300/90 text-white"
                    >
                      I've arrived
                    </Button>
                  )}
                  {onShowDirections && (
                    <Button
                      onClick={onShowDirections}
                      variant="outline"
                      className="border-wanderlust-blue text-wanderlust-blue hover:bg-wanderlust-blue/10"
                    >
                      <Navigation className="mr-1 h-4 w-4" />
                      Show directions
                    </Button>
                  )}
                </div>
              )}
          </CardContent>
        </Card>
        {!isAssistant && (
          <div className="w-8 h-8 rounded-full bg-green-300 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryCard;
