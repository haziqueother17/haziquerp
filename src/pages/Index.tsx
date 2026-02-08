import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, MessageCircle, LogOut, History, Users, Image } from "lucide-react";
import { characters } from "@/lib/characters";
import { CharacterCard } from "@/components/CharacterCard";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Index() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/history")}
            className="text-muted-foreground hover:text-foreground"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/groups")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Users className="w-4 h-4 mr-2" />
            Groups
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/gallery")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Image className="w-4 h-4 mr-2" />
            Gallery
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">AI-Powered Roleplay</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                Enter New Worlds
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Immerse yourself in captivating conversations with unique AI characters. 
              From mystical elves to futuristic companions, every story awaits.
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 text-muted-foreground"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Choose a character to begin</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Characters Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {characters.map((character, index) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <CharacterCard
                character={character}
                onClick={() => navigate(`/chat/${character.id}`)}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by AI • Conversations are fictional and for entertainment</p>
        </div>
      </footer>
    </div>
  );
}
