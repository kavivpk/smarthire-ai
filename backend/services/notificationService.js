/**
 * Notification Service
 *
 * Centralised fire-and-forget helper used by every AI agent.
 * It saves a Notification record and optionally sends an email.
 *
 * Usage:
 *   notify(userId, { type, title, message, emailFn })
 *
 * - Always resolves immediately (never throws).
 * - Email failure is logged but never propagates.
 * - DB failure is logged but never propagates.
 */

const Notification = require('../models/Notification');

/**
 * @param {string|ObjectId} userId
 * @param {object} options
 * @param {string} options.type         - notificationType (e.g. 'coding', 'technical_interview')
 * @param {string} options.title        - short notification title
 * @param {string} [options.message]    - longer description
 * @param {Function} [options.emailFn]  - async () => Promise — call the relevant emailService fn here
 */
const notify = (userId, { type, title, message = '', emailFn = null }) => {
  // Run everything asynchronously — caller never awaits this
  (async () => {
    let emailSent = false;

    // 1. Send email first (if provided)
    if (typeof emailFn === 'function') {
      try {
        await emailFn();
        emailSent = true;
      } catch (err) {
        console.error(`[NotificationService] Email failed (type=${type}):`, err.message);
      }
    }

    // 2. Save notification record
    try {
      await Notification.create({
        userId,
        notificationType: type,
        title,
        message,
        status: 'unread',
        emailSent
      });
    } catch (err) {
      console.error(`[NotificationService] DB save failed (type=${type}):`, err.message);
    }
  })();
  // Return nothing — fully fire-and-forget
};

module.exports = { notify };
