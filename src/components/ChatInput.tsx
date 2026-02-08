import { useState, KeyboardEvent, useRef } from "react";
import { Send, Image, Upload, Sparkles, Video, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useVideoGeneration } from "@/hooks/useVideoGeneration";

interface ChatInputProps {
  onSend: (message: string, imageUrl?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageGenPrompt, setImageGenPrompt] = useState("");
  const [videoGenPrompt, setVideoGenPrompt] = useState("");
  const [showImageGen, setShowImageGen] = useState(false);
  const [showVideoGen, setShowVideoGen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useMediaUpload();
  const { generateImage, isGenerating: isGeneratingImage } = useImageGeneration();
  const { generateVideo, isGenerating: isGeneratingVideo } = useVideoGeneration();

  const handleSend = () => {
    if ((input.trim() || attachedImage) && !disabled) {
      onSend(input.trim(), attachedImage || undefined);
      setInput("");
      setAttachedImage(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      // For other files, still upload
    }

    const url = await uploadFile(file);
    if (url) {
      if (file.type.startsWith("image/")) {
        setAttachedImage(url);
      } else {
        // For non-image files, send immediately with a message
        onSend(`[Shared a file: ${file.name}]`, url);
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateImage = async () => {
    if (!imageGenPrompt.trim()) return;
    
    const imageUrl = await generateImage(imageGenPrompt);
    if (imageUrl) {
      setAttachedImage(imageUrl);
      setImageGenPrompt("");
      setShowImageGen(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoGenPrompt.trim()) return;
    
    const videoUrl = await generateVideo(videoGenPrompt);
    if (videoUrl) {
      setAttachedImage(videoUrl);
      setVideoGenPrompt("");
      setShowVideoGen(false);
    }
  };

  const isProcessing = disabled || isUploading || isGeneratingImage || isGeneratingVideo;

  return (
    <div className="space-y-2">
      {/* Attached Image Preview */}
      <AnimatePresence>
        {attachedImage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="relative inline-block"
          >
            <img
              src={attachedImage}
              alt="Attached"
              className="h-20 w-20 object-cover rounded-lg border border-border"
            />
            <button
              onClick={() => setAttachedImage(null)}
              className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-strong rounded-2xl p-2">
        <div className="flex items-end gap-2">
          {/* Media buttons */}
          <div className="flex gap-1">
            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
              title="Upload image or file"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
            </motion.button>

            {/* Image generation */}
            <Popover open={showImageGen} onOpenChange={setShowImageGen}>
              <PopoverTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isProcessing}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
                  title="Generate image"
                >
                  {isGeneratingImage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Image className="w-5 h-5 text-muted-foreground" />
                  )}
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="top" align="start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Generate Image</span>
                  </div>
                  <Input
                    value={imageGenPrompt}
                    onChange={(e) => setImageGenPrompt(e.target.value)}
                    placeholder="Describe the image you want..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleGenerateImage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleGenerateImage}
                    disabled={!imageGenPrompt.trim() || isGeneratingImage}
                    className="w-full"
                    size="sm"
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Video generation */}
            <Popover open={showVideoGen} onOpenChange={setShowVideoGen}>
              <PopoverTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isProcessing}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
                  title="Generate video"
                >
                  {isGeneratingVideo ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Video className="w-5 h-5 text-muted-foreground" />
                  )}
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="top" align="start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Generate Video</span>
                  </div>
                  <Input
                    value={videoGenPrompt}
                    onChange={(e) => setVideoGenPrompt(e.target.value)}
                    placeholder="Describe the animated scene..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleGenerateVideo();
                      }
                    }}
                  />
                  <Button
                    onClick={handleGenerateVideo}
                    disabled={!videoGenPrompt.trim() || isGeneratingVideo}
                    className="w-full"
                    size="sm"
                  >
                    {isGeneratingVideo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Type your message..."}
            disabled={isProcessing}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground px-3 py-2 max-h-32 min-h-[44px]"
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 128) + "px";
            }}
          />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={isProcessing || (!input.trim() && !attachedImage)}
            className="p-3 rounded-xl gradient-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
