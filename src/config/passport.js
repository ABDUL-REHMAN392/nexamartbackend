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

        let user = await User.findOne({ email });

        if (user) {
          // Email exist karti hai — Google ID link karo
          if (!user.googleId) {
            user.googleId = profile.id;
            if (!user.avatar && avatar) user.avatar = avatar;
            await user.save();
          }
          return done(null, user);
        }

        // Naya user
        user = await User.create({
          name: profile.displayName,
          email,
          googleId: profile.id,
          avatar,
          isEmailVerified: true, // Google ne already verify ki
          password: null,
        });

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

        // Facebook kabhi kabhi email nahi deta
        if (!email) {
          let user = await User.findOne({ facebookId: profile.id });
          if (user) return done(null, user);

          user = await User.create({
            name: profile.displayName,
            facebookId: profile.id,
            avatar,
            isEmailVerified: false,
            password: null,
          });
          return done(null, user);
        }

        let user = await User.findOne({ email });

        if (user) {
          if (!user.facebookId) {
            user.facebookId = profile.id;
            if (!user.avatar && avatar) user.avatar = avatar;
            await user.save();
          }
          return done(null, user);
        }

        user = await User.create({
          name: profile.displayName,
          email,
          facebookId: profile.id,
          avatar,
          isEmailVerified: true,
          password: null,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

export default passport;
