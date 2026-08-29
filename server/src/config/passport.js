const passport = require("passport");
const User = require("../modules/users/userModel");
const crypto = require("crypto");

const googleClientID = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const backendBaseUrl =
  process.env.BACKEND_URL ||
  process.env.SERVER_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://astumsj-bootcamp-management-system.onrender.com"
    : "http://localhost:5000");

const githubClientID = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

// ============================================================
// GOOGLE OAUTH
// ============================================================

if (googleClientID && googleClientSecret) {
  const GoogleStrategy =
    require("passport-google-oauth20").Strategy;

  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          `${backendBaseUrl}/api/auth/google/callback`,
      },

      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value
            ?.trim()
            .toLowerCase();

          if (!email) {
            return done(
              new Error(
                "Google account does not have an email address."
              )
            );
          }

          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              fullName:
                profile.displayName || "Google User",
              email,
              password: `oauth_${crypto
                .randomBytes(32)
                .toString("hex")}`,
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

// ============================================================
// GITHUB OAUTH
// ============================================================

if (githubClientID && githubClientSecret) {
  const GitHubStrategy =
    require("passport-github2").Strategy;

  passport.use(
    new GitHubStrategy(
      {
        clientID: githubClientID,
        clientSecret: githubClientSecret,
        callbackURL:
          process.env.GITHUB_CALLBACK_URL ||
          `${backendBaseUrl}/api/auth/github/callback`,
        scope: ["user:email"],
      },

      async (accessToken, refreshToken, profile, done) => {
        try {
          // GitHub may not provide a private email through
          // profile.emails, so ask GitHub directly.
          let email =
            profile.emails?.find(
              (item) => item.primary && item.verified
            )?.value ||
            profile.emails?.find(
              (item) => item.verified
            )?.value ||
            profile.emails?.[0]?.value;

          // If Passport did not provide an email, retrieve
          // the user's emails from GitHub using the OAuth token.
          if (!email) {
            const response = await fetch(
              "https://api.github.com/user/emails",
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  Accept: "application/vnd.github+json",
                  "X-GitHub-Api-Version": "2022-11-28",
                  "User-Agent":
                    "ASTUMSJ-Bootcamp-Management-System",
                },
              }
            );

            if (!response.ok) {
              throw new Error(
                `GitHub email request failed: ${response.status}`
              );
            }

            const emails = await response.json();

            email =
              emails.find(
                (item) => item.primary && item.verified
              )?.email ||
              emails.find(
                (item) => item.verified
              )?.email ||
              emails[0]?.email;
          }

          if (!email) {
            return done(
              new Error(
                "Unable to retrieve an email address from GitHub."
              )
            );
          }

          const normalizedEmail = email
            .trim()
            .toLowerCase();

          let user = await User.findOne({
            email: normalizedEmail,
          });

          if (!user) {
            user = await User.create({
              fullName:
                profile.displayName ||
                profile.username ||
                "GitHub User",

              email: normalizedEmail,

              password: `oauth_${crypto
                .randomBytes(32)
                .toString("hex")}`,

              role: "student",

              status: "pending",

              isActive: false,

              mustChangePassword: false,

              githubUrl:
                profile.profileUrl || undefined,
            });
          }

          return done(null, user);
        } catch (error) {
          console.error(
            "GitHub OAuth error:",
            error
          );

          return done(error);
        }
      }
    )
  );
}

module.exports = passport;