const tokenService = require('../services/tokenService');
const User = require('../models/User');

// Authentication middleware to verify JWT access token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = tokenService.extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required',
    });
  }

  try {
    const decoded = tokenService.verifyAccessToken(token);
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message || 'Invalid token' });
  }
};

module.exports = authenticateToken;
