const Category = require('../../models/Category');
const { withTransaction } = require('../../utils/transaction');

async function list(req, res) {
  const categories = await Category.listAll();
  res.json({ categories });
}

async function getOne(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }
  res.json({ category });
}

async function create(req, res) {
  const { name_ar, name_en } = req.body;
  if (!name_ar || !name_en) {
    return res.status(400).json({ message: 'name_ar and name_en are required' });
  }
  const category = await withTransaction((client) => Category.createCategory(req.body, client));
  res.status(201).json({ category });
}

async function update(req, res) {
  const { name_ar, name_en } = req.body;
  if (!name_ar || !name_en) {
    return res.status(400).json({ message: 'name_ar and name_en are required' });
  }
  const category = await withTransaction((client) => Category.updateCategory(req.params.id, req.body, client));
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }
  res.json({ category });
}

async function remove(req, res) {
  const deleted = await withTransaction((client) => Category.deleteCategory(req.params.id, client));
  if (!deleted) {
    return res.status(404).json({ message: 'Category not found' });
  }
  res.json({ message: 'Category deleted' });
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
};
