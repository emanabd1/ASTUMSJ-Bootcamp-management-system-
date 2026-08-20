const passport = require("passport");
const User = require("../modules/users/userModel");
const crypto = require("crypto");

const googleClientID = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const githubClientID = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

if (googleClientID && googleClientSecret) {
  const GoogleStrategy = require("passport-google-oauth20").Strategy;

  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.trim().toLowerCase();

          if (!email) {
            return done(
              new Error("Google account does not have an email address.")
            );
          }

          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              fullName: profile.displayName || "Google User",
              email,
              password: `oauth_${crypto.randomBytes(32).toString("hex")}`,
              role: "student",
              status: "pending",
              isActive: false,
              mustChangePassword: false,
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

if (githubClientID && githubClientSecret) {
  const GitHubStrategy = require("passport-github2").Strategy;

  passport.use(
    new GitHubStrategy(
      {
        clientID: githubClientID,
        clientSecret: githubClientSecret,
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

          let user = await User.findOne({ email: normalizedEmail });

          if (!user) {
            user = await User.create({
              fullName:
                profile.displayName || profile.username || "GitHub User",
              email: normalizedEmail,
              password: `oauth_${crypto.randomBytes(32).toString("hex")}`,
              role: "student",
              status: "pending",
              isActive: false,
              mustChangePassword: false,
              githubUrl: profile.profileUrl || undefined,
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

module.exports = passport;