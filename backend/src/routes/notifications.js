const express = require('express');
const { findByUserId, update } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/notifications
router.get('/', (req, res) => {
  const notifications = findByUserId('notifications', req.user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(notifications);
});

// PUT /api/notifications/:id/read
router.put('/:id/read', (req, res) => {
  const notification = update('notifications', req.params.id, { isRead: true });
  if (!notification) {
    return res.status(404).json({ message: 'Notifikace nenalezena' });
  }
  res.json(notification);
});

module.exports = router;
