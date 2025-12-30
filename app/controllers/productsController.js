const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');

async function list(req, res) {
  const { page = 1, limit = 12, category, sort, search, min_price, max_price } = req.query;

  const result = await Product.listPublic({
    page: Number(page) || 1,
    limit: Number(limit) || 12,
    categorySlug: category,
    sort,
    search,
    min_price,
    max_price,
  });

  res.json({ products: result.items, total: result.total, page: result.page, limit: result.limit });
}

async function getOne(req, res) {
  const { slug } = req.params;
  const product = await Product.findBySlug(slug);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const images = await ProductImage.listByProduct(product.id);
  res.json({ product: { ...product, images } });
}

module.exports = {
  list,
  getOne,
};
