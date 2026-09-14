const healthService = require('../services/healthService');

const getHealth = (req, res) => {
  const healthStatus = healthService.getHealthStatus();

  res.status(200).json(healthStatus);
};

module.exports = {
  getHealth,
};
