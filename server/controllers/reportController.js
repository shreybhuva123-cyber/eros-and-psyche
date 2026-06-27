const { prisma } = require('../config/db');

exports.reportUser = async (req, res) => {
  try {
    const { reportedUserId, sessionId } = req.body;
    const reporterId = req.user.userId;

    if (reporterId === reportedUserId) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    await prisma.report.create({
      data: {
        reporterId,
        reportedUserId,
        sessionId
      }
    });

    const reportedUser = await prisma.user.findUnique({ where: { userId: reportedUserId } });
    if (reportedUser) {
      const newReportCount = reportedUser.reportCount + 1;
      await prisma.user.update({
        where: { userId: reportedUserId },
        data: {
          reportCount: newReportCount,
          isBanned: newReportCount >= 5
        }
      });
    }

    res.status(200).json({ message: 'User reported successfully' });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'You have already reported this user' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { blockedUserId } = req.body;
    const reporterId = req.user.userId;

    const user = await prisma.user.findUnique({ where: { userId: reporterId } });
    if (user && !user.blockedUsers.includes(blockedUserId)) {
      await prisma.user.update({
        where: { userId: reporterId },
        data: {
          blockedUsers: {
            push: blockedUserId
          }
        }
      });
    }
    
    res.status(200).json({ message: 'User blocked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
