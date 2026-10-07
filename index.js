const express = require('express');
const app = express();

// Jab koi main page par aaye
app.get('/', (req, res) => {
    res.send("Mahadev ki kripa se pehla server chal gaya!");
});

// Server ka port
app.listen(4000, () => {
    console.log("Server shuru ho gaya hai on port 4000");
});
// Naya Route 1: Profile Page
app.get('/profile', (req, res) => {
    res.json({
        name: "Sumit Sharma",
        branch: "CSIT",
        status: "Learning Backend like a Pro"
    });
});

// Naya Route 2: Project Info
app.get('/project', (req, res) => {
    res.json({
        projectName: "AI-DevFlow",
        version: "1.0.0",
        techStack: ["Node.js", "Express", "Gemini API"]
    });
});
// Server ko samjhana padega ki hum JSON data receive karenge
app.use(express.json());

// Naya POST Route: User se task ka data lena
app.post('/api/add-task', (req, res) => {
    // req.body ka matlab hai jo data user ne bheja hai
    const taskName = req.body.taskName;
    const priority = req.body.priority;

    console.log("Mujhe data mila:", taskName, priority);

    // User ko wapas jawaab bhejna
    res.json({
        status: "Success",
        message: `Task '${taskName}' successfully received on backend!`,
        recommendedAlgorithm: "Gredu Approach / Sorting" // Yeh hum baad me AI se nikalwayenge
    });
});