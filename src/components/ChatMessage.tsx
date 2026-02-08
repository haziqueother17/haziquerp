import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Pencil, Check, X } from "lucide-react";
import { Character } from "@/lib/characters";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  character?: Character;
  imageUrl?: string;
  messageIndex?: number;
  onEdit?: (index: number, newContent: string) => void;
  isLoading?: boolean;
}

export function ChatMessage({ 
  role, 
  content, 
  character, 
  imageUrl, 
  messageIndex,
  onEdit,
  isLoading 
}: ChatMessageProps) {
  const isUser = role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSaveEdit = () => {
    if (editedContent.trim() && onEdit && messageIndex !== undefined) {
      onEdit(messageIndex, editedContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} group`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg overflow-hidden ${
          isUser
            ? "bg-primary text-primary-foreground"
            : character
            ? `bg-gradient-to-br ${character.color}`
            : "bg-secondary"
        }`}
      >
        {isUser ? (
          "👤"
        ) : character?.avatar ? (
          <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
        ) : (
          character?.emoji || "🤖"
        )}
      </div>

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "glass rounded-tl-sm"
        }`}
      >
        {/* Image attachment */}
        {imageUrl && (
          <div className="mb-2">
            <img
              src={imageUrl}
              alt="Shared content"
              className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(imageUrl, "_blank")}
            />
          </div>
        )}
        
        {/* Text content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[60px] p-2 rounded-lg bg-background text-foreground border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelEdit}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSaveEdit}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {content && (
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
            )}
          </>
        )}
      </div>

      {/* Edit button for user messages */}
      {isUser && !isEditing && onEdit && !isLoading && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsEditing(true)}
          className="self-center p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
          title="Edit message"
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </motion.button>
      )}
    </motion.div>
  );
}
