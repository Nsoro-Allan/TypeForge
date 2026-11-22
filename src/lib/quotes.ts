import type { Quote, QuoteLength } from "../types";

/** Public-domain / long-proverbial lines, grouped automatically by length. */
export const quotes: Quote[] = [
  { text: "I think, therefore I am.", source: "René Descartes" },
  { text: "The unexamined life is not worth living.", source: "Socrates" },
  { text: "All that glitters is not gold.", source: "William Shakespeare, The Merchant of Venice" },
  { text: "To be, or not to be, that is the question.", source: "William Shakespeare, Hamlet" },
  { text: "There is nothing either good or bad, but thinking makes it so.", source: "William Shakespeare, Hamlet" },
  { text: "The reports of my death are greatly exaggerated.", source: "Mark Twain" },
  { text: "I can resist everything except temptation.", source: "Oscar Wilde, Lady Windermere's Fan" },
  { text: "A journey of a thousand miles begins with a single step.", source: "Lao Tzu" },
  { text: "The quick brown fox jumps over the lazy dog.", source: "Pangram" },
  { text: "Our life is frittered away by detail. Simplify, simplify.", source: "Henry David Thoreau, Walden" },
  { text: "That which does not kill us makes us stronger.", source: "Friedrich Nietzsche" },
  { text: "Trust thyself: every heart vibrates to that iron string.", source: "Ralph Waldo Emerson, Self-Reliance" },
  { text: "All children, except one, grow up.", source: "J. M. Barrie, Peter Pan" },
  { text: "Early to bed and early to rise makes a man healthy, wealthy, and wise.", source: "Benjamin Franklin" },
  { text: "When you have eliminated the impossible, whatever remains, however improbable, must be the truth.", source: "Arthur Conan Doyle, The Sign of the Four" },
  { text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.", source: "Charles Dickens, A Tale of Two Cities" },
  { text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", source: "Jane Austen, Pride and Prejudice" },
  { text: "Curiouser and curiouser! cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English).", source: "Lewis Carroll, Alice's Adventures in Wonderland" },
  { text: "It is a capital mistake to theorize before one has data. Insensibly one begins to twist facts to suit theories, instead of theories to suit facts.", source: "Arthur Conan Doyle, A Scandal in Bohemia" },
  { text: "To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex.", source: "Arthur Conan Doyle, A Scandal in Bohemia" },
  { text: "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.", source: "Abraham Lincoln, Gettysburg Address" },
  { text: "We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.", source: "Declaration of Independence" },
  { text: "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.", source: "Herman Melville, Moby-Dick" },
  { text: "I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.", source: "Henry David Thoreau, Walden" },
  { text: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, and what is the use of a book, thought Alice, without pictures or conversations?", source: "Lewis Carroll, Alice's Adventures in Wonderland" },
  { text: "Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live.", source: "Abraham Lincoln, Gettysburg Address" },
  { text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.", source: "Charles Dickens, A Tale of Two Cities" },
  { text: "We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.", source: "Preamble, U.S. Constitution" },
];

export function quoteLengthOf(q: Quote): QuoteLength {
  const n = q.text.length;
  return n <= 100 ? "short" : n <= 250 ? "medium" : "long";
}

export function pickQuote(length: QuoteLength, avoid?: string): Quote {
  const pool = quotes.filter((q) => quoteLengthOf(q) === length);
  const list = pool.length > 1 ? pool.filter((q) => q.text !== avoid) : pool;
  return list[Math.floor(Math.random() * list.length)] ?? quotes[0];
}
