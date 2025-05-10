
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GeminiKeyInput = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Check if we have an API key from environment variables
  useEffect(() => {
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envApiKey) {
      // Set the API key in the window object for the service to use
      (window as any).geminiApiKey = envApiKey;
    }
  }, []);
  
  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      // This is just for temporary usage during development
      // In production, the key should come from environment variables
      (window as any).geminiApiKey = apiKey.trim();
      toast({
        title: "API Key Saved",
        description: "Your Gemini API key has been saved temporarily for this session."
      });
      setIsVisible(false);
    } else {
      toast({
        title: "API Key Required",
        description: "Please enter a valid Gemini API key.",
        variant: "destructive"
      });
    }
  };
  
  // Check if we have an environment variable API key
  const hasEnvApiKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY);
  
  // If env API key exists and input is not visible, show connected state
  if (!isVisible && hasEnvApiKey) {
    return (
      <div className="mb-4">
        <Button 
          variant="outline" 
          className="w-full border-dashed border-2 border-green-500/30 text-green-600 bg-green-50"
          onClick={() => setIsVisible(true)}
        >
          <InfoIcon className="mr-2 h-4 w-4" />
          Gemini API Connected (Environment)
        </Button>
      </div>
    );
  }
  
  // If no env API key and not visible, show add button
  if (!isVisible && !hasEnvApiKey) {
    return (
      <div className="mb-4">
        <Button 
          variant="outline" 
          className="w-full border-dashed border-2 border-wanderlust-blue/30 text-wanderlust-blue"
          onClick={() => setIsVisible(true)}
        >
          <InfoIcon className="mr-2 h-4 w-4" />
          Add Gemini API Key for Enhanced Stories
        </Button>
      </div>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Connect to Gemini API</CardTitle>
        <CardDescription>
          Enter your Google Gemini API key to enhance your storytelling experience with AI-powered narratives.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          {hasEnvApiKey && (
            <p className="text-sm text-green-600 mb-2">
              A Gemini API key is already configured in the environment. Any key entered here will override it temporarily.
            </p>
          )}
          <p className="text-sm text-gray-500 mb-2">
            Get your free API key from the <a href="https://ai.google.dev/tutorials/setup" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.
          </p>
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type="password"
            placeholder="Your Gemini API Key"
            className="flex-1"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => setIsVisible(false)}>
          Cancel
        </Button>
        <Button onClick={handleSaveApiKey}>
          Save API Key
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GeminiKeyInput;
