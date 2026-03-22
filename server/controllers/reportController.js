const Report = require('../models/Report');
const User = require('../models/User');

exports.reportUser = async (req, res) => {
  try {
    const { reportedUserId, sessionId } = req.body;
    const reporterId = req.user.userId;

    if (reporterId === reportedUserId) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    const newReport = new Report({
      reporterId,
      reportedUserId,
      sessionId
    });

    await newReport.save();

    const reportedUser = await User.findOne({ userId: reportedUserId });
    if (reportedUser) {
      reportedUser.reportCount += 1;
      if (reportedUser.reportCount >= 5) {
        reportedUser.isBanned = true;
      }
      await reportedUser.save();
    }

    res.status(200).json({ message: 'User reported successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'You have already reported this user' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { blockedUserId } = req.body;
    const reporterId = req.user.userId;

    const user = await User.findOne({ userId: reporterId });
    if (user && !user.blockedUsers.includes(blockedUserId)) {
      user.blockedUsers.push(blockedUserId);
      await user.save();
    }
    
    res.status(200).json({ message: 'User blocked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
