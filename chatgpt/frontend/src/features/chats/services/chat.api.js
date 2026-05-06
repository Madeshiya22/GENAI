const CHAT_API_URL = '/api/chat'

async function readStream(response, { onContent, onChat, onComplete } = {}) {
  if (!response.ok) {
    throw new Error(`Chat request failed with status ${response.status}`)
  }

  const effectiveChatId = response.headers.get('x-chat-id') || null

  if (typeof onChat === 'function') {
    onChat({ chatId: effectiveChatId })
  }

  if (!response.body) {
    throw new Error('Chat response body is empty')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })

    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const event of events) {
      const dataLine = event
        .split('\n')
        .find((line) => line.startsWith('data:'))

      if (!dataLine) {
        continue
      }

      const chunk = dataLine.replace(/^data:\s?/, '')

      if (chunk === '[DONE]') {
        if (typeof onComplete === 'function') {
          onComplete(fullContent)
        }

        return fullContent
      }

      fullContent += chunk

      if (typeof onContent === 'function') {
        onContent(chunk, fullContent)
      }
    }
  }

  if (buffer.trim()) {
    const dataLine = buffer
      .split('\n')
      .find((line) => line.startsWith('data:'))

    if (dataLine) {
      const chunk = dataLine.replace(/^data:\s?/, '')

      if (chunk !== '[DONE]') {
        fullContent += chunk

        if (typeof onContent === 'function') {
          onContent(chunk, fullContent)
        }
      }
    }
  }

  if (typeof onComplete === 'function') {
    onComplete(fullContent)
  }

  return fullContent
}

export async function getAiResponse({ message, chatId, onContent, onChat, onComplete }) {
  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      content: message,
      chatId,
    }),
  })

  return readStream(response, {
    onContent,
    onChat,
    onComplete,
  })
}