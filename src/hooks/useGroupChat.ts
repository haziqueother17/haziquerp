import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sender_id: string | null;
  sender_name: string | null;
  created_at: string;
}

interface Participant {
  user_id: string;
  display_name: string | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roleplay-chat`;

export function useGroupChat(groupId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cooldownUntilRef = useRef<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [characterId, setCharacterId] = useState<string>("luna");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [groupName, setGroupName] = useState<string | null>(null);

  // Load group info, messages, and set up realtime
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      // Get user's display name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      
      setUserName(profile?.display_name || user.email?.split("@")[0] || "User");

      // Get group info
      const { data: group } = await supabase
        .from("group_chats")
        .select("character_id, invite_code, name")
        .eq("id", groupId)
        .single();

      if (group) {
        setCharacterId(group.character_id);
        setInviteCode(group.invite_code);
        setGroupName(group.name);
      }

      // Load existing messages
      const { data: msgs } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_chat_id", groupId)
        .order("created_at", { ascending: true });

      if (msgs) {
        setMessages(msgs.map(m => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          sender_id: m.sender_id,
          sender_name: m.sender_name,
          created_at: m.created_at,
        })));
      }

      // Load participants
      const { data: parts } = await supabase
        .from("group_participants")
        .select("user_id, display_name")
        .eq("group_chat_id", groupId);

      if (parts) {
        setParticipants(parts);
      }
    };

    init();

    // Set up realtime subscription
    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_chat_id=eq.${groupId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, {
              id: newMsg.id,
              role: newMsg.role as "user" | "assistant",
              content: newMsg.content,
              sender_id: newMsg.sender_id,
              sender_name: newMsg.sender_name,
              created_at: newMsg.created_at,
            }];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_participants",
          filter: `group_chat_id=eq.${groupId}`,
        },
        (payload) => {
          const newPart = payload.new as any;
          setParticipants((prev) => {
            if (prev.some(p => p.user_id === newPart.user_id)) return prev;
            return [...prev, { user_id: newPart.user_id, display_name: newPart.display_name }];
          });
          toast.success(`${newPart.display_name || "Someone"} joined the chat!`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!userId) return;

    const remainingMs = cooldownUntilRef.current - Date.now();
    if (remainingMs > 0) {
      toast.error(`Please wait ${Math.ceil(remainingMs / 1000)}s and try again.`);
      return;
    }
    if (isLoading) return;

    setIsLoading(true);

    // Insert user message (realtime will update UI)
    const { error: insertError } = await supabase.from("group_messages").insert({
      group_chat_id: groupId,
      sender_id: userId,
      sender_name: userName,
      role: "user",
      content,
    });

    if (insertError) {
      toast.error("Failed to send message");
      setIsLoading(false);
      return;
    }

    // Get AI response
    try {
      const allMessages = [...messages, { role: "user" as const, content, sender_name: userName }];
      const formattedMessages = allMessages.map(m => ({
        role: m.role,
        content: m.role === "user" && "sender_name" in m && m.sender_name 
          ? `[${m.sender_name}]: ${m.content}`
          : m.content,
      }));

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: formattedMessages,
          characterId,
        }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({} as any));

        if (response.status === 429) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const retryAfterSeconds =
            Number(retryAfterHeader) ||
            (typeof (errorData as any).retryAfterSeconds === "number"
              ? (errorData as any).retryAfterSeconds
              : Number((errorData as any).retryAfterSeconds));

          if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
            cooldownUntilRef.current = Date.now() + Math.ceil(retryAfterSeconds) * 1000;
            toast.error(`Rate limited. Try again in ${Math.ceil(retryAfterSeconds)}s.`);
          } else {
            cooldownUntilRef.current = Date.now() + 5000;
            toast.error((errorData as any).error || "Rate limited. Please wait a moment.");
          }
        } else {
          toast.error((errorData as any).error || "Failed to get response");
        }

        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

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
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) assistantContent += chunk;
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Save assistant response
      if (assistantContent) {
        await supabase.from("group_messages").insert({
          group_chat_id: groupId,
          sender_id: null,
          sender_name: null,
          role: "assistant",
          content: assistantContent,
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response");
    } finally {
      setIsLoading(false);
    }
  }, [messages, characterId, groupId, userId, userName, isLoading]);

  return { 
    messages, 
    participants, 
    isLoading, 
    sendMessage, 
    inviteCode, 
    characterId,
    userId,
    groupName,
    setGroupName,
  };
}

export async function renameGroupChat(groupId: string, newName: string): Promise<boolean> {
  const { error } = await supabase
    .from("group_chats")
    .update({ name: newName })
    .eq("id", groupId);

  if (error) {
    toast.error("Failed to rename chat");
    return false;
  }

  toast.success("Chat renamed!");
  return true;
}

export async function createGroupChat(characterId: string, name?: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast.error("Please sign in to create a group chat");
    return null;
  }

  // Get display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .single();

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";

  // Create group
  const { data: group, error } = await supabase
    .from("group_chats")
    .insert({
      character_id: characterId,
      name: name || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !group) {
    toast.error("Failed to create group chat");
    return null;
  }

  // Add creator as participant
  await supabase.from("group_participants").insert({
    group_chat_id: group.id,
    user_id: user.id,
    display_name: displayName,
  });

  return group.id;
}

export async function joinGroupByCode(inviteCode: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast.error("Please sign in to join");
    return null;
  }

  // Find group by invite code
  const { data: group } = await supabase
    .from("group_chats")
    .select("id")
    .eq("invite_code", inviteCode)
    .single();

  if (!group) {
    toast.error("Invalid invite code");
    return null;
  }

  // Check if already a participant
  const { data: existing } = await supabase
    .from("group_participants")
    .select("id")
    .eq("group_chat_id", group.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return group.id; // Already joined
  }

  // Get display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .single();

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";

  // Join group
  const { error } = await supabase.from("group_participants").insert({
    group_chat_id: group.id,
    user_id: user.id,
    display_name: displayName,
  });

  if (error) {
    toast.error("Failed to join group");
    return null;
  }

  toast.success("Joined the group!");
  return group.id;
}
