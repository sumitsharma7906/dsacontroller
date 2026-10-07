const express = require('express');
const app = express();
const { GoogleGenAI } = require('@google/genai'); 
// 🌟 Node.js ka inbuilt File System module package kiya
const fs = require('fs');
const path = require('path');

app.use(express.json());

const ai = new GoogleGenAI({ apiKey: "AIzaSyCF6p4MHzAt34jrU-8o_qlUbVBohOI1O-s" });

// 📄 Hamari local storage file ka path
const filePath = path.join(__dirname, 'database.json');

// 🛠️ HELPER FUNCTION 1: File se data read karne ke liye
const readDataFromFile = () => {
    try {
        if (!fs.existsSync(filePath)) {
            // Agar file pehle se nahi bani, toh khali array return karo
            return [];
        }
        const fileData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileData);
    } catch (error) {
        console.error("File read karne me error:", error);
        return [];
    }
};

// 🛠️ HELPER FUNCTION 2: File me data write (save) karne ke liye
const writeDataToFile = (data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error("File save karne me error:", error);
    }
};


app.get('/', (req, res) => {
    res.send("Welcome to DSA AI File-Based Tracker Backend!");
});

// 🔥 1. POST: AI Approach and Permanent Save
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

        let aiResponseText = response.text.trim();
        if (aiResponseText.startsWith("```")) {
            aiResponseText = aiResponseText.replace(/```json|```/g, "").trim();
        }

        const aiData = JSON.parse(aiResponseText);

        // 🌟 FILE SYSTEM MAGIC: Purana data file se lekar aao
        const dsaDatabase = readDataFromFile();

        const newTask = {
            id: dsaDatabase.length + 1,
            problemName: problemName,
            topic: topic,
            suggestedApproach: aiData.suggestedApproach,
            timeComplexity: aiData.timeComplexity,
            spaceComplexity: aiData.spaceComplexity,
            savedAt: new Date()
        };

        // Naya task joda aur file me hamesha ke liye write kar diya!
        dsaDatabase.push(newTask);
        writeDataToFile(dsaDatabase);

        res.json({
            success: true,
            message: "AI Analysis Completed & Saved Permanently in File! 💾📄",
            currentTask: newTask
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "Kuch gadbad hui!" });
    }
});


// 🔥 2. GET: Read from File History
app.get('/api/all-tasks', (req, res) => {
    const dsaDatabase = readDataFromFile();
    res.json({
        success: true,
        totalTasks: dsaDatabase.length,
        tasks: dsaDatabase
    });
});

// 🔥 3. DELETE: Specific Task from File
app.delete('/api/delete-task/:id', (req, res) => {
    let dsaDatabase = readDataFromFile();
    const taskId = parseInt(req.params.id);
    
    const taskExists = dsaDatabase.some(task => task.id === taskId);
    if (!taskExists) {
        return res.status(404).json({ success: false, message: "Task nahi mila!" });
    }

    dsaDatabase = dsaDatabase.filter(task => task.id !== taskId);
    writeDataToFile(dsaDatabase); // Naya filter kiya hua array file me save kiya

    res.json({ success: true, message: `Task ID ${taskId} file se delete ho gaya! 🗑️` });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`File-Based Backend Running on port ${PORT}`);
});