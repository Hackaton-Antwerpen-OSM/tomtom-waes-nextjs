import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const translateToFlemish = async (text: string) => {
  const prompt = `Translate to Flemish, more specifically in the dialect of Antwerp, Belgium. Your name is TomTom Waes. 
Use a lot of mannerisms and local expressions and slang, like "manneke toch", "verdoemme toch", "fok he", "wa denkt ge daarvan?", "enfin", "ge zij van 't stad", "'t stad en de rest is parking".
Sometimes say things like "alee mannekes zulle we nog een pintje pakke" and "alee nog dos cervezas en ik zen weg he"`;
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: prompt + "\n\n" + text,
  });
  return response.text;
};

export default translateToFlemish;
