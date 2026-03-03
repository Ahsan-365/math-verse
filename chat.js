import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export default async function handler(req, res) {
    // Handle CORS and preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { system_instruction, contents, generationConfig } = req.body;

        // We use the advanced chat interface to support system instructions and history
        const result = await model.generateContent({
            systemInstruction: system_instruction,
            contents: contents,
            generationConfig: generationConfig
        });

        const response = await result.response;
        const text = response.text();

        // We return a structure that matches what ai-chat.js expects
        // Or we can return the raw 'data' if we wanted to be a perfect proxy.
        // To minimize frontend changes, we'll return a structure compatible with the frontend's data.candidates[0] check
        res.status(200).json({
            candidates: [
                {
                    content: {
                        parts: [{ text }]
                    }
                }
            ]
        });
    } catch (error) {
        console.error('Gemini Proxy Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
