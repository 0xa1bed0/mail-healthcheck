import { log } from "../log/log.js";
import nodemailer from "nodemailer";

export async function sendEmail(smtpConfig, { to, subject, text }) {
  log.info({ smtp: `${smtpConfig.host}:${smtpConfig.port}`, to }, "Sending email");

  const transport = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    requireTLS: true,
    auth: { user: smtpConfig.user, pass: smtpConfig.pass }
  });

  await transport.sendMail({
    from: smtpConfig.from,
    to,
    subject,
    text
  });
}
