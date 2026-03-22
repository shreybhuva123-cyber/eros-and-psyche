const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const generateUserId = (gender) => {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return gender === 'Boy' ? `Eros_${rand}` : `Psyche_${rand}`;
};

exports.register = async (req, res) => {
  try {
    const { gender, password, isAgeConfirmed } = req.body;
    
    if (!['Boy', 'Girl'].includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender selection' });
    }
    if (!isAgeConfirmed) {
      return res.status(400).json({ error: 'You must confirm you are 18+' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    let userId = generateUserId(gender);
    while (await User.findOne({ userId })) {
      userId = generateUserId(gender);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      userId,
      gender,
      password: hashedPassword
    });
    
    await user.save();
    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    const user = await User.findOne({ userId });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ error: 'Your account has been banned due to multiple reports.' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user.userId, gender: user.gender, _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    res.status(200).json({ message: 'Logged in', token, userId: user.userId, gender: user.gender, reports: user.reportCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
