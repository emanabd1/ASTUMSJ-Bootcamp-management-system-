const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../modules/users/userModel");


// GOOGLE


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value
          ?.trim()
          .toLowerCase();

        if (!email) {
          return done(
            new Error("Google account does not have an email address.")
          );
        }

        const user = await User.findOne({ email });

        if (!user) {
          return done(null, false, {
            message:
              "No account was found with this Google email. Please register first.",
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// GITHUB

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.find((item) => item.primary)?.value ||
          profile.emails?.[0]?.value;

        if (!email) {
          return done(
            new Error(
              "GitHub account does not have a public email address."
            )
          );
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
          email: normalizedEmail,
        });

        if (!user) {
          return done(null, false, {
            message:
              "No account was found with this GitHub email. Please register first.",
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;