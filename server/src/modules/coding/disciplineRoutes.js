const express = require('express');
const protect = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');
const controller = require('./disciplineController');

const router = express.Router();

router.use(protect, authorize('student'));

router.get('/today', controller.getToday);
router.get('/streak', controller.getStreak);
router.post('/morning', controller.saveMorningGoals);
router.post('/checkout', controller.submitCheckout);

module.exports = router;
