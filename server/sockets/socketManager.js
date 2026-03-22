const jwt = require('jsonwebtoken');
const User = require('../models/User');

const boysQueue = [];
const girlsQueue = [];
const activeSessions = new Map();
let onlineCount = 0;

const ICEBREAKERS = [
  "What is the most spontaneous thing you've done lately?",
  "If you had to disappear and start a completely new life, where would you go?",
  "What is a highly controversial opinion you secretly agree with?",
  "What's your biggest dealbreaker in a relationship?",
  "If you could have one superpower to use only in relationships, what would it be?",
  "Tell me a secret you've never told a stranger.",
  "What is the best compliment you've ever received?",
  "If we only had 10 minutes to talk, what's something I need to know about you?",
  "What's your most irrational fear?",
  "If you were a color, what would you be and why?"
];

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    try {
      const user = await User.findById(socket.user._id);
      if (!user || user.isBanned) {
        return socket.disconnect();
      }
      
      socket.dbUser = user;
      onlineCount++;
      io.emit('online_count', onlineCount);
    } catch(err) {
      return socket.disconnect();
    }
    
    socket.on('join_queue', () => {
      removeFromQueues(socket);
      handleDisconnectSession(socket);
      
      const queue = socket.user.gender === 'Boy' ? boysQueue : girlsQueue;
      const oppositeQueue = socket.user.gender === 'Boy' ? girlsQueue : boysQueue;
      
      const now = Date.now();
      let matchFound = false;
      
      for (let i = 0; i < oppositeQueue.length; i++) {
        const potentialMatch = oppositeQueue[i];
        
        if (
          socket.dbUser.blockedUsers.includes(potentialMatch.user.userId) ||
          potentialMatch.dbUser.blockedUsers.includes(socket.user.userId)
        ) {
          continue;
        }
        
        oppositeQueue.splice(i, 1);
        matchFound = true;
        
        const sessionId = Math.random().toString(36).substring(2, 15);
        
        const sessionInfo = {
          id: sessionId,
          users: [socket, potentialMatch],
          startTime: now
        };
        activeSessions.set(sessionId, sessionInfo);
        
        socket.join(sessionId);
        socket.currentSessionId = sessionId;
        
        potentialMatch.join(sessionId);
        potentialMatch.currentSessionId = sessionId;
        
        const chosenIcebreaker = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];

        io.to(sessionId).emit('match_found', {
          sessionId,
          partnerGender: socket.user.gender === 'Boy' ? 'Girl' : 'Boy',
          partnerUserId: 'Anonymous', // we hide the actual user ID inside the session securely, but frontend doesn't need to know the true ID. The prompt states: "Assign system identity: Boy -> Eros, Girl -> Psyche", so we just send partnerName: Eros/Psyche
          icebreaker: chosenIcebreaker
        });

        // Auto disconnect after 10 minutes (600,000 ms)
        sessionInfo.timeoutId = setTimeout(() => {
           io.to(sessionId).emit('time_up');
           // Disconnect manually
           activeSessions.delete(sessionId);
        }, 600000);

        // Let each user know their partner's system identity
        socket.emit('match_details', { partnerName: potentialMatch.user.gender === 'Boy' ? 'Eros' : 'Psyche' });
        potentialMatch.emit('match_details', { partnerName: socket.user.gender === 'Boy' ? 'Eros' : 'Psyche' });
        
        break;
      }
      
      if (!matchFound) {
        queue.push(socket);
        socket.emit('waiting_for_match');
      }
    });
    
    socket.on('send_message', (data) => {
      if (!socket.currentSessionId) return;
      const msg = {
        sender: socket.user.gender === 'Boy' ? 'Eros' : 'Psyche',
        text: data.text,
        timestamp: new Date()
      };
      
      socket.to(socket.currentSessionId).emit('receive_message', msg);
    });
    
    socket.on('typing', () => {
      if (socket.currentSessionId) {
        socket.to(socket.currentSessionId).emit('partner_typing', { isTyping: true });
      }
    });

    socket.on('stop_typing', () => {
      if (socket.currentSessionId) {
        socket.to(socket.currentSessionId).emit('partner_typing', { isTyping: false });
      }
    });

    socket.on('end_chat', () => {
      handleDisconnectSession(socket);
    });

    socket.on('screenshot_taken', () => {
      if (socket.currentSessionId) {
        const partnerName = socket.user.gender === 'Boy' ? 'Eros' : 'Psyche';
        socket.to(socket.currentSessionId).emit('screenshot_alert', {
          message: `🚨 Safety Warning: ${partnerName} took a screenshot of the chat!`
        });
      }
    });

    // For actually retrieving the reported ID backend-side without trusting the client fully!
    // But the prompt says we pass reportedUserId from frontend. We can fetch it by seeing who was in the session.
    socket.on('get_partner_id_for_report', (callback) => {
       const session = activeSessions.get(socket.currentSessionId);
       if(session) {
          const partner = session.users.find(u => u.id !== socket.id);
          if (partner && typeof callback === 'function') {
             callback({ reportedUserId: partner.user.userId, sessionId: socket.currentSessionId });
          }
       }
    });

    socket.on('disconnect', () => {
      onlineCount = Math.max(0, onlineCount - 1);
      io.emit('online_count', onlineCount);
      removeFromQueues(socket);
      handleDisconnectSession(socket);
    });
  });
  
  function removeFromQueues(socket) {
    const bIdx = boysQueue.findIndex(s => s.id === socket.id);
    if (bIdx !== -1) boysQueue.splice(bIdx, 1);
    
    const gIdx = girlsQueue.findIndex(s => s.id === socket.id);
    if (gIdx !== -1) girlsQueue.splice(gIdx, 1);
  }

  function handleDisconnectSession(socket) {
    if (socket.currentSessionId) {
      const sessionId = socket.currentSessionId;
      socket.to(sessionId).emit('partner_disconnected');
      
      const session = activeSessions.get(sessionId);
      if (session) {
        if (session.timeoutId) clearTimeout(session.timeoutId);
        session.users.forEach(u => {
          u.leave(sessionId);
          u.currentSessionId = null;
        });
        activeSessions.delete(sessionId);
      }
      socket.currentSessionId = null;
    }
  }
};
