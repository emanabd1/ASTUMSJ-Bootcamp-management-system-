const dns = require("dns");
const nodemailer = require("nodemailer");
// Prefer IPv4 to avoid IPv6 ENETUNREACH errors on some deployments
dns.setDefaultResultOrder("ipv4first");
let transporter;
let verified = false;
const getEmailPorts = () => {
  const configuredPorts = (process.env.EMAIL_PORTS || [
    process.env.EMAIL_PORT || 465,
    465,
    587,
    2525,
  ].join(","))
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  return [...new Set([...configuredPorts, 465, 587, 2525])];
};

async function sendViaResend({ email, subject, message, html }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: [email],
      subject,
      text: message || "",
      ...(html ? { html } : {}),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend rejected the email (${response.status}): ${details}`);
  }

  return response.json();
}

function createTransporter(port) {
const host = process.env.EMAIL_HOST || "smtp.gmail.com";
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
secure: port === 465,
requireTLS: port !== 465,

// Force IPv4
family: 4,

auth: {
  user,
  pass,
},

connectionTimeout: 10000,
greetingTimeout: 10000,
socketTimeout: 15000,

tls: {
  minVersion: "TLSv1.2",
},
});
return transporter;
}
function getTransporter() {
  if (transporter) return transporter;
  return createTransporter(getEmailPorts()[0]);
}
async function ensureVerified(mailer) {
if (verified) return;
let lastError;
for (const port of getEmailPorts()) {
  const candidate = createTransporter(port);
  try {
    await candidate.verify();
    transporter = candidate;
    verified = true;
    console.log(
      `SMTP email service verified successfully on port ${port} for ${process.env.EMAIL_USER}`
    );
    return;
  } catch (cause) {
    lastError = cause;
    transporter = null;
    verified = false;
    console.error(`SMTP verification failed on port ${port}:`, cause.message);
  }
}

const error = new Error(
  `SMTP verification failed: ${lastError?.message || "Unable to connect to the email service."}`
);
error.code = "EMAIL_SMTP_FAILED";
error.cause = lastError;
throw error;
}
const sendEmail = async ({ email, subject, message, html }) => {
if (!email) {
throw new Error("A recipient email address is required.");
}

if (process.env.RESEND_API_KEY) {
  const info = await sendViaResend({ email, subject, message, html });
  console.log(`EMAIL SENT SUCCESSFULLY via Resend to ${email}`);
  return info;
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