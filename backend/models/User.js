const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: false, default: null },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  googleId: { type: String, default: null },
  photoURL: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);