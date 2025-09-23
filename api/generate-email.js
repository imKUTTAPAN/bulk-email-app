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
        
        Ensure the output is in JSON format, like this:
        { "subject": "Generated subject line", "message": "Generated email body" }
        `;

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();

        // Parse the JSON string from Gemini's response
        const generatedEmail = JSON.parse(text);

        res.status(200).json(generatedEmail);
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ message: "Failed to generate email content.", error: error.message });
    }
};