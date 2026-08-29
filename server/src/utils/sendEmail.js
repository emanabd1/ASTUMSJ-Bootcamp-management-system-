const dns = require("dns");
const nodemailer = require("nodemailer");
// Prefer IPv4 to avoid IPv6 ENETUNREACH errors on some deployments
dns.setDefaultResultOrder("ipv4first");
let transporter;
let verified = false;
function getTransporter() {
if (transporter) return transporter;
const host = process.env.EMAIL_HOST || "smtp.gmail.com";
const port = Number(process.env.EMAIL_PORT || 587);
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
if (!user || !pass) {
const error = new Error(
"Email service is not configured. Set EMAIL_USER and EMAIL_PASS."
);
error.code = "EMAIL_NOT_CONFIGURED";
throw error;
}
transporter = nodemailer.createTransport({
host,
port,
// Gmail port configuration
secure: port === 465,
requireTLS: port === 587,

// Force IPv4
family: 4,

auth: {
  user,
  pass,
},

connectionTimeout: 20000,
greetingTimeout: 20000,
socketTimeout: 30000,

tls: {
  minVersion: "TLSv1.2",
},
});
return transporter;
}
async function ensureVerified(mailer) {
if (verified) return;
try {
await mailer.verify();
verified = true;
console.log(
  `SMTP email service verified successfully for ${process.env.EMAIL_USER}`
);
} catch (cause) {
transporter = null;
verified = false;
console.error("SMTP verification error:", cause);

const error = new Error(
  `SMTP verification failed: ${cause.message}`
);

error.code = "EMAIL_SMTP_FAILED";
error.cause = cause;

throw error;
}
}
const sendEmail = async ({ email, subject, message, html }) => {
if (!email) {
throw new Error("A recipient email address is required.");
}
const mailer = getTransporter();
await ensureVerified(mailer);
const fromEmail =
process.env.FROM_EMAIL || process.env.EMAIL_USER;
const fromName =
process.env.FROM_NAME || "ASTUMSJ Bootcamp";
try {
const info = await mailer.sendMail({
from: `"${fromName}" <${fromEmail}>`,
to: email,
subject,
text: message || "",
...(html ? { html } : {}),
});
console.log("EMAIL SENT SUCCESSFULLY");
console.log(`Recipient: ${email}`);
console.log(`Message ID: ${info.messageId}`);
console.log(`Accepted: ${info.accepted}`);
console.log(`Rejected: ${info.rejected}`);

return info;
} catch (cause) {
transporter = null;
verified = false;
console.error("EMAIL SENDING FAILED:", cause);

const error = new Error(
  `Failed to send email to ${email}: ${cause.message}`
);

error.code = "EMAIL_SEND_FAILED";
error.cause = cause;

throw error;
}
};
module.exports = sendEmail;