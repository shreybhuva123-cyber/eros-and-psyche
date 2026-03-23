require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const server = http.createServer(app);

connectDB();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://anonpair.netlify.app',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'https://anonpair.netlify.app',
    credentials: true,
    methods: ["GET", "POST"]
  }
});
require('./sockets/socketManager')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
