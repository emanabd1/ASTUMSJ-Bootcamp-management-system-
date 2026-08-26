const express = require("express");
const multer = require("multer");
const Chat = require("./chatModel");
const protect = require("../../middleware/authMiddleware");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
router.use(protect);

const fallbackAnswer = "I could not reach the RAG assistant right now. Please try again shortly.";

async function askRag({ question, role, history, file }) {
  if (!process.env.RAG_API_URL) return null;

  const payload = {
    question,
    role,
    history: history.map(({ from, text }) => ({ role: from === "user" ? "user" : "assistant", content: text })),
  };
  if (file) {
    payload.file = {
      name: file.originalname,
      mimeType: file.mimetype,
      contentBase64: file.buffer.toString("base64"),
    };
  }

  const headers = { "Content-Type": "application/json" };
  if (process.env.RAG_API_KEY) headers.Authorization = `Bearer ${process.env.RAG_API_KEY}`;
  const response = await fetch(process.env.RAG_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`RAG API returned ${response.status}`);
  const data = await response.json();
  return String(data.answer || data.response || data.message || "").trim() || fallbackAnswer;
}

router.get("/history", async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ user: req.user._id }).select("messages");
    res.json({ success: true, messages: chat?.messages || [] });
  } catch (error) {
    next(error);
  }
});

router.post("/message", upload.single("file"), async (req, res, next) => {
  try {
    const question = String(req.body.question || "").trim();
    if (!question) return res.status(400).json({ success: false, message: "A question is required." });
    if (req.file && req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Only students can ask questions about uploaded files." });
    }

    const chat = await Chat.findOneAndUpdate(
      { user: req.user._id },
      { $setOnInsert: { user: req.user._id } },
      { new: true, upsert: true }
    );
    const previousMessages = chat.messages.slice(-12).map((message) => message.toObject());
    chat.messages.push({ from: "user", text: question, fileName: req.file?.originalname || "" });

    let answer;
    try {
      answer = await askRag({ question, role: req.user.role, history: previousMessages, file: req.file });
    } catch (error) {
      console.error("RAG request failed:", error.message);
      answer = null;
    }
    answer = answer || "The RAG assistant is not configured yet. Please ask a general bootcamp question or try again later.";
    chat.messages.push({ from: "bot", text: answer });
    await chat.save();

    res.json({ success: true, answer, messages: chat.messages.slice(-24) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
