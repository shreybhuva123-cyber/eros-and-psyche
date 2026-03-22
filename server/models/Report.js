const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: String,
    required: true
  },
  reportedUserId: {
    type: String,
    required: true
  },
  sessionId: {
    type: String
  }
}, {
  timestamps: true
});

reportSchema.index({ reporterId: 1, reportedUserId: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
