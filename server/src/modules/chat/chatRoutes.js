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
const assistantPolicy = `You are the Bootcamp Management System assistant.

You may ONLY answer using information provided in CONTEXT.

If the information is not present in CONTEXT:
say that the information is not available in the system.

Do not use your general/world knowledge.
Do not answer questions unrelated to the Bootcamp Management System.
Do not reveal information belonging to another user.
Do not reveal passwords, JWT tokens, API keys, database credentials, or security secrets.
Only use information that the authenticated user is authorized to access.
Never guess or invent information.`;

async function askRag({ question, role, history, file, context }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.RAG_API_KEY;
  const apiUrl = process.env.GEMINI_API_URL || process.env.RAG_API_URL;
  if (!apiKey || !apiUrl) return null;

  const payload = {
    contents: [{
      role: "user",
      parts: [{ text: `CONTEXT:\n${context || "No context was provided."}\n\nQUESTION:\n${question}` }],
    }],
    systemInstruction: { parts: [{ text: assistantPolicy }] },
  };
  if (history.length) {
    payload.contents.unshift(...history.map(({ from, text }) => ({
      role: from === "user" ? "user" : "model",
      parts: [{ text }],
    })));
  }
  if (file) {
    payload.contents[0].parts.push({ inlineData: { mimeType: file.mimetype, data: file.buffer.toString("base64") } });
  }

  const response = await fetch(`${apiUrl}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`RAG API returned ${response.status}`);
  const data = await response.json();
  return String(data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "").trim() || fallbackAnswer;
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
    const context = String(req.body.context || "").slice(0, 100000);
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
      answer = await askRag({ question, role: req.user.role, history: previousMessages, file: req.file, context });
    } catch (error) {
      console.error("RAG request failed:", error.message);
      answer = null;
    }
    answer = answer || (process.env.GEMINI_API_KEY || process.env.RAG_API_KEY
      ? "The assistant could not process this request. Please try again later."
      : "The RAG assistant is not configured yet. Please ask a general bootcamp question or try again later.");
    chat.messages.push({ from: "bot", text: answer });
    await chat.save();

    res.json({ success: true, answer, messages: chat.messages.slice(-24) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
