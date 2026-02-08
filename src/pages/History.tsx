import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageCircle, Trash2, Clock, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { characters } from "@/lib/characters";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChatHistory {
  character_id: string;
  last_message: string;
  last_updated: string;
  message_count: number;
  session_id?: string;
  name?: string;
}

const truncateName = (name: string): string => {
  return name.trim().split(/\s+/).slice(0, 3).join(" ");
};

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [histories, setHistories] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadHistory = async () => {
      // Get chat sessions first
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id);

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
          const session = sessions?.find(s => s.character_id === msg.character_id);
          acc[msg.character_id] = {
            character_id: msg.character_id,
            last_message: msg.content,
            last_updated: msg.created_at,
            message_count: 1,
            session_id: session?.id,
            name: session?.name,
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

  const startEdit = (history: ChatHistory) => {
    setEditingId(history.character_id);
    const character = getCharacter(history.character_id);
    setEditName(history.name || character?.name || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (history: ChatHistory) => {
    if (!user) return;

    const truncatedName = truncateName(editName);
    
    if (history.session_id) {
      // Update existing session
      const { error } = await supabase
        .from("chat_sessions")
        .update({ name: truncatedName })
        .eq("id", history.session_id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update chat name.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Create new session
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          character_id: history.character_id,
          name: truncatedName,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save chat name.",
          variant: "destructive",
        });
        return;
      }

      // Update the history with the new session ID
      setHistories(prev =>
        prev.map(h =>
          h.character_id === history.character_id
            ? { ...h, session_id: data.id, name: truncatedName }
            : h
        )
      );
    }

    setHistories(prev =>
      prev.map(h =>
        h.character_id === history.character_id
          ? { ...h, name: truncatedName }
          : h
      )
    );

    setEditingId(null);
    setEditName("");
    toast({ title: "Saved", description: "Chat name updated." });
  };

  const openDeleteDialog = (characterId: string) => {
    setDeletingId(characterId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!user || !deletingId) return;

    const history = histories.find(h => h.character_id === deletingId);

    // Delete messages
    const { error: msgError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", user.id)
      .eq("character_id", deletingId);

    if (msgError) {
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      return;
    }

    // Delete session if exists
    if (history?.session_id) {
      await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", history.session_id);
    }

    setHistories(prev => prev.filter(h => h.character_id !== deletingId));
    setDeleteDialogOpen(false);
    setDeletingId(null);
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
                const isEditing = editingId === history.character_id;
                const displayName = history.name || character.name;

                return (
                  <motion.div
                    key={history.character_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="glass rounded-xl p-4 flex items-center gap-4 group"
                  >
                    <button
                      onClick={() => !isEditing && navigate(`/chat/${character.id}`)}
                      className="flex items-center gap-4 flex-1 text-left"
                      disabled={isEditing}
                    >
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${character.color} flex items-center justify-center text-xl`}
                      >
                        {character.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8 text-sm"
                              placeholder="Chat name (max 3 words)"
                              maxLength={50}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(history);
                                if (e.key === "Escape") cancelEdit();
                              }}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => saveEdit(history)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={cancelEdit}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <h3 className="font-display font-semibold">{displayName}</h3>
                        )}
                        {!isEditing && (
                          <>
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
                          </>
                        )}
                      </div>
                    </button>
                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => startEdit(history)}
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                          title="Rename chat"
                        >
                          <Pencil className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openDeleteDialog(history.character_id)}
                          className="p-2 rounded-lg hover:bg-destructive/20 text-destructive transition-all"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
