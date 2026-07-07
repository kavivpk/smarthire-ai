const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// GET /api/notifications
// Returns the 20 most recent notifications for the authenticated user
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
});

// PATCH /api/notifications/:id/read
// Mark a single notification as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'read' },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification', error: err.message });
  }
});

// PATCH /api/notifications/read-all
// Mark all notifications as read for the current user
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, status: 'unread' },
      { status: 'read' }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notifications', error: err.message });
  }
});

module.exports = router;
