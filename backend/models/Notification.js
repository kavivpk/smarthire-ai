const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  notificationType: {
    type: String,
    required: true,
    // e.g. 'technical_interview', 'coding', 'resume', 'hr_interview',
    //      'placement_recommendation', 'aptitude', 'login_summary'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  emailSent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model(
  'Notification',
  notificationSchema,
  'Notifications'
);
