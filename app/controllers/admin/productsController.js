const Product = require('../../models/Product');
const ProductImage = require('../../models/ProductImage');
const File = require('../../models/File');
const { withTransaction } = require('../../utils/transaction');

function validateProductPayload(body) {
  const required = ['name_ar', 'name_en', 'price'];
  for (const field of required) {
    if (!body[field]) {
      return `${field} is required`;
    }
  }
  const price = Number(body.price);
  if (Number.isNaN(price) || price <= 0) {
    return 'price must be a positive number';
  }
  if (body.stock !== undefined && Number.isNaN(Number(body.stock))) {
    return 'stock must be a number';
  }
  if (body.low_stock_threshold !== undefined && Number.isNaN(Number(body.low_stock_threshold))) {
    return 'low_stock_threshold must be a number';
  }
  return null;
}

async function list(req, res) {
  const products = await Product.listAdmin();
  res.json({ products });
}

async function getOne(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  const images = await ProductImage.listByProduct(product.id);
  res.json({ product: { ...product, images } });
}

async function create(req, res) {
  const validationError = validateProductPayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }
  const product = await withTransaction((client) => Product.createProduct(req.body, client));
  res.status(201).json({ product });
}

async function update(req, res) {
  const validationError = validateProductPayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }
  const product = await withTransaction((client) => Product.updateProduct(req.params.id, req.body, client));
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json({ product });
}

async function remove(req, res) {
  const deleted = await withTransaction((client) => Product.deleteProduct(req.params.id, client));
  if (!deleted) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json({ message: 'Product deleted' });
}

async function addImages(req, res) {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const files = Array.isArray(req.body.files) ? req.body.files : [];
  if (!files.length) {
    return res.status(400).json({ message: 'files array is required' });
  }

  const createdImages = await withTransaction(async (client) => {
    const images = [];
    let primaryRequested = false;
    for (const file of files) {
      if (!file.r2_key || !file.filename || !file.mime_type || !file.size || !file.original_name) {
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        continue; // skip over 10MB
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.mime_type)) {
        continue;
      }
      const dbFile = await File.createFile({
        filename: file.filename,
        original_name: file.original_name,
        mime_type: file.mime_type,
        size: file.size,
        r2_key: file.r2_key,
        uploaded_by: req.user.id,
      }, client);
      const img = await ProductImage.addImage({
        product_id: product.id,
        file_id: dbFile.id,
        is_primary: Boolean(file.is_primary),
        sort_order: file.sort_order || 0,
        alt_text_ar: file.alt_text_ar,
        alt_text_en: file.alt_text_en,
      }, client);
      images.push({ ...img, file: dbFile });
      if (img.is_primary) {
        primaryRequested = true;
      }
    }

    if (primaryRequested && images.length) {
      // ensure only one primary
      await ProductImage.setPrimary(product.id, images.find((i) => i.is_primary).id, client);
    }

    return images;
  });

  res.status(201).json({ images: createdImages });
}

async function setPrimary(req, res) {
  const { id, imageId } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  const updated = await withTransaction((client) => ProductImage.setPrimary(product.id, imageId, client));
  if (!updated) {
    return res.status(404).json({ message: 'Image not found' });
  }
  res.json({ image: updated });
}

async function removeImage(req, res) {
  const { id, imageId } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  const deleted = await withTransaction((client) => ProductImage.removeImage(product.id, imageId, client));
  if (!deleted) {
    return res.status(404).json({ message: 'Image not found' });
  }
  res.json({ message: 'Image deleted' });
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  addImages,
  setPrimary,
  removeImage,
};
