const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const validateProduct = require('../middleware/validateProduct');
const { NotFoundError } = require('../errors');

let products = [];

// GET /api/products (filter, pagination)
router.get('/', (req, res) => {
  let result = products;

  if (req.query.category) {
    result = result.filter(p => p.category === req.query.category);
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || result.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginated = result.slice(start, end);

  res.json({
    page,
    limit,
    total: result.length,
    products: paginated
  });
});

// GET /api/products/:id
router.get('/:id', (req, res, next) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return next(new NotFoundError('Product not found'));
  res.json(product);
});

// POST /api/products
router.post('/', auth, validateProduct, (req, res) => {
  const { name, description, price, category, inStock } = req.body;
  const product = { id: uuidv4(), name, description, price, category, inStock };
  products.push(product);
  res.status(201).json(product);
});

// PUT /api/products/:id
router.put('/:id', auth, validateProduct, (req, res, next) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return next(new NotFoundError('Product not found'));

  Object.assign(product, req.body);
  res.json(product);
});

// DELETE /api/products/:id
router.delete('/:id', auth, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(index, 1);
  res.json({ message: 'Product deleted' });
});

// GET /api/products/search/name?q=value
router.get('/search/name', (req, res) => {
  const { q } = req.query;
  const matched = products.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase())
  );
  res.json(matched);
});

// GET /api/products/stats
router.get('/stats', (req, res) => {
  const stats = {};
  products.forEach(p => {
    if (!stats[p.category]) stats[p.category] = 0;
    stats[p.category]++;
  });
  res.json(stats);
});

module.exports = router;
