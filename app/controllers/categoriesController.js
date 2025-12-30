const Category = require('../models/Category');
const Product = require('../models/Product');

async function list(req, res) {
  const categories = await Category.listActive();
  res.json({ categories });
}

async function getOne(req, res) {
  const { slug } = req.params;
  const category = await Category.findBySlug(slug);
  if (!category || !category.is_active) {
    return res.status(404).json({ message: 'Category not found' });
  }
  res.json({ category });
}

async function productsByCategory(req, res) {
  const { slug } = req.params;
  const { page = 1, limit = 12, sort, search, min_price, max_price } = req.query;

  const category = await Category.findBySlug(slug);
  if (!category || !category.is_active) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const result = await Product.listPublic({
    page: Number(page) || 1,
    limit: Number(limit) || 12,
    categorySlug: slug,
    sort,
    search,
    min_price,
    max_price,
  });

  res.json({ category, products: result.items, total: result.total, page: result.page, limit: result.limit });
}

module.exports = {
  list,
  getOne,
  productsByCategory,
};
