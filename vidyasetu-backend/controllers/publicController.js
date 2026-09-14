const publicService = require('../services/publicService');

const listCatalogs = (req, res) => {
  return res.status(200).json(publicService.listCatalogs());
};

const getCatalogBySlug = (req, res) => {
  try {
    return res.status(200).json(publicService.getCatalogBySlug(req.params.slug));
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

module.exports = {
  getCatalogBySlug,
  listCatalogs,
};
