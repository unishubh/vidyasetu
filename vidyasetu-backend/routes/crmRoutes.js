const express = require('express');

const crmController = require('../controllers/crmController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole('admin', 'teacher'));

router.get('/crm/students', crmController.getStudents);
router.get('/crm/students/:id/details', crmController.getStudentDetails);
router.get('/crm/students/:id/activity-log', crmController.getStudentActivityLog);
router.patch('/crm/students/:id/notes', crmController.updateStudentNotes);
router.post('/crm/students/:id/access/grant', crmController.grantSectionAccess);
router.post('/crm/students/:id/access/revoke', crmController.revokeSectionAccess);

module.exports = router;
