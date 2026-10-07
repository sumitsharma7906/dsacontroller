const express = require('express');
const app = express();
const { GoogleGenAI } = require('@google/genai'); 

app.use(express.json());

// 🌟 Apni Gemini API Key yahan paste rehne dena
const ai = new GoogleGenAI({ apiKey: "AIzaSyCF6p4MHzAt34jrU-8o_qlUbVBohOI1O-s" });

// 💾 Local Database (Array) - Isme saara data hamesha save rahega jab tak server chal raha hai
let dsaDatabase = [];

app.get('/', (req, res) => {
    res.send("Welcome to DSA AI Local Tracker Backend!");
});

// 🔥 1. AI Recommender aur Data Save karne wala Route
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

        // 🌟 MAGIC: Ek naya task object banaya aur local database me push kar diya
        const newTask = {
            id: dsaDatabase.length + 1,
            problemName: problemName,
            topic: topic,
            suggestedApproach: aiData.suggestedApproach,
            timeComplexity: aiData.timeComplexity,
            spaceComplexity: aiData.spaceComplexity,
            savedAt: new Date()
        };

        dsaDatabase.push(newTask); // Database me hamesha ke liye save!

        res.json({
            success: true,
            message: "AI Analysis Completed & Saved Locally! 💾",
            currentTask: newTask
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "AI processing me thodi dikkat aayi!" });
    }
});

// 🔥 2. NAYA ROUTE: Saare saved tasks ko dekhne ke liye (GET Request)
app.get('/api/all-tasks', (req, res) => {
    res.json({
        success: true,
        totalTasks: dsaDatabase.length,
        tasks: dsaDatabase
    });
});



// 🔥 3. NAYA ROUTE: Task Delete karne ke liye (DELETE Request)
// URL me jo :id likha hai, use "URL Parameter" bolte hain (Jaise /api/delete-task/1)
app.delete('/api/delete-task/:id', (req, res) => {
    try {
        // 1. URL se ID nikalo aur use integer (number) me badlo
        const taskIdToConvert = parseInt(req.params.id);

        // 2. Check karo kya yeh ID hamare database me hai bhi ya nahi
        const taskExists = dsaDatabase.some(task => task.id === taskIdToConvert);

        if (!taskExists) {
            return res.status(404).json({
                success: false,
                message: `Bhai, id ${taskIdToConvert} wala koi task mila hi nahi! ❌`
            });
        }

        // 3. .filter() lagakar us ID wale task ko array se saaf kar do
        dsaDatabase = dsaDatabase.filter(task => task.id !== taskIdToConvert);

        res.json({
            success: true,
            message: `Task ID ${taskIdToConvert} successfully delete ho gaya! 🗑️`,
            totalRemainingTasks: dsaDatabase.length
        });

    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ success: false, message: "Delete karne me dikkat aayi!" });
    }
});
// 🔥 4. NAYA ROUTE: Topic ke basis par filter karne ke liye (GET Request)
// URL me jo :topicName likha hai, wo badalta rahega (Jaise /api/tasks/Sorting ya /api/tasks/Dynamic Programming)
app.get('/api/tasks/:topicName', (req, res) => {
    try {
        // 1. URL se topic ka naam nikalo (e.g., "Sorting")
        const requestedTopic = req.params.topicName;

        // 2. Array me check karo ki is topic ke questions hain ya nahi (Case-insensitive check ke sath)
        const filteredTasks = dsaDatabase.filter(
            task => task.topic.toLowerCase() === requestedTopic.toLowerCase()
        );

        // 3. Agar us topic ka koi question nahi mila
        if (filteredTasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Bhai, '${requestedTopic}' topic ka koi task abhi tak save nahi hua hai! 🔍`
            });
        }

        // 4. Agar mil gaye, toh return kar do
        res.json({
            success: true,
            topic: requestedTopic,
            totalFound: filteredTasks.length,
            tasks: filteredTasks
        });

    } catch (error) {
        console.error("Filter error:", error);
        res.status(500).json({ success: false, message: "Filter karne me dikkat aayi!" });
    }
});
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`DSA AI Local Project Server running on port ${PORT}`);
});