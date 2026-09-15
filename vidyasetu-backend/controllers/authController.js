const authService = require('../services/authService');

const socialLogin = (req, res) => {
  const { provider, email, name } = req.body;

  try {
    const result = authService.socialLogin({ provider, email, name });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    const result = await authService.googleLogin({ credential });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getCurrentUser = (req, res) => {
  return res.status(200).json(req.user);
};

module.exports = {
  getCurrentUser,
  googleLogin,
  socialLogin,
};
