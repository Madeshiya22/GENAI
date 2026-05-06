import { getAIResponse } from "../services/ai.services.js";


export async function handleMessage(req, res) {
    console.log('handleMessage invoked', { path: req.path, body: req.body });
    const { content, chatId } = req.body;

    const effectiveChatId = chatId || `chat_${Date.now()}_${Math.floor(Math.random()*10000)}`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader('x-chat-id', effectiveChatId);
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reply = await getAIResponse({ content });

    res.write(`data: ${reply}\n\n`);

    res.write(`data: [DONE]\n\n`);
    res.end()
}