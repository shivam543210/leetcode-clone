const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../models/User');
const config = require('../../../../../config/index');

class OAuthService {
  constructor() {
    this.initializeStrategies();
  }

  initializeStrategies() {
    // Google OAuth Strategy
    passport.use(new GoogleStrategy({
      clientID: config.auth.oauth.google.clientId,
      clientSecret: config.auth.oauth.google.clientSecret,
      callbackURL: '/api/auth/oauth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with Google OAuth
        let user = await User.findOne({ 
          oauthId: profile.id, 
          oauthProvider: 'google' 
        });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Link Google account to existing user
          user.oauthProvider = 'google';
          user.oauthId = profile.id;
          user.isVerified = true;
          await user.save();
          return done(null, user);
        }

        // Create new user
        const newUser = new User({
          username: this.generateUsername(profile.displayName),
          email: profile.emails[0].value,
          profile: {
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            avatar: profile.photos[0]?.value
          },
          oauthProvider: 'google',
          oauthId: profile.id,
          isVerified: true
        });

        await newUser.save();
        done(null, newUser);

      } catch (error) {
        done(error, null);
      }
    }));

    // GitHub OAuth Strategy
    passport.use(new GitHubStrategy({
      clientID: config.auth.oauth.github.clientId,
      clientSecret: config.auth.oauth.github.clientSecret,
      callbackURL: '/api/auth/oauth/github/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ 
          oauthId: profile.id, 
          oauthProvider: 'github' 
        });

        if (user) {
          return done(null, user);
        }

        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          user.oauthProvider = 'github';
          user.oauthId = profile.id;
          user.isVerified = true;
          await user.save();
          return done(null, user);
        }

        const newUser = new User({
          username: profile.username.toLowerCase(),
          email: profile.emails[0].value,
          profile: {
            firstName: profile.displayName?.split(' ')[0] || profile.username,
            lastName: profile.displayName?.split(' ')[1] || '',
            avatar: profile.photos[0]?.value,
            bio: profile._json.bio || ''
          },
          oauthProvider: 'github',
          oauthId: profile.id,
          isVerified: true
        });

        await newUser.save();
        done(null, newUser);

      } catch (error) {
        done(error, null);
      }
    }));

    // LinkedIn OAuth Strategy
    passport.use(new LinkedInStrategy({
      clientID: config.auth.oauth.linkedin.clientId,
      clientSecret: config.auth.oauth.linkedin.clientSecret,
      callbackURL: '/api/auth/oauth/linkedin/callback',
      scope: ['r_emailaddress', 'r_liteprofile']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ 
          oauthId: profile.id, 
          oauthProvider: 'linkedin' 
        });

        if (user) {
          return done(null, user);
        }

        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          user.oauthProvider = 'linkedin';
          user.oauthId = profile.id;
          user.isVerified = true;
          await user.save();
          return done(null, user);
        }

        const newUser = new User({
          username: this.generateUsername(profile.displayName),
          email: profile.emails[0].value,
          profile: {
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            avatar: profile.photos[0]?.value
          },
          oauthProvider: 'linkedin',
          oauthId: profile.id,
          isVerified: true
        });

        await newUser.save();
        done(null, newUser);

      } catch (error) {
        done(error, null);
      }
    }));
  }

  generateUsername(displayName) {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20) + Math.floor(Math.random() * 1000);
  }
}

module.exports = new OAuthService();
