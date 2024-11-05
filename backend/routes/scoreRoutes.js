const express = require("express");
const scoreController = require("../controllers/scoreController");

// Define as express router file.
const router = express.Router();

// Score Routes.
router.get('/', (req, res) => {
    res.send('Hello New Score Route File!');
});
router.get('/all', scoreController.getScores);

router.post('/register', scoreController.registerScore);

module.exports = router;