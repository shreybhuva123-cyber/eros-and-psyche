const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/report', authMiddleware, reportController.reportUser);
router.post('/block', authMiddleware, reportController.blockUser);

module.exports = router;
