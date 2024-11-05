const express = require('express');
const connectDB = require("./config/db");
const scoreRouter = require('./routes/scoreRoutes');

const app = express();
const port = 5000;

// Connect to DB
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use('/api/score', scoreRouter);

// Start server
app.listen(port, () => {
    console.log('Listening port ' + port)
})