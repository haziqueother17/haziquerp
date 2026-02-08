import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  id?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roleplay-chat`;

export function useRoleplayChat(characterId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Load existing messages and get user
  useEffect(() => {
    const loadMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      
      if (!user) return;

      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content")
        .eq("user_id", user.id)
        .eq("character_id", characterId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data.map(m => ({ 
          id: m.id,
          role: m.role as "user" | "assistant", 
          content: m.content 
        })));
      }
    };

    loadMessages();
  }, [characterId]);

  const saveMessage = useCallback(async (role: string, content: string): Promise<string | null> => {
    if (!userId) return null;
    const { data } = await supabase.from("chat_messages").insert({
      user_id: userId,
      character_id: characterId,
      role,
      content,
    }).select("id").single();
    return data?.id || null;
  }, [userId, characterId]);

  const regenerateFromIndex = useCallback(async (messageIndex: number, updatedMessages: Message[]) => {
    setIsLoading(true);
    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const newMessages = [...prev];
        // Check if there's already an assistant response after the edited message
        if (newMessages.length > messageIndex + 1 && newMessages[messageIndex + 1]?.role === "assistant") {
          newMessages[messageIndex + 1] = { ...newMessages[messageIndex + 1], content: assistantContent };
        } else {
          // Add new assistant message
          newMessages.splice(messageIndex + 1, 0, { role: "assistant", content: assistantContent });
        }
        return newMessages;
      });
    };

    try {
      // Only send messages up to and including the edited message
      const apiMessages = updatedMessages.slice(0, messageIndex + 1).map(msg => {
        if (msg.imageUrl) {
          return {
            role: msg.role,
            content: msg.content || "What do you think of this?",
            imageUrl: msg.imageUrl
          };
        }
        return { role: msg.role, content: msg.content };
      });

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          characterId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment.");
        } else if (response.status === 402) {
          toast.error("Usage limit reached.");
        } else {
          toast.error(errorData.error || "Failed to get response");
        }
        setIsLoading(false);
        return;
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Save new assistant response
      if (assistantContent) {
        await saveMessage("assistant", assistantContent);
      }
    } catch (error) {
      console.error("Regenerate error:", error);
      toast.error("Failed to regenerate response.");
    } finally {
      setIsLoading(false);
    }
  }, [characterId, saveMessage]);

  const editMessage = useCallback(async (messageIndex: number, newContent: string) => {
    const messageToEdit = messages[messageIndex];
    if (!messageToEdit || messageToEdit.role !== "user") return;

    // Delete all messages from edited message onwards in DB
    if (userId) {
      const { data: allMessages } = await supabase
        .from("chat_messages")
        .select("id, created_at")
        .eq("user_id", userId)
        .eq("character_id", characterId)
        .order("created_at", { ascending: true });

      if (allMessages && allMessages.length > messageIndex) {
        const idsToDelete = allMessages.slice(messageIndex).map(m => m.id);
        await supabase.from("chat_messages").delete().in("id", idsToDelete);
      }
    }

    // Update local state - remove all messages from edited index onwards
    const updatedMessages = messages.slice(0, messageIndex);
    const editedMessage: Message = { ...messageToEdit, content: newContent };
    updatedMessages.push(editedMessage);
    setMessages(updatedMessages);

    // Save edited message
    await saveMessage("user", newContent);

    // Regenerate AI response
    await regenerateFromIndex(messageIndex, updatedMessages);
  }, [messages, userId, characterId, saveMessage, regenerateFromIndex]);

  const sendMessage = useCallback(async (content: string, imageUrl?: string) => {
    const userMessage: Message = { role: "user", content, imageUrl };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message immediately (include image reference in content if present)
    const savedContent = imageUrl 
      ? `${content}\n[Image: ${imageUrl}]`
      : content;
    const messageId = await saveMessage("user", savedContent);
    if (messageId) {
      setMessages((prev) => 
        prev.map((m, i) => i === prev.length - 1 ? { ...m, id: messageId } : m)
      );
    }

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      // Prepare messages for API - include image if present
      const apiMessages = [...messages, userMessage].map(msg => {
        if (msg.imageUrl) {
          return {
            role: msg.role,
            content: msg.content || "What do you think of this?",
            imageUrl: msg.imageUrl
          };
        }
        return { role: msg.role, content: msg.content };
      });

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          characterId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment.");
        } else if (response.status === 402) {
          toast.error("Usage limit reached. Please check your account.");
        } else {
          toast.error(errorData.error || "Failed to get response");
        }
        setIsLoading(false);
        return;
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Save assistant response after streaming completes
      if (assistantContent) {
        await saveMessage("assistant", assistantContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [messages, characterId, saveMessage]);

  const clearMessages = useCallback(async () => {
    if (userId) {
      await supabase
        .from("chat_messages")
        .delete()
        .eq("user_id", userId)
        .eq("character_id", characterId);
    }
    setMessages([]);
  }, [userId, characterId]);

  return { messages, isLoading, sendMessage, clearMessages, editMessage };
}
