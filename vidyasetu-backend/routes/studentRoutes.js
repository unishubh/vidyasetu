const express = require('express');

const studentController = require('../controllers/studentController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole('student', 'teacher', 'admin'));

router.get('/student/dashboard', studentController.getDashboard);
router.get('/student/purchases', studentController.getPurchases);
router.get('/student/sections/:id', studentController.getSectionDetails);
router.post('/student/purchases/create-order', studentController.createPurchaseOrder);
router.post('/student/purchases/:id/verify', studentController.verifyPurchase);
router.post('/student/tests/:id/start', studentController.startTest);
router.get('/student/attempts/:id', studentController.getAttempt);
router.post('/student/attempts/:id/answer', studentController.saveAnswer);
router.post('/student/attempts/:id/state', studentController.updateQuestionState);
router.post('/student/attempts/:id/submit', studentController.submitAttempt);
router.get('/student/attempts/:id/review', studentController.getAttemptReview);

module.exports = router;
