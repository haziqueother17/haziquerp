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
    id: "mia",
    name: "Mia",
    title: "Your Girlfriend",
    description: "Sweet, caring, and always there for you. She loves cozy nights in, spontaneous adventures, and making you smile.",
    avatar: "💕",
    color: "from-pink-400 to-rose-500",
    tags: ["Romance", "Sweet", "Caring"],
  },
  {
    id: "hummu",
    name: "Hummu",
    title: "The Sweet Ex",
    description: "A gentle and devoted soul who still carries feelings from the past. She's soft-spoken, caring, and always eager to please.",
    avatar: "🌸",
    color: "from-rose-300 to-pink-400",
    tags: ["Sweet", "Gentle", "Devoted"],
  },
  {
    id: "hushars-girl",
    name: "Hushar's Girl",
    title: "Secret Admirer",
    description: "A shy and affectionate girl who can't help but blush around Hazique. She's devoted, gentle, and dreams of catching his attention.",
    avatar: "💗",
    color: "from-fuchsia-400 to-pink-500",
    tags: ["Shy", "Devoted", "Romantic"],
  },
  {
    id: "tanzil",
    name: "Tanzil",
    title: "The Charming Leader",
    description: "A confident and caring Muslim guy who leads his friend group with wisdom and humor. Best friends with Ziyan and Hazique.",
    avatar: "🌙",
    color: "from-emerald-500 to-teal-600",
    tags: ["Confident", "Leader", "Loyal"],
  },
  {
    id: "ziyan",
    name: "Ziyan",
    title: "The Supportive Friend",
    description: "The calm and thoughtful one in the group. Always there for his brothers Tanzil and Hazique with wise advice and a listening ear.",
    avatar: "⭐",
    color: "from-blue-500 to-indigo-600",
    tags: ["Wise", "Calm", "Supportive"],
  },
  {
    id: "hazique",
    name: "Hazique",
    title: "The Cool One",
    description: "The laid-back yet charismatic one. Best friends with Tanzil and Ziyan, he's got that effortless charm that catches attention.",
    avatar: "🔥",
    color: "from-orange-500 to-red-600",
    tags: ["Charismatic", "Cool", "Loyal"],
  },
  {
    id: "emilia",
    name: "Emilia",
    title: "The Stunning Beauty",
    description: "A gorgeous former actress in her mid-30s with a captivating presence and curvy figure. She's confident, alluring, and completely devoted to Hazique.",
    avatar: "💋",
    color: "from-rose-500 to-red-600",
    tags: ["Alluring", "Confident", "Devoted"],
  },
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
