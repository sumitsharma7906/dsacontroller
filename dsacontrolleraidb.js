const express = require('express');
const app = express();
const { GoogleGenAI } = require('@google/genai'); 
// 🌟 1. Mongoose ko import kiya
const mongoose = require('mongoose'); 

app.use(express.json());

const ai = new GoogleGenAI({ apiKey: "AIzaSyCF6p4MHzAt34jrU-8o_qlUbVBohOI1O-s" });

// 🌟 2. Cloud Database se Connect kiya
// (Yahan apna copied URL daalna aur <password> ko apne asli password se badal dena)
const dbURI = "mongodb+srv://sumit7900553038:<db_password>@cluster0.zibg5fv.mongodb.net/?appName=Cluster0";

mongoose.connect(dbURI)
    .then(() => console.log("MongoDB Cloud Database se connect ho gaya! 🎉"))
    .catch((err) => console.log("DB Connection Error:", err));


// 🌟 3. Schema & Model Banao (Dabbe ka Structure)
// Yeh batata hai ki database me data kis format me save hoga
const TaskSchema = new mongoose.Schema({
    problemName: String,
    topic: String,
    suggestedApproach: String,
    timeComplexity: String,
    spaceComplexity: String,
    createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', TaskSchema);


app.get('/', (req, res) => {
    res.send("Welcome to DSA AI + DB Task Tracker!");
});

// 🔥 Dynamic AI + Database Route
app.post('/api/recommend-approach', async (req, res) => {
    try {
        const { problemName, topic } = req.body;

        const prompt = `You are an expert DSA Coach. The student wants to solve the problem "${problemName}" under the topic "${topic}". 
        Provide a JSON response with exactly three fields:
        1. "suggestedApproach": A brief explanation of the most optimal approach.
        2. "timeComplexity": The worst-case time complexity.
        3. "spaceComplexity": The space complexity.
        Do not include any markdown formatting or backticks, just raw JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const aiResponseText = response.text;
        const aiData = JSON.parse(aiResponseText);

        // 🌟 4. DATA SAVING MAGIC: Gemini ke response ko Database me save kar rahe hain
        const newTask = new Task({
            problemName: problemName,
            topic: topic,
            suggestedApproach: aiData.suggestedApproach,
            timeComplexity: aiData.timeComplexity,
            spaceComplexity: aiData.spaceComplexity
        });

        await newTask.save(); // Yeh line data ko hamesha ke liye cloud par bhej degi!

        res.json({
            success: true,
            message: "AI Analysis Completed & Saved to Database! 💾",
            data: newTask
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "Kuch gadbad hui!" });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`DSA AI + DB Project Server running on port ${PORT}`);
});