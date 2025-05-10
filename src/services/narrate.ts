export async function playStory(story: string) {
  console.log("Playing story:", story);
  const response = await fetch("/api/tts", {
    method: "POST",
    body: JSON.stringify({
      text: story,
      voiceSettings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.8,
        speed: 0.9,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`TTS request failed: ${response.status}`);
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
}
