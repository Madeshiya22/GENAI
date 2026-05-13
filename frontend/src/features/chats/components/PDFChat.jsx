import { useState } from "react";

import { uploadPDF, askPDFQuestion } from "../services/rag.service";

function PDFChat() {
    const [file, setFile] = useState(null);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");

    // UPLOAD PDF
    async function handleUpload() {
        try {
            if (!file) {
                return alert("Please select a PDF");
            }

            setLoading(true);

            const data = await uploadPDF(file);

            setUploadMessage(data.message);

            setLoading(false);
        } catch (error) {
            console.log(error);

            setLoading(false);
        }
    }

    // ASK QUESTION
    async function handleAsk() {
        try {
            if (!question) {
                return alert("Please enter question");
            }

            setLoading(true);

            const data = await askPDFQuestion(question);

            setAnswer(data.answer);

            setLoading(false);
        } catch (error) {
            console.log(error);

            setLoading(false);
        }
    }

    return (
        <div
            style={{
                padding: "20px",
            }}
        >
            <h2>PDF RAG Chat</h2>

            {/* FILE INPUT */}
            <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
            />

            {/* UPLOAD BUTTON */}
            <button onClick={handleUpload}>Upload PDF</button>

            <p>{uploadMessage}</p>

            {/* QUESTION INPUT */}
            <input
                type="text"
                placeholder="Ask question from PDF"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                style={{
                    width: "100%",
                    marginTop: "20px",
                    padding: "10px",
                }}
            />

            {/* ASK BUTTON */}
            <button
                onClick={handleAsk}
                style={{
                    marginTop: "10px",
                }}
            >
                Ask AI
            </button>

            {/* LOADING */}
            {loading && <p>Loading...</p>}

            {/* ANSWER */}
            {answer && (
                <div
                    style={{
                        marginTop: "20px",
                    }}
                >
                    <h3>AI Answer:</h3>

                    <p>{answer}</p>
                </div>
            )}
        </div>
    );
}

export default PDFChat;
