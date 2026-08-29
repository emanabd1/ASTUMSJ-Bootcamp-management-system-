const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
} = require("./authController");
const protect = require("../../middleware/authMiddleware");
const { body } = require("../../validation");

const router = express.Router();

const clientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .find(Boolean) || "http://localhost:5173";

const oauthConfigured = (provider) => provider === "google"
  ? Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  : Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

const requireOAuthConfig = (provider) => (req, res, next) => {
  if (oauthConfigured(provider)) return next();
  return res.status(503).json({
    success: false,
    message: `${provider === "google" ? "Google" : "GitHub"} sign-in is not configured on the server yet.`,
  });
};

const createOAuthToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET || "change-this-secret",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    }
  );

router.post(
  "/register",
  body({
    fullName: { required: true, maxLength: 120 },
    email: { required: true },
    password: { required: true },
    confirmPassword: { required: true },
    gender: { required: true },
    department: { required: true },
    yearOfStudy: { required: true },
    bootcampReason: { required: true, maxLength: 3000 },
    githubUrl: { type: "url" },
    leetcodeUrl: { type: "url" },
    codeforcesUrl: { type: "url" },
  }),
  register
);

router.post(
  "/login",
  body({
    email: { required: true },
    password: { required: true },
  }),
  login
);

router.post(
  "/forgot-password",
  body({
    email: { required: true },
  }),
  forgotPassword
);

router.post(
  "/reset-password",
  body({
    email: { required: true },
    otp: { required: true },
    password: { required: true },
    confirmPassword: { required: true },
  }),
  resetPassword
);

router.post(
  "/change-password",
  protect,
  body({
    currentPassword: { required: true },
    newPassword: { required: true },
    confirmPassword: { required: true },
  }),
  changePassword
);

router.get("/me", protect, me);

router.get(
  "/google",
  requireOAuthConfig("google"),
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);


router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${clientUrl()}/login?oauth=google-failed`,
  }),
  (req, res) => {
    if (req.user.status === "pending") {
      return res.redirect(
        `${clientUrl()}/login?oauth=pending`
      );
    }

    if (req.user.status === "rejected") {
      return res.redirect(
        `${clientUrl()}/login?oauth=rejected`
      );
    }

    if (!req.user.isActive) {
      return res.redirect(
        `${clientUrl()}/login?oauth=inactive`
      );
    }

    const token = createOAuthToken(req.user);

    return res.redirect(
      `${clientUrl()}/oauth-success?token=${encodeURIComponent(
        token
      )}`
    );
  }
);

router.get(
  "/github",
  requireOAuthConfig("github"),
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${clientUrl()}/login?oauth=github-failed`,
  }),
  (req, res) => {
    if (req.user.status === "pending") {
      return res.redirect(
        `${clientUrl()}/login?oauth=pending`
      );
    }

    if (req.user.status === "rejected") {
      return res.redirect(
        `${clientUrl()}/login?oauth=rejected`
      );
    }

    if (!req.user.isActive) {
      return res.redirect(
        `${clientUrl()}/login?oauth=inactive`
      );
    }

    const token = createOAuthToken(req.user);

    return res.redirect(
      `${clientUrl()}/oauth-success?token=${encodeURIComponent(
        token
      )}`
    );
  }
);

module.exports = router;