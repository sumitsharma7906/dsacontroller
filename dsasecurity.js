const express = require('express');
const app = express();
const { GoogleGenAI } = require('@google/genai'); 
const fs = require('fs');
const path = require('path');

app.use(express.json());

// 🌟 Yahan apni copy ki hui API Key daal do
const ai = new GoogleGenAI({ apiKey: "AIzaSyCF6p4MHzAt34jrU-8o_qlUbVBohOI1O-s" });

app.get('/', (req, res) => {
    res.send("Welcome to DSA AI Task Tracker!");

// 📄 Hamari local physical file ka path (database.json)
const filePath = path.join(__dirname, 'database1.json');

// ==========================================
// 🛠️ HELPER FUNCTIONS (File Read/Write Logic)
// ==========================================

// 1. File se saara data read karne ke liye function
const readDataFromFile = () => {
    try {
        if (!fs.existsSync(filePath)) {
            // Agar file pehle se bani hi nahi hai, toh khali array bhein_j do
            return [];
        }
        const fileData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileData);
    } catch (error) {
        console.error("🚨 File read karne me error:", error);
        return [];
    }
};

// 2. File me naya data write (save) karne ke liye function
const writeDataToFile = (data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error("🚨 File save karne me error:", error);
    }
};

// ==========================================
// 🛡️ MIDDLEWARE (Security Guard for Validation)
// ==========================================
const validateDSARequest = (req, res, next) => {
    const { problemName, topic } = req.body;

    // Check karo kya dono fields bhein_ji gayi hain aur unme khali spaces toh nahi hain
    if (!problemName || !problemName.trim() || !topic || !topic.trim()) {
        return res.status(400).json({
            success: false,
            message: "🚨 Validation Error: 'problemName' aur 'topic' dono likhna zaroori hai bhai!"
        });
    }

    // Agar data ek dum sahi hai, toh agle step (route) par bhein_j do
    next();
};

// ==========================================
// 🌐 EXPRESS ROUTES (API Endpoints)
// ==========================================

// Base Route
app.get('/', (req, res) => {
    res.send("Welcome to DSA AI Pro File-Based Tracker Backend!");
});

// 🔥 1. POST: AI Analysis & Permanent Save (Guard Attached)
app.post('/api/recommend-approach', validateDSARequest, async (req, res) => {
    try {
        const { problemName, topic } = req.body;

        const prompt = `You are an expert DSA Coach. The student wants to solve the problem "${problemName}" under the topic "${topic}". 
        Provide a JSON response with exactly three fields:
        1. "suggestedApproach": A brief explanation of the most optimal approach.
        2. "timeComplexity": The worst-case time complexity.
        3. "spaceComplexity": The space complexity.
        Do not include any markdown formatting, backticks, or the word JSON. Just give raw text string that can be parsed directly.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let aiResponseText = response.text.trim();
        
        // Clean up code block ticks if AI accidentally sends them
        if (aiResponseText.startsWith("```")) {
            aiResponseText = aiResponseText.replace(/```json|```/g, "").trim();
        }

        const aiData = JSON.parse(aiResponseText);

        // File se purani history lekar aao
        const dsaDatabase = readDataFromFile();

        // Naya task object banaya
        const newTask = {
            id: dsaDatabase.length + 1,
            problemName: problemName,
            topic: topic,
            suggestedApproach: aiData.suggestedApproach,
            timeComplexity: aiData.timeComplexity,
            spaceComplexity: aiData.spaceComplexity,
            savedAt: new Date()
        };

        // Database array me push kiya aur file update kar di
        dsaDatabase.push(newTask);
        writeDataToFile(dsaDatabase);

        res.json({
            success: true,
            message: "AI Analysis Completed & Saved Permanently! 💾📄",
            currentTask: newTask
        });

    } catch (error) {
        console.error("🚨 Route error:", error);
        res.status(500).json({ success: false, message: "AI processing ya parsing me dikkat aayi!" });
    }
});

// 🔥 2. GET: Read All History from File
app.get('/api/all-tasks', (req, res) => {
    const dsaDatabase = readDataFromFile();
    res.json({
        success: true,
        totalTasks: dsaDatabase.length,
        tasks: dsaDatabase
    });
});

// 🔥 3. GET: Topic ke basis par filtering
app.get('/api/tasks/:topicName', (req, res) => {
    try {
        const requestedTopic = req.params.topicName;
        const dsaDatabase = readDataFromFile();

        // Topic matching case-insensitive check ke sath
        const filteredTasks = dsaDatabase.filter(
            task => task.topic.toLowerCase() === requestedTopic.toLowerCase()
        );

        if (filteredTasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Bhai, '${requestedTopic}' topic ka koi task abhi tak save nahi hua hai! 🔍`
            });
        }

        res.json({
            success: true,
            topic: requestedTopic,
            totalFound: filteredTasks.length,
            tasks: filteredTasks
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Filter karne me dikkat aayi!" });
    }
});

// 🔥 4. DELETE: Specific Task from File
app.delete('/api/delete-task/:id', (req, res) => {
    try {
        let dsaDatabase = readDataFromFile();
        const taskId = parseInt(req.params.id);
        
        const taskExists = dsaDatabase.some(task => task.id === taskId);
        if (!taskExists) {
            return res.status(404).json({ 
                success: false, 
                message: `Bhai, id ${taskId} wala koi task mila hi nahi! ❌` 
            });
        }

        // Target id ko filter karke hatao
        dsaDatabase = dsaDatabase.filter(task => task.id !== taskId);
        writeDataToFile(dsaDatabase); // Naya filter kiya hua array dubara file me save kiya

        res.json({ 
            success: true, 
            message: `Task ID ${taskId} file se permanent delete ho gaya! 🗑️` 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Delete karne me dikkat aayi!" });
    }
});

// Server Configuration
const PORT =5000;
app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 Pro-Level DSA Tracker Server running on port ${PORT}`);
    console.log(`💾 Storage Node: Local JSON File System Active`);
    console.log(`=================================================`);
});