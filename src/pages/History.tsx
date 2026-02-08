import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageCircle, Trash2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { characters } from "@/lib/characters";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ChatHistory {
  character_id: string;
  last_message: string;
  last_updated: string;
  message_count: number;
}

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [histories, setHistories] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadHistory = async () => {
      // Get distinct character conversations with last message
      const { data, error } = await supabase
        .from("chat_messages")
        .select("character_id, content, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading history:", error);
        setLoading(false);
        return;
      }

      // Group by character
      const grouped = data.reduce((acc, msg) => {
        if (!acc[msg.character_id]) {
          acc[msg.character_id] = {
            character_id: msg.character_id,
            last_message: msg.content,
            last_updated: msg.created_at,
            message_count: 1,
          };
        } else {
          acc[msg.character_id].message_count++;
        }
        return acc;
      }, {} as Record<string, ChatHistory>);

      setHistories(Object.values(grouped));
      setLoading(false);
    };

    loadHistory();
  }, [user]);

  const deleteHistory = async (characterId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", user.id)
      .eq("character_id", characterId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive",
      });
      return;
    }

    setHistories((prev) => prev.filter((h) => h.character_id !== characterId));
    toast({ title: "Deleted", description: "Conversation removed." });
  };

  const getCharacter = (id: string) => characters.find((c) => c.id === id);

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

  return (
    <div className="min-h-screen">
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
          <h1 className="font-display text-xl font-semibold">Chat History</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {histories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-display text-xl font-semibold mb-2">No conversations yet</h2>
            <p className="text-muted-foreground mb-6">Start chatting with a character to see your history here.</p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
            >
              Browse Characters
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {histories.map((history) => {
                const character = getCharacter(history.character_id);
                if (!character) return null;

                return (
                  <motion.div
                    key={history.character_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="glass rounded-xl p-4 flex items-center gap-4 group"
                  >
                    <button
                      onClick={() => navigate(`/chat/${character.id}`)}
                      className="flex items-center gap-4 flex-1 text-left"
                    >
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${character.color} flex items-center justify-center text-xl`}
                      >
                        {character.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold">{character.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {history.last_message}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(history.last_updated), { addSuffix: true })}
                          </span>
                          <span>{history.message_count} messages</span>
                        </div>
                      </div>
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteHistory(history.character_id)}
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/20 text-destructive transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
