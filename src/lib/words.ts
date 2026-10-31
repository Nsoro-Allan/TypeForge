export const commonWords = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "is", "are", "was", "were", "been", "being", "has", "had", "does", "did",
  "having", "may", "might", "must", "shall", "should", "can", "could", "will", "would",
  "through", "still", "before", "here", "those", "both", "few", "own", "same", "another",
  "while", "last", "might", "great", "where", "much", "every", "left", "against", "during",
  "never", "become", "between", "high", "really", "something", "most", "under", "place", "think",
  "house", "world", "school", "important", "until", "family", "hand", "part", "number", "again",
  "always", "night", "live", "point", "often", "home", "long", "small", "found", "around",
  "however", "keep", "eye", "show", "large", "together", "ask", "start", "city", "leave",
  "put", "help", "next", "far", "turn", "real", "group", "begin", "seem", "country",
  "problem", "every", "start", "hand", "move", "why", "turn", "play", "run", "move",
  "live", "believe", "hold", "bring", "happen", "write", "provide", "sit", "stand", "lose",
  "pay", "meet", "include", "continue", "set", "learn", "change", "lead", "understand", "watch",
  "follow", "stop", "create", "speak", "read", "allow", "add", "spend", "grow", "open",
  "walk", "win", "offer", "remember", "love", "consider", "appear", "buy", "wait", "serve",
  "die", "send", "expect", "build", "stay", "fall", "cut", "reach", "kill", "remain",
  "suggest", "raise", "pass", "sell", "require", "report", "decide", "pull", "return", "explain",
  "hope", "develop", "carry", "break", "receive", "agree", "support", "hit", "produce", "eat",
  "cover", "catch", "draw", "choose", "cause", "fight", "drink", "own", "serve", "end",
  "force", "accept", "finish", "drive", "sun", "light", "air", "water", "earth", "fire",
  "power", "money", "story", "idea", "body", "friend", "right", "left", "side", "kind",
  "fact", "month", "today", "moment", "hour", "minute", "second", "system", "order", "power",
  "ability", "nature", "person", "result", "area", "money", "story", "level", "child", "father",
  "mother", "brother", "sister", "friend", "teacher", "student", "doctor", "worker", "leader", "player",
  "music", "book", "game", "food", "car", "door", "window", "table", "chair", "phone",
  "computer", "internet", "program", "code", "design", "color", "sound", "image", "video", "text",
  "fast", "slow", "hard", "easy", "strong", "weak", "happy", "sad", "angry", "quiet",
  "loud", "bright", "dark", "hot", "cold", "full", "empty", "early", "late", "young",
  "old", "true", "false", "possible", "sure", "clear", "simple", "complex", "free", "open",
  "close", "start", "finish", "begin", "end", "yes", "no", "maybe", "always", "never"
];

export function generateWords(count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * commonWords.length);
    result.push(commonWords[index]);
  }
  return result;
}