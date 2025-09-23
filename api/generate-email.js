const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as a Vercel environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required.' });
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const finalPrompt = `
        You are an AI assistant specialized in writing email copy.
        Based on the following request, generate a subject line and email body.
        The request is for: "${prompt}"
        
        Ensure the output is a single JSON object with two fields: "subject" and "message". Do not include any other text or characters in the response, especially not markdown like backticks.
        `;

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();

        // This is the new, more resilient JSON parsing logic.
        let generatedEmail;
        try {
            // Trim whitespace and remove markdown backticks if present.
            // This is the key fix!
            const cleanedText = text.trim().replace(/^`+|`+$/g, '');
            generatedEmail = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("JSON Parsing Error:", parseError);
            return res.status(500).json({ 
                message: "Failed to parse AI-generated content. Please try again.",
                errorDetails: parseError.message
            });
        }
        
        res.status(200).json(generatedEmail);

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ message: "Failed to generate email content.", error: error.message });
    }
};