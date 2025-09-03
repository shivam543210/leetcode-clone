const jwt = require('jsonwebtoken');
const config = require('../../../../../config/index');

class TokenService {
  // Generate access token (short-lived)
  generateAccessToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      subscription: user.subscription.plan,
      tokenVersion: user.tokenVersion
    };

    return jwt.sign(payload, config.auth.jwt.secret, {
      expiresIn: config.auth.jwt.expiresIn,
      issuer: config.auth.jwt.issuer,
      audience: config.auth.jwt.audience
    });
  }

  // Generate refresh token (long-lived)
  generateRefreshToken(user) {
    const payload = {
      userId: user._id,
      tokenVersion: user.tokenVersion,
      type: 'refresh'
    };

    return jwt.sign(payload, config.auth.refreshToken.secret, {
      expiresIn: config.auth.refreshToken.expiresIn,
      issuer: config.auth.jwt.issuer,
      audience: config.auth.jwt.audience
    });
  }

  // Generate both tokens
  generateTokens(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
      expiresIn: config.auth.jwt.expiresIn
    };
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.auth.jwt.secret, {
        issuer: config.auth.jwt.issuer,
        audience: config.auth.jwt.audience
      });
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.auth.refreshToken.secret, {
        issuer: config.auth.jwt.issuer,
        audience: config.auth.jwt.audience
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Decode token without verification (for debugging)
  decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = new TokenService();
