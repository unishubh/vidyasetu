const express = require('express');

const adminController = require('../controllers/adminController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/catalogs', requireRole('admin', 'teacher'), adminController.getCatalogs);
router.get('/sections', requireRole('admin', 'teacher'), adminController.getSections);
router.get('/students', requireRole('admin'), adminController.getStudents);
router.post('/catalogs', requireRole('admin', 'teacher'), adminController.createCatalog);
router.post('/sections', requireRole('admin', 'teacher'), adminController.createSection);
router.post('/content', requireRole('admin', 'teacher'), adminController.addContentItem);
router.post('/tests', requireRole('admin', 'teacher'), adminController.createTest);
router.post('/assign-section', requireRole('admin'), adminController.assignSection);

module.exports = router;
