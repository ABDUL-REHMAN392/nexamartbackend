import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import User from "../models/User.js";

// ─── Google Strategy ──────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;
        const name = profile.displayName;

        let user = await User.findOne({ email });

        if (!user) {
          // New user — create fresh
          user = await User.create({
            name,
            email,
            googleId: profile.id,
            avatar,
            isEmailVerified: true,
            password: null,
          });
        } else {
          // Existing user — only patch missing fields
          let changed = false;
          if (!user.googleId) {
            user.googleId = profile.id;
            changed = true;
          }
          if (!user.avatar && avatar) {
            user.avatar = avatar;
            changed = true;
          }
          if (changed) await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

// ─── Facebook Strategy ────────────────────────────
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ["id", "displayName", "photos", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;
        const name = profile.displayName;

        let user;

        if (!email) {
          // No email — find or create by facebookId only
          user = await User.findOne({ facebookId: profile.id });
          if (!user) {
            user = await User.create({
              name,
              facebookId: profile.id,
              avatar,
              isEmailVerified: false,
              password: null,
            });
          }
          return done(null, user);
        }

        user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name,
            email,
            facebookId: profile.id,
            avatar,
            isEmailVerified: true,
            password: null,
          });
        } else {
          let changed = false;
          if (!user.facebookId) {
            user.facebookId = profile.id;
            changed = true;
          }
          if (!user.avatar && avatar) {
            user.avatar = avatar;
            changed = true;
          }
          if (changed) await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);
export default passport;
