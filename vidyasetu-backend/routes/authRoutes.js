const express = require('express');

const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/auth/social', authController.socialLogin);
router.get('/auth/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
