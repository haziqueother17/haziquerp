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
    id: "assistant",
    name: "AI Assistant",
    title: "Smart Helper",
    description: "A helpful and intelligent AI assistant ready to answer questions, help with tasks, and have meaningful conversations.",
    avatar: "🤖",
    color: "from-cyan-500 to-blue-600",
    tags: ["Helpful", "Smart", "Versatile"],
  },
];
