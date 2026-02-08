import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2 } from "lucide-react";
import { characters } from "@/lib/characters";
import { ChatMessage } from "@/components/ChatMessage";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SharedChat {
  id: string;
  character_id: string;
  title: string | null;
  created_at: string;
}

export default function SharedChat() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sharedChat, setSharedChat] = useState<SharedChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const character = sharedChat
    ? characters.find((c) => c.id === sharedChat.character_id)
    : null;

  useEffect(() => {
    const loadSharedChat = async () => {
      if (!shareId) return;

      // Fetch shared chat
      const { data: chatData, error: chatError } = await supabase
        .from("shared_chats")
        .select("*")
        .eq("share_id", shareId)
        .single();

      if (chatError || !chatData) {
        setError("This shared chat doesn't exist or has been removed.");
        setLoading(false);
        return;
      }

      setSharedChat(chatData);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("shared_messages")
        .select("role, content")
        .eq("shared_chat_id", chatData.id)
        .order("created_at", { ascending: true });

      if (!messagesError && messagesData) {
        setMessages(messagesData as Message[]);
      }

      setLoading(false);
    };

    loadSharedChat();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex gap-1">
          <span className="w-3 h-3 rounded-full bg-primary animate-bounce" />
          <span className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-strong rounded-2xl p-8 text-center max-w-md">
          <Share2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display text-xl font-semibold mb-2">Chat Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "This character no longer exists."}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-strong border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${character.color} flex items-center justify-center text-xl`}
            >
              {character.avatar}
            </div>
            <div>
              <h1 className="font-display font-semibold">{character.name}</h1>
              <p className="text-xs text-muted-foreground">Shared conversation</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  character={character}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            This is a shared conversation • <button onClick={() => navigate("/")} className="text-primary hover:underline">Start your own chat</button>
          </p>
        </div>
      </footer>
    </div>
  );
}
