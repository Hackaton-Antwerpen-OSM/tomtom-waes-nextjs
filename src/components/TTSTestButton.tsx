export default function TTSTestButton() {
  return (
    <div>
      <button
        onClick={async () => {
          try {
            const response = await fetch("/api/tts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: "Joenge fucked up manneke 't schipperskwartier ofwa?!",
                voiceSettings: {
                  stability: 0.5,
                  similarity_boost: 0.75,
                  style: 0.8,
                  speed: 0.8,
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
          } catch (error) {
            console.error("TTS error:", error);
          }
        }}
      >
        Sound
      </button>
    </div>
  );
}
