const express = require('express');
const router = express.Router();
const AdminUser = require('../models/Admin_User');
const supabase = require('../supabaseClient');

// Get all admin users
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin user by ID
router.get('/:id', async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Admin user not found' });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 