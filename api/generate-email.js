const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key from Vercel environment variables
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
        
        // Use a model that supports JSON mode and configure it
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", // Using a newer model is recommended
            generationConfig: {
                responseMimeType: "application/json", // This enables JSON Mode
            },
        });

        // The prompt can now be simpler, as we don't need to instruct it about JSON format.
        const finalPrompt = `
        You are an AI assistant specialized in writing email copy.
        Based on the following request, generate a JSON object with a "subject" and a "message" field.
        Request: "${prompt}"
        `;

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();

        // With JSON mode, the output is guaranteed to be a parsable JSON string.
        const generatedEmail = JSON.parse(text);
        
        res.status(200).json(generatedEmail);

    } catch (error) {
        // Log the full error to Vercel logs for better debugging
        console.error("Error generating email content:", JSON.stringify(error, null, 2));

        res.status(500).json({ 
            message: "Failed to generate email content.", 
            // It's good practice not to expose detailed error messages to the client.
            // error: error.message 
        });
    }
};