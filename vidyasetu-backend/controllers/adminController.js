const adminService = require('../services/adminService');

const getCatalogs = (req, res) => {
  return res.status(200).json(adminService.getCatalogs());
};

const getSections = (req, res) => {
  return res.status(200).json(adminService.getSections());
};

const getStudents = (req, res) => {
  return res.status(200).json(adminService.getStudents());
};

const createCatalog = (req, res) => {
  try {
    return res.status(201).json(adminService.createCatalog(req.body));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const createSection = (req, res) => {
  try {
    return res.status(201).json(adminService.createSection(req.body));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const addContentItem = (req, res) => {
  try {
    return res.status(201).json(adminService.addContentItem(req.body));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const createTest = (req, res) => {
  try {
    return res.status(201).json(
      adminService.createTestWithQuestions({
        ...req.body,
        user_id: req.user.id,
      })
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const assignSection = (req, res) => {
  try {
    return res.status(201).json(adminService.grantSectionAccess(req.body));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  addContentItem,
  assignSection,
  createCatalog,
  createSection,
  createTest,
  getCatalogs,
  getSections,
  getStudents,
};
