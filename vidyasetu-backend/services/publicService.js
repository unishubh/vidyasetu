const { database } = require('../db/connection');

const selectCatalogs = database.prepare(`
  SELECT
    catalogs.id,
    catalogs.title,
    catalogs.slug,
    catalogs.description,
    COUNT(DISTINCT catalog_sections.id) AS section_count,
    COUNT(DISTINCT CASE WHEN tests.is_demo = 1 THEN tests.id END) AS demo_test_count
  FROM catalogs
  LEFT JOIN catalog_sections ON catalog_sections.catalog_id = catalogs.id
    AND catalog_sections.is_active = 1
  LEFT JOIN tests ON tests.section_id = catalog_sections.id
    AND tests.is_active = 1
  WHERE catalogs.is_active = 1
  GROUP BY catalogs.id
  ORDER BY catalogs.title ASC
`);

const selectCatalogBySlug = database.prepare(`
  SELECT id, title, slug, description
  FROM catalogs
  WHERE slug = ? AND is_active = 1
`);

const selectSectionsByCatalogId = database.prepare(`
  SELECT
    catalog_sections.id,
    catalog_sections.title,
    catalog_sections.slug,
    catalog_sections.description,
    catalog_sections.price_paise,
    catalog_sections.validity_days,
    catalog_sections.max_attempts_per_test,
    catalog_sections.is_demo_available,
    COUNT(DISTINCT tests.id) AS test_count,
    COUNT(DISTINCT CASE WHEN tests.is_demo = 1 THEN tests.id END) AS demo_test_count,
    COUNT(DISTINCT content_items.id) AS content_count
  FROM catalog_sections
  LEFT JOIN tests ON tests.section_id = catalog_sections.id AND tests.is_active = 1
  LEFT JOIN content_items ON content_items.section_id = catalog_sections.id
  WHERE catalog_sections.catalog_id = ?
    AND catalog_sections.is_active = 1
  GROUP BY catalog_sections.id
  ORDER BY catalog_sections.id ASC
`);

const listCatalogs = () => selectCatalogs.all();

const getCatalogBySlug = (slug) => {
  const catalog = selectCatalogBySlug.get(slug);

  if (!catalog) {
    throw new Error('Catalog not found');
  }

  return {
    ...catalog,
    sections: selectSectionsByCatalogId.all(catalog.id),
  };
};

module.exports = {
  getCatalogBySlug,
  listCatalogs,
};
