import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useShareChat() {
  const [isSharing, setIsSharing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const shareChat = async (characterId: string, messages: Message[]) => {
    if (!user || messages.length === 0) {
      toast({
        title: "Cannot share",
        description: "You need to have a conversation first.",
        variant: "destructive",
      });
      return null;
    }

    setIsSharing(true);

    try {
      // Create shared chat
      const { data: sharedChat, error: chatError } = await supabase
        .from("shared_chats")
        .insert({
          user_id: user.id,
          character_id: characterId,
          title: messages[0]?.content.substring(0, 50) || "Untitled",
        })
        .select("share_id")
        .single();

      if (chatError || !sharedChat) throw chatError;

      // Get the shared chat id
      const { data: chatData } = await supabase
        .from("shared_chats")
        .select("id")
        .eq("share_id", sharedChat.share_id)
        .single();

      if (!chatData) throw new Error("Failed to get shared chat");

      // Insert all messages
      const messagesToInsert = messages.map((msg) => ({
        shared_chat_id: chatData.id,
        role: msg.role,
        content: msg.content,
      }));

      const { error: messagesError } = await supabase
        .from("shared_messages")
        .insert(messagesToInsert);

      if (messagesError) throw messagesError;

      const shareUrl = `${window.location.origin}/shared/${sharedChat.share_id}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard.",
      });

      return shareUrl;
    } catch (error: any) {
      console.error("Share error:", error);
      toast({
        title: "Failed to share",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSharing(false);
    }
  };

  return { shareChat, isSharing };
}
