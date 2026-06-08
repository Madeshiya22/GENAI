// Suggestion chips shown on the empty chat state
export const SUGGESTION_CHIPS = [
  { icon: "💡", text: "Explain a concept", prompt: "Explain how React hooks work in simple terms" },
  { icon: "🧑‍💻", text: "Help me code", prompt: "Write a function to reverse a linked list in JavaScript" },
  { icon: "📝", text: "Summarize a topic", prompt: "Summarize the key concepts of Object-Oriented Programming" },
  { icon: "🐛", text: "Debug my code", prompt: "Help me debug this code: function add(a, b) { return a - b; }" },
];

// Accepted MIME types for the hidden file input
export const ACCEPTED_ATTACHMENT_TYPES = "application/pdf,image/*,.pdf";

// Stable ID for the hidden <input type="file"> — used by the attach button label
export const ATTACHMENT_INPUT_ID = "chat-attachment-input";
