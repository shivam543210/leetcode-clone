const passport = require('passport');
const tokenService = require('../services/tokenService');
require('../services/oauthService'); // Initialize strategies

class OAuthController {
  // Google OAuth
  googleAuth(req, res, next) {
    passport.authenticate('google', { 
      scope: ['profile', 'email'] 
    })(req, res, next);
  }

  googleCallback(req, res, next) {
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err || !user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      const tokens = tokenService.generateTokens(user);
      
      // Redirect to frontend with tokens
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?` +
        `access_token=${tokens.accessToken}&` +
        `refresh_token=${tokens.refreshToken}`
      );
    })(req, res, next);
  }

  // GitHub OAuth
  githubAuth(req, res, next) {
    passport.authenticate('github', { 
      scope: ['user:email'] 
    })(req, res, next);
  }

  githubCallback(req, res, next) {
    passport.authenticate('github', { session: false }, (err, user) => {
      if (err || !user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      const tokens = tokenService.generateTokens(user);
      
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?` +
        `access_token=${tokens.accessToken}&` +
        `refresh_token=${tokens.refreshToken}`
      );
    })(req, res, next);
  }

  // LinkedIn OAuth
  linkedinAuth(req, res, next) {
    passport.authenticate('linkedin')(req, res, next);
  }

  linkedinCallback(req, res, next) {
    passport.authenticate('linkedin', { session: false }, (err, user) => {
      if (err || !user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      const tokens = tokenService.generateTokens(user);
      
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?` +
        `access_token=${tokens.accessToken}&` +
        `refresh_token=${tokens.refreshToken}`
      );
    })(req, res, next);
  }
}

module.exports = new OAuthController();
