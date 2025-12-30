const Address = require('../models/Address');
const { withTransaction } = require('../utils/transaction');

async function list(req, res) {
  const addresses = await Address.listByUser(req.user.id);
  res.json({ addresses });
}

async function create(req, res) {
  const { full_name, phone, address_line1, address_line2, city, postal_code } = req.body;

  if (!full_name || !phone || !address_line1 || !city) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const address = await withTransaction((client) => Address.createAddress(
    req.user.id,
    {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      postal_code,
    },
    client
  ));

  res.status(201).json({ address });
}

async function update(req, res) {
  const { id } = req.params;
  const { full_name, phone, address_line1, address_line2, city, postal_code } = req.body;

  if (!full_name || !phone || !address_line1 || !city) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const address = await withTransaction((client) => Address.updateAddress(
    req.user.id,
    id,
    {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      postal_code,
    },
    client
  ));

  if (!address) {
    return res.status(404).json({ message: 'Address not found' });
  }

  res.json({ address });
}

async function remove(req, res) {
  const { id } = req.params;
  const deleted = await withTransaction((client) => Address.removeAddress(req.user.id, id, client));

  if (!deleted) {
    return res.status(404).json({ message: 'Address not found' });
  }

  res.json({ message: 'Address deleted' });
}

module.exports = {
  list,
  create,
  update,
  remove,
};
