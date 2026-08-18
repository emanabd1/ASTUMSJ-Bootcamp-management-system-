const isValidUrl = (value) => !value || /^https?:\/\/[^\s]+$/i.test(String(value));
const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

const required = (fields = []) => (req, res, next) => {
  const missing = fields.filter((field) => {
    const value = req.body?.[field];
    return value === undefined || value === null || String(value).trim() === "";
  });
  if (missing.length) {
    return res.status(400).json({ success: false, message: `Missing required field(s): ${missing.join(", ")}.` });
  }
  next();
};

const validateUrlFields = (fields = []) => (req, res, next) => {
  const invalid = fields.filter((field) => req.body?.[field] && !isValidUrl(req.body[field]));
  if (invalid.length) {
    return res.status(400).json({ success: false, message: `Invalid URL field(s): ${invalid.join(", ")}.` });
  }
  next();
};

module.exports = { required, validateUrlFields, isValidUrl, isObjectId };
