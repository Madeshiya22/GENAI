import {getStream} from "../services/ai.service.js";

export async function handleChat(req, res) {
     const message = req.body.message;

       const messages = [
   {
      role: "user",
      content: message
   }
];

        
        const Stream = await getStream(messages)
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        for await (const chunk of Stream) {
            
            const aiChunk = chunk.choices[0]?.delta?.content || "";
            console.log(aiChunk)
            
            res.write(`data:${JSON.stringify({ chunk: aiChunk })}\n\n`);
        }
        res.end();
    }

