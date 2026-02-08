import { useState, useCallback } from "react";
import { toast } from "sonner";

const GENERATE_VIDEO_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`;

export function useVideoGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateVideo = useCallback(async (prompt: string, startingFrame?: string): Promise<string | null> => {
    setIsGenerating(true);
    try {
      const response = await fetch(GENERATE_VIDEO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt, startingFrame }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment.");
        } else if (response.status === 402) {
          toast.error("Usage limit reached.");
        } else {
          toast.error(errorData.error || "Failed to generate video");
        }
        return null;
      }

      const data = await response.json();
      return data.videoUrl;
    } catch (error) {
      console.error("Video generation error:", error);
      toast.error("Failed to generate video");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generateVideo, isGenerating };
}
