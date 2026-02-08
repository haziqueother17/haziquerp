import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Copy, Check } from "lucide-react";
import { characters } from "@/lib/characters";
import { ChatInput } from "@/components/ChatInput";
import { useGroupChat } from "@/hooks/useGroupChat";
import { toast } from "sonner";

export default function GroupChat() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const { 
    messages, 
    participants, 
    isLoading, 
    sendMessage, 
    inviteCode, 
    characterId,
    userId,
  } = useGroupChat(groupId || "");

  const character = characters.find((c) => c.id === characterId) || characters[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!groupId) {
    navigate("/");
    return null;
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
              <h1 className="font-display font-semibold">Group Chat with {character.name}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {participants.length} {participants.length === 1 ? "person" : "people"}
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyInviteLink}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Invite
          </motion.button>
        </div>

        {/* Participants bar */}
        <div className="max-w-4xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto">
          {participants.map((p) => (
            <div
              key={p.user_id}
              className={`px-3 py-1 rounded-full text-xs ${
                p.user_id === userId 
                  ? "bg-primary/20 text-primary" 
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {p.display_name || "User"} {p.user_id === userId && "(you)"}
            </div>
          ))}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div
                className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${character.color} flex items-center justify-center text-4xl mb-6 animate-float`}
              >
                {character.avatar}
              </div>
              <h2 className="font-display text-2xl font-semibold mb-2">
                Group Chat with {character.name}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                Invite friends to chat together! Share the invite link.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyInviteLink}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
              >
                <Copy className="w-4 h-4" />
                Copy Invite Link
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex gap-3 ${
                      message.role === "user" && message.sender_id === userId
                        ? "justify-end"
                        : ""
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${character.color} flex items-center justify-center text-lg shrink-0`}
                      >
                        {character.avatar}
                      </div>
                    )}

                    {message.role === "user" && message.sender_id !== userId && (
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg shrink-0">
                        {message.sender_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] ${
                        message.role === "user" && message.sender_id === userId
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                          : message.role === "user"
                          ? "bg-secondary rounded-2xl rounded-tl-sm"
                          : "glass rounded-2xl rounded-tl-sm"
                      } px-4 py-3`}
                    >
                      {message.role === "user" && message.sender_id !== userId && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {message.sender_name}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${character.color} flex items-center justify-center text-lg`}
                  >
                    {character.avatar}
                  </div>
                  <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSend={sendMessage}
            disabled={isLoading}
            placeholder={`Message the group...`}
          />
        </div>
      </footer>
    </div>
  );
}
