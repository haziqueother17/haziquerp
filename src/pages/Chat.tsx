import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, RotateCcw } from "lucide-react";
import { characters } from "@/lib/characters";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { useRoleplayChat } from "@/hooks/useRoleplayChat";

export default function Chat() {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const character = characters.find((c) => c.id === characterId);
  const { messages, isLoading, sendMessage, clearMessages } = useRoleplayChat(
    characterId || "luna"
  );

  useEffect(() => {
    if (!character) {
      navigate("/");
    }
  }, [character, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!character) return null;

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
              <p className="text-xs text-muted-foreground">{character.title}</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearMessages}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            title="Start new conversation"
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>
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
                Chat with {character.name}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {character.description}
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                <span>Start your adventure...</span>
              </div>
            </motion.div>
          ) : (
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

              {isLoading && messages[messages.length - 1]?.role === "user" && (
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
            placeholder={`Message ${character.name}...`}
          />
        </div>
      </footer>
    </div>
  );
}
