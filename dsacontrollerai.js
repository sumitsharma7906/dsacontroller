const express = require('express');
const app = express();
// 🌟 Google GenAI Package ko import kiya
const { GoogleGenAI } = require('@google/genai'); 

app.use(express.json());

// 🌟 Yahan apni copy ki hui API Key daal do
const ai = new GoogleGenAI({ apiKey: "AIzaSyCF6p4MHzAt34jrU-8o_qlUbVBohOI1O-s" });

app.get('/', (req, res) => {
    res.send("Welcome to DSA AI Task Tracker!");
});

// 🔥 AI Recommender Route
app.post('/api/recommend-approach', async (req, res) => {
    try {
        const { problemName, topic } = req.body;

        // Gemini AI ke liye ek mast ek dum clear prompt banaya
        const prompt = `You are an expert DSA Coach. The student wants to solve the problem "${problemName}" under the topic "${topic}". 
        Provide a JSON response with exactly three fields:
        1. "suggestedApproach": A brief explanation of the most optimal approach.
        2. "timeComplexity": The worst-case time complexity (e.g., O(N), O(N log N)).
        3. "spaceComplexity": The space complexity.
        Do not include any markdown formatting or backticks, just raw JSON.`;

        // Gemini 2.5 Flash model ko call kiya (Sabse tez aur free model)
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        // AI ke jawaab ko parse kiya
        const aiResponseText = response.text;
        const aiData = JSON.parse(aiResponseText);

        res.json({
            success: true,
            message: "AI Analysis Completed!",
            data: {
                problem: problemName,
                category: topic,
                suggestedApproach: aiData.suggestedApproach,
                timeComplexity: aiData.timeComplexity,
                spaceComplexity: aiData.spaceComplexity
            }
        });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ success: false, message: "AI process me thodi dikkat aayi!" });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`DSA AI Project Server running on port ${PORT}`);
});