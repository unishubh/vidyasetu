const studentService = require('../services/studentService');

const getDashboard = (req, res) => {
  return res.status(200).json(studentService.getDashboard(req.user.id));
};

const getSectionDetails = (req, res) => {
  try {
    return res.status(200).json(
      studentService.getSectionDetails(req.user.id, Number(req.params.id))
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const createPurchaseOrder = (req, res) => {
  try {
    return res.status(201).json(
      studentService.createPurchaseOrder(req.user.id, Number(req.body.section_id))
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const verifyPurchase = (req, res) => {
  try {
    return res.status(200).json(
      studentService.verifyPurchase(
        req.user.id,
        Number(req.params.id),
        req.body.upi_ref
      )
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const startTest = (req, res) => {
  try {
    return res.status(201).json(
      studentService.startTest(req.user.id, Number(req.params.id))
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getAttempt = (req, res) => {
  try {
    return res.status(200).json(
      studentService.getAttemptForUser(req.user.id, Number(req.params.id))
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const saveAnswer = (req, res) => {
  try {
    return res.status(200).json(
      studentService.saveAnswer(
        req.user.id,
        Number(req.params.id),
        Number(req.body.question_id),
        req.body.option_ids
      )
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateQuestionState = (req, res) => {
  try {
    return res.status(200).json(
      studentService.setQuestionState(
        req.user.id,
        Number(req.params.id),
        Number(req.body.question_id),
        req.body.status
      )
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const submitAttempt = (req, res) => {
  try {
    return res.status(200).json(
      studentService.submitAttempt(req.user.id, Number(req.params.id))
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getAttemptReview = (req, res) => {
  try {
    return res.status(200).json(
      studentService.getAttemptReview(req.user.id, Number(req.params.id))
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getPurchases = (req, res) => {
  return res.status(200).json(studentService.getPurchases(req.user.id));
};

module.exports = {
  createPurchaseOrder,
  getAttempt,
  getAttemptReview,
  getDashboard,
  getPurchases,
  getSectionDetails,
  saveAnswer,
  startTest,
  submitAttempt,
  updateQuestionState,
  verifyPurchase,
};
