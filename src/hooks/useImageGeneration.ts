import { useState, useCallback } from "react";
import { toast } from "sonner";

const GENERATE_IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;

export function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = useCallback(async (prompt: string): Promise<string | null> => {
    setIsGenerating(true);
    try {
      const response = await fetch(GENERATE_IMAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment.");
        } else if (response.status === 402) {
          toast.error("Usage limit reached.");
        } else {
          toast.error(errorData.error || "Failed to generate image");
        }
        return null;
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error("Image generation error:", error);
      toast.error("Failed to generate image");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generateImage, isGenerating };
}
