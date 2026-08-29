const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const port = Number(process.env.EMAIL_PORT || 465);

  if (!host || !user || !pass) {
    const error = new Error("Email service is not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER and EMAIL_PASS.");
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  return transporter;
}

const sendEmail = async ({ email, subject, message, html }) => {
  if (!email) throw new Error("A recipient email address is required.");

  const mailer = getTransporter();
  const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER;
  const fromName = process.env.FROM_NAME || "ASTUMSJ Bootcamp";

  return mailer.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: email,
    subject,
    text: message,
    ...(html ? { html } : {}),
  });
};

module.exports = sendEmail;
