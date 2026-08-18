const mongoose = require("mongoose");
const isNonEmpty = (v) => v !== undefined && v !== null && String(v).trim() !== "";
const isUrl = (v) => !v || /^https?:\/\/[^\s]+$/i.test(String(v));
const isObjectId = (v) => mongoose.isValidObjectId(v);
const body = (rules) => (req,res,next) => {
  const errors=[];
  for (const [field, rule] of Object.entries(rules)) {
    const value=req.body?.[field];
    if (rule.required && !isNonEmpty(value)) errors.push(`${field} is required`);
    if (isNonEmpty(value) && rule.type === "url" && !isUrl(value)) errors.push(`${field} must be a valid URL`);
    if (isNonEmpty(value) && rule.type === "objectId" && !isObjectId(value)) errors.push(`${field} must be a valid ID`);
    if (isNonEmpty(value) && rule.enum && !rule.enum.includes(value)) errors.push(`${field} must be one of: ${rule.enum.join(", ")}`);
    if (isNonEmpty(value) && rule.maxLength && String(value).length > rule.maxLength) errors.push(`${field} must be at most ${rule.maxLength} characters`);
    if (isNonEmpty(value) && rule.min !== undefined && Number(value) < rule.min) errors.push(`${field} must be at least ${rule.min}`);
  }
  if(errors.length) return res.status(400).json({success:false,message:errors.join("; "),errors});
  next();
};
module.exports={body,isUrl,isObjectId,isNonEmpty};
