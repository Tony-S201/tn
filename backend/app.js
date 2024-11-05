const express = require("express");
const connectDB = require("./config/db");

const app = express();
const port = 5000;

// Connect to DB
connectDB();

// Start server
app.listen(port, () => {
    console.log('Listening port ' + port)
})

// Routes
app.get('/', (req, res) => {
    res.send('Hello Express!')
})