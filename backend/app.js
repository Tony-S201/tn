const express = require('express');
const connectDB = require("./config/db");
const cors = require('cors');

// Router import
const scoreRouter = require('./routes/scoreRoutes');

const app = express();
const port = 5000;

// Connect to DB
connectDB();

// Middleware
app.use(express.json());

// CORS (which domains can use API, which requests methods are authorized and which headers can be sent, and if cookie can be sent)
app.use(cors({
    origin: process.env.FRONT_URL ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Routes
app.use('/api/score', scoreRouter);

// Start server
app.listen(port, () => {
    console.log('Listening port ' + port)
})