const Score = require('../models/scoreModel');

// POST
async function registerScore(req, res) {
    const { value } = req.body;

    try {
        const score = new Score({ value });
        await score.save();
        res.status(201).json({ message: "Score successfully registered!", item: score });
    } catch(error) {
        console.error("Error during the score registration");
        res.status(500).json({ message: "Error during score registration" });
    }
}

// GET
async function getScores(req, res) {
    try {
        const scores = await Score.find();
        res.status(200).json(scores);
    } catch(error) {
        console.log("Error during fetch all");
        res.status(500).json({ message: "Error during fetch all" });
    }
}

module.exports = {
    registerScore,
    getScores,
};