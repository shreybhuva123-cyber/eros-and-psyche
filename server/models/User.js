const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  gender: {
    type: String,
    enum: ['Boy', 'Girl'],
    required: true
  },
  password: {
    type: String,
    required: true
  },
  reportCount: {
    type: Number,
    default: 0
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  blockedUsers: [{
    type: String // userIds
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationPhoto: {
    type: String // base64 photo
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
