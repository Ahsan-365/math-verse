import { GoogleGenAI } from '@google/genai';

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

    // Safety check for API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('CRITICAL: GEMINI_API_KEY is not set in Vercel Environment Variables.');
        return res.status(500).json({
            error: 'API Key missing. Please set GEMINI_API_KEY in Vercel project settings.'
        });
    }

    try {
        const { system_instruction, contents, generationConfig } = req.body;

        const genAI = new GoogleGenAI(apiKey);

        // Use the recommended pattern for system instructions in newer SDKs
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: system_instruction?.parts?.[0]?.text || ""
        });

        // Generate content
        const result = await model.generateContent({
            contents: contents,
            generationConfig: generationConfig || { temperature: 0.7, maxOutputTokens: 1024 }
        });

        const response = await result.response;
        const text = response.text();

        // Return structure compatible with ai-chat.js
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
        res.status(500).json({
            error: error.message || 'Error communicating with AI service'
        });
    }
}
