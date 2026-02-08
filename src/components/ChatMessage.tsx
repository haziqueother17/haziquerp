import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Character } from "@/lib/characters";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  character?: Character;
}

export function ChatMessage({ role, content, character }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
          isUser
            ? "bg-primary text-primary-foreground"
            : character
            ? `bg-gradient-to-br ${character.color}`
            : "bg-secondary"
        }`}
      >
        {isUser ? "👤" : character?.avatar || "🤖"}
      </div>

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "glass rounded-tl-sm"
        }`}
      >
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              em: ({ children }) => (
                <em className="text-muted-foreground italic">{children}</em>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
