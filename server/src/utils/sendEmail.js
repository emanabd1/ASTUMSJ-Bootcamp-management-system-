import dns from "dns";
import nodemailer from "nodemailer";

// Force Node.js to prefer IPv4.
// This helps fix Render/Gmail SMTP errors like:
// connect ENETUNREACH 2607:f8b0:....:587
dns.setDefaultResultOrder("ipv4first");

let transporter;
let verified = false;

function getTransporter() {
  // Reuse the existing transporter
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // Default to Gmail SMTP port 587
  const port = Number(process.env.EMAIL_PORT || 587);

  // Check required email configuration
  if (!user || !pass) {
    const error = new Error(
      "Email service is not configured. Set EMAIL_USER and EMAIL_PASS in the deployed backend environment."
    );
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    // Port 465 = SSL
    // Port 587 = STARTTLS
    secure: port === 465,
    requireTLS: port === 587,

    // Force IPv4 to avoid IPv6 ENETUNREACH errors
    family: 4,

    auth: {
      user,
      pass,
    },

    // Connection settings
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,

    tls: {
      minVersion: "TLSv1.2",
    },
  });

  return transporter;
}

// Verify SMTP connection once before sending emails
async function ensureVerified(mailer) {
  if (verified) return;

  try {
    await mailer.verify();
    verified = true;
    console.log(
      `SMTP email service verified successfully for ${process.env.EMAIL_USER}`
    );
  } catch (cause) {
    // Reset transporter so the next request can retry
    transporter = null;
    verified = false;

    console.error("SMTP verification error:", cause);

    const error = new Error(
      `SMTP verification failed: ${cause.message}. ` +
        "Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER and EMAIL_PASS. " +
        "For Gmail, EMAIL_PASS must be a Google App Password, not your normal Gmail password."
    );

    error.code = "EMAIL_SMTP_FAILED";
    error.cause = cause;

    throw error;
  }
}

// Send email
const sendEmail = async ({ email, subject, message, html }) => {
  if (!email) {
    throw new Error("A recipient email address is required.");
  }

  const mailer = getTransporter();

  // Verify SMTP connection
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
      // Add HTML only if provided
      ...(html ? { html } : {}),
    });

    if (!info || !info.messageId) {
      throw new Error("SMTP accepted no message ID.");
    }

    console.log("=================================");
    console.log("EMAIL SENT SUCCESSFULLY");
    console.log(`Recipient: ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Accepted: ${info.accepted}`);
    console.log(`Rejected: ${info.rejected}`);
    console.log("=================================");

    return info;
  } catch (cause) {
    // Reset transporter if sending fails
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

export default sendEmail;