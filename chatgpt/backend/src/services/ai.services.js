import config from '../config/config.js';

const MISTRAL_CHAT_URL = 'https://api.mistral.ai/v1/chat/completions';

function buildFallbackReply(content) {
  const trimmed = String(content ?? '').trim();

  if (!trimmed) {
    return 'Please send a message.';
  }

  return `You said: ${trimmed}`;
}

export async function getAIResponse({ content }) {
  const fallbackReply = buildFallbackReply(content);

  if (!config.MISTRAL_API_KEY) {
    return fallbackReply;
  }

  try {
    const response = await fetch(MISTRAL_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'user',
            content,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return fallbackReply;
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    return typeof reply === 'string' && reply.trim() ? reply : fallbackReply;
  } catch (error) {
    return fallbackReply;
  }
}