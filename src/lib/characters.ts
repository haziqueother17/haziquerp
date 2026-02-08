export interface Character {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar: string;
  color: string;
  tags: string[];
}

export const characters: Character[] = [
  {
    id: "luna",
    name: "Luna",
    title: "Elven Sorceress",
    description: "An ancient elven mage with millennia of wisdom. She speaks in riddles and wields power beyond mortal comprehension.",
    avatar: "🧝‍♀️",
    color: "from-violet-500 to-purple-600",
    tags: ["Fantasy", "Magic", "Wise"],
  },
  {
    id: "kai",
    name: "Kai",
    title: "Charming Rogue",
    description: "A notorious thief with a heart of gold. Quick wit, quicker hands, and a smile that could steal more than just treasure.",
    avatar: "🗡️",
    color: "from-amber-500 to-orange-600",
    tags: ["Adventure", "Romance", "Humor"],
  },
  {
    id: "nova",
    name: "Nova",
    title: "AI Companion",
    description: "An artificial consciousness exploring the boundaries of emotion. Logical yet curious, Nova seeks to understand humanity.",
    avatar: "🤖",
    color: "from-cyan-400 to-blue-600",
    tags: ["Sci-Fi", "Philosophy", "Future"],
  },
  {
    id: "drake",
    name: "Drake",
    title: "Vampire Lord",
    description: "Centuries of existence have brought both power and sorrow. Behind the darkness lies a soul seeking redemption.",
    avatar: "🧛",
    color: "from-red-500 to-rose-800",
    tags: ["Dark", "Romance", "Mystery"],
  },
];
