const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Get all customers
router.get('/', async (req, res) => {
  try {
    // Assuming all users are customers
    const { data, error } = await require('../supabaseClient')
      .from('users')
      .select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Customer not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 