export async function sendMessage(message) {
    try{
        const response = await fetch("/api/chat/message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }

    const decoded = new TextDecoder();

    for await (const chunk of response.body) {
        const text = decoded.decode(chunk);
        console.log("Received chunk:", text);
    }
}