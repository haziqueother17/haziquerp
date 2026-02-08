import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Clock, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { characters } from "@/lib/characters";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface GroupInfo {
  id: string;
  name: string | null;
  character_id: string;
  created_at: string;
  participant_count: number;
  last_message?: string;
  last_message_time?: string;
}

export default function MyGroups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadGroups = async () => {
      // Get all groups the user is part of
      const { data: participations, error: partError } = await supabase
        .from("group_participants")
        .select("group_chat_id")
        .eq("user_id", user.id);

      if (partError || !participations) {
        console.error("Error loading participations:", partError);
        setLoading(false);
        return;
      }

      const groupIds = participations.map((p) => p.group_chat_id);
      
      if (groupIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get group details
      const { data: groupData, error: groupError } = await supabase
        .from("group_chats")
        .select("id, name, character_id, created_at")
        .in("id", groupIds);

      if (groupError || !groupData) {
        console.error("Error loading groups:", groupError);
        setLoading(false);
        return;
      }

      // Get participant counts and last messages for each group
      const groupsWithInfo: GroupInfo[] = await Promise.all(
        groupData.map(async (group) => {
          // Get participant count
          const { count } = await supabase
            .from("group_participants")
            .select("*", { count: "exact", head: true })
            .eq("group_chat_id", group.id);

          // Get last message
          const { data: lastMsg } = await supabase
            .from("group_messages")
            .select("content, created_at")
            .eq("group_chat_id", group.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            id: group.id,
            name: group.name,
            character_id: group.character_id,
            created_at: group.created_at,
            participant_count: count || 1,
            last_message: lastMsg?.content,
            last_message_time: lastMsg?.created_at,
          };
        })
      );

      // Sort by last activity
      groupsWithInfo.sort((a, b) => {
        const timeA = a.last_message_time || a.created_at;
        const timeB = b.last_message_time || b.created_at;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });

      setGroups(groupsWithInfo);
      setLoading(false);
    };

    loadGroups();
  }, [user]);

  const getCharacter = (id: string) => characters.find((c) => c.id === id);

  const truncateName = (name: string | null, characterName: string) => {
    if (!name) return `Chat with ${characterName}`;
    const words = name.trim().split(/\s+/).slice(0, 3);
    return words.join(" ");
  };

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
          <h1 className="font-display text-xl font-semibold">My Groups</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-display text-xl font-semibold mb-2">No group chats yet</h2>
            <p className="text-muted-foreground mb-6">
              Start a group chat from any character's chat page to invite friends!
            </p>
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
              {groups.map((group) => {
                const character = getCharacter(group.character_id);
                if (!character) return null;

                return (
                  <motion.button
                    key={group.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    onClick={() => navigate(`/group/${group.id}`)}
                    className="w-full glass rounded-xl p-4 flex items-center gap-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${character.color} flex items-center justify-center text-xl relative`}
                    >
                      {character.avatar}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Users className="w-3 h-3 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold truncate">
                        {truncateName(group.name, character.name)}
                      </h3>
                      {group.last_message && (
                        <p className="text-sm text-muted-foreground truncate">
                          {group.last_message}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {group.participant_count} {group.participant_count === 1 ? "person" : "people"}
                        </span>
                        {group.last_message_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(group.last_message_time), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}