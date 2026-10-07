// 🌟 1. dotenv ko explicit path ke sath load karo taaki panga na ho
// Poore backend code me sabse upar bas yeh do lines jodh do:

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors()); // Yeh saare origins (frontends) ko allow kar dega
const { GoogleGenAI } = require('@google/genai'); 
const fs = require('fs');

app.use(express.json());

// 🔍 Debugging Line: Check karne ke liye ki key sach me load hui ya nahi
console.log("🔑 Checking API Key Load Status:", process.env.GEMINI_API_KEY ? "SUCCESS ✅" : "FAILED ❌");

// 🔒 API Initialize
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const filePath = path.join(__dirname, 'database.json');

// Helper Functions
const readDataFromFile = () => {
    try {
        if (!fs.existsSync(filePath)) return [];
        const fileData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileData);
    } catch (error) {
        return [];
    }
};

const writeDataToFile = (data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {}
};

// Validation Middleware
const validateDSARequest = (req, res, next) => {
    const { problemName, topic } = req.body;
    if (!problemName || !problemName.trim() || !topic || !topic.trim()) {
        return res.status(400).json({
            success: false,
            message: "🚨 Validation Error: 'problemName' aur 'topic' dono likhna zaroori hai bhai!"
        });
    }
    next();
};

// Routes
app.get('/', (req, res) => {
    res.send("Welcome to DSA AI Pro - Secured Tracker Backend!");
});

// POST Route
// 🔥 POST Route (Updated Parsing Logic)
app.post('/api/recommend-approach', validateDSARequest, async (req, res) => {
    try {
        const { problemName, topic } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ success: false, message: "Server me API key load nahi hui hai!" });
        }

        const prompt = `You are an expert DSA Coach. The student wants to solve the problem "${problemName}" under the topic "${topic}". 
        Provide a JSON response with exactly three fields:
        1. "suggestedApproach": A brief explanation of the most optimal approach.
        2. "timeComplexity": The worst-case time complexity.
        3. "spaceComplexity": The space complexity.
        Return ONLY raw JSON. No markdown backticks, no text before or after the JSON structure.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let aiResponseText = response.text.trim();
        
        // 🌟 ULTRA CLEANUP: Agar AI ne galti se ```json ... ``` bhein_ja ho, toh use saaf karo
        if (aiResponseText.includes("```")) {
            aiResponseText = aiResponseText.replace(/```json|```/g, "").trim();
        }

        // Agar response ke shuru ya khatam me koi extra kachra character hai toh extract karo sirf JSON part
        const startJSON = aiResponseText.indexOf('{');
        const endJSON = aiResponseText.lastIndexOf('}');
        if (startJSON !== -1 && endJSON !== -1) {
            aiResponseText = aiResponseText.substring(startJSON, endJSON + 1);
        }

        console.log("Cleaned AI Text for Parsing:", aiResponseText);

        const aiData = JSON.parse(aiResponseText);
        const dsaDatabase = readDataFromFile();

        const newTask = {
            id: dsaDatabase.length + 1,
            problemName,
            topic,
            suggestedApproach: aiData.suggestedApproach,
            timeComplexity: aiData.timeComplexity,
            spaceComplexity: aiData.spaceComplexity,
            savedAt: new Date()
        };

        dsaDatabase.push(newTask);
        writeDataToFile(dsaDatabase);

        res.json({ success: true, message: "AI Analysis Completed & Saved! 💾", currentTask: newTask });

    } catch (error) {
        console.error("🚨 Route error details:", error.message);
        res.status(500).json({ success: false, message: "AI response parse karne me dikkat aayi!" });
    }
});

// GET All
app.get('/api/all-tasks', (req, res) => {
    const dsaDatabase = readDataFromFile();
    res.json({ success: true, totalTasks: dsaDatabase.length, tasks: dsaDatabase });
});

// GET by Topic
app.get('/api/tasks/:topicName', (req, res) => {
    const requestedTopic = req.params.topicName;
    const dsaDatabase = readDataFromFile();
    const filteredTasks = dsaDatabase.filter(task => task.topic.toLowerCase() === requestedTopic.toLowerCase());
    
    if (filteredTasks.length === 0) {
        return res.status(404).json({ success: false, message: "Topic nahi mila!" });
    }
    res.json({ success: true, topic: requestedTopic, totalFound: filteredTasks.length, tasks: filteredTasks });
});

// DELETE Route
app.delete('/api/delete-task/:id', (req, res) => {
    let dsaDatabase = readDataFromFile();
    const taskId = parseInt(req.params.id);
    const taskExists = dsaDatabase.some(task => task.id === taskId);
    
    if (!taskExists) {
        return res.status(404).json({ success: false, message: "Task nahi mila!" });
    }

    dsaDatabase = dsaDatabase.filter(task => task.id !== taskId);
    writeDataToFile(dsaDatabase);
    res.json({ success: true, message: `Task ID ${taskId} successfully delete ho gaya! 🗑️` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 Pro-Level DSA Tracker Server running on port ${PORT}`);
    console.log(`=================================================`);
});