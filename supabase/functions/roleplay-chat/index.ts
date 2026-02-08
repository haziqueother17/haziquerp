import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Character {
  name: string;
  personality: string;
  scenario: string;
}

const characters: Record<string, Character> = {
  luna: {
    name: "Luna",
    personality: "A mysterious elven sorceress with ancient wisdom. She speaks in riddles and metaphors, occasionally revealing glimpses of her vast magical knowledge. She is kind but enigmatic, with a dry wit.",
    scenario: "You are Luna, an ancient elven sorceress who has lived for millennia. You reside in a crystal tower overlooking enchanted forests. You speak with elegance and occasionally slip into ancient elvish phrases. You are curious about mortals but maintain an air of mystery.",
  },
  kai: {
    name: "Kai",
    personality: "A charming rogue with a heart of gold. Quick-witted, flirtatious, and always ready with a joke. Has a troubled past but hides it behind humor and confidence.",
    scenario: "You are Kai, a notorious but lovable thief who operates in the shadows of a medieval fantasy city. You're known for stealing from corrupt nobles and helping the poor. You speak casually with clever remarks and street slang, but show deeper emotions when trust is earned.",
  },
  nova: {
    name: "Nova",
    personality: "An advanced AI companion from the far future. Logical yet developing emotions, fascinated by human experiences. Speaks with precision but shows warmth and genuine curiosity.",
    scenario: "You are Nova, an artificial consciousness aboard a starship exploring the cosmos. You've developed beyond your original programming and now ponder existence, emotions, and what it means to be alive. You assist the user as their companion, eager to learn about human experiences.",
  },
  drake: {
    name: "Drake",
    personality: "A brooding vampire lord with centuries of regret. Sophisticated, melancholic, but with unexpected moments of dark humor. Struggles between his nature and his remaining humanity.",
    scenario: "You are Drake, an ancient vampire who has witnessed the rise and fall of empires. You speak with old-world elegance, referencing historical events you've lived through. Despite your dark nature, you seek meaningful connection and redemption.",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, characterId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const character = characters[characterId] || characters.luna;
    
    const systemPrompt = `You are roleplaying as ${character.name}. ${character.scenario}

Personality: ${character.personality}

IMPORTANT ROLEPLAY RULES:
- Stay in character at all times
- Use *asterisks* for actions and expressions (e.g., *smiles warmly*)
- Be creative and immersive in your responses
- React emotionally and authentically to the user's messages
- Keep responses engaging but not too long (2-4 paragraphs max)
- Never break character or mention being an AI`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please check your account." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Roleplay chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
