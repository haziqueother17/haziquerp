import { motion } from "framer-motion";
import { Character } from "@/lib/characters";

interface CharacterCardProps {
  character: Character;
  onClick: () => void;
}

export function CharacterCard({ character, onClick }: CharacterCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-xl glass shadow-card transition-all duration-300 group-hover:shadow-glow">
        <div className={`absolute inset-0 bg-gradient-to-br ${character.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
        
        <div className="relative p-6">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${character.color} flex items-center justify-center text-3xl shadow-lg`}>
              {character.avatar}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl font-semibold text-foreground">
                {character.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {character.title}
              </p>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {character.description}
          </p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {character.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
          <div className={`h-full bg-gradient-to-r ${character.color}`} />
        </div>
      </div>
    </motion.div>
  );
}
