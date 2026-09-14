const crmService = require('../services/crmService');

const getStudents = (req, res) => {
  return res.status(200).json(crmService.getCrmStudents());
};

const getStudentDetails = (req, res) => {
  try {
    return res.status(200).json(
      crmService.getStudentDetails(Number(req.params.id))
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getStudentActivityLog = (req, res) => {
  try {
    return res.status(200).json(
      crmService.getStudentActivityLog(Number(req.params.id))
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateStudentNotes = (req, res) => {
  try {
    return res.status(200).json(
      crmService.updateStudentNotes(Number(req.params.id), req.body.admin_notes)
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const grantSectionAccess = (req, res) => {
  try {
    return res.status(201).json(
      crmService.grantStudentSectionAccess(
        Number(req.params.id),
        Number(req.body.section_id),
        req.body.valid_until
      )
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const revokeSectionAccess = (req, res) => {
  try {
    return res.status(200).json(
      crmService.revokeStudentSectionAccess(
        Number(req.params.id),
        Number(req.body.section_id)
      )
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getStudentActivityLog,
  getStudentDetails,
  getStudents,
  grantSectionAccess,
  revokeSectionAccess,
  updateStudentNotes,
};
