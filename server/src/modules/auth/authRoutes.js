const express = require("express");
const router = express.Router();
const { login, register } = require("./authController"); 

// Real Login Route
router.post("/login", login);

// Real Register Route
router.post("/register", register);

module.exports = router;