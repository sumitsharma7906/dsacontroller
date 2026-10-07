const express = require('express');
const app = express();

app.use(express.json());

// Main Page Route
app.get('/', (req, res) => {
    res.send("Welcome to DSA Task Tracker Backend!");
});

// 🔥 Dynamic DSA Logic Route
app.post('/api/recommend-approach', (req, res) => {
    const { problemName, topic } = req.body; // User se data liya

    let recommendation = "";
    let timeComplexity = "";

    // Backend apna dimaag laga raha hai (Basic Logic matching)
    const lowerTopic = topic.toLowerCase();
    
    if (lowerTopic.includes("array") || lowerTopic.includes("string")) {
        recommendation = "Try using Two-Pointer approach or Sliding Window technique.";
        timeComplexity = "O(N)";
    } else if (lowerTopic.includes("linked list")) {
        recommendation = "Use Fast & Slow Pointer (Tortoise and Hare technique) or recursion.";
        timeComplexity = "O(N)";
    } else if (lowerTopic.includes("tree") || lowerTopic.includes("graph")) {
        recommendation = "Use Level Order Traversal (BFS) or Depth First Search (DFS).";
        timeComplexity = "O(V + E)";
    } else {
        recommendation = "Analyze brute force first, then try optimizing using Hashing or Sorting.";
        timeComplexity = "Depends on implementation";
    }

    // Response wapas bhejna
    res.json({
        success: true,
        message: "Analysis Completed!",
        data: {
            problem: problemName,
            category: topic,
            suggestedApproach: recommendation,
            expectedTimeComplexity: timeComplexity
        }
    });
});

// Port 5000 par run karenge kyunki 4000 par issue tha
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`DSA Mini Project Server running on port ${PORT}`);
});