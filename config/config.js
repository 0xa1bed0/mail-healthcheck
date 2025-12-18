import { z } from "zod";
import { readSecret } from "./secrets.js";
import { second, minute, hour } from "./time.js";

// Fix for boolean coercion: explicitly handle "false" string
const booleanFromEnv = z
  .string()
  .optional()
  .transform(val => {
    if (val === undefined || val === '') return undefined;
    if (val === 'false' || val === '0') return false;
    if (val === 'true' || val === '1') return true;
    return undefined;
  });

const MailServerSchema = z.object({
  host: z.string(),
  port: z.coerce.number(),
  secure: booleanFromEnv.pipe(z.boolean()),
  user: z.string(),
  pass: z.string(),
});

const SmtpServerSchema = MailServerSchema.extend({
  from: z.string(),
});

const ImapServerSchema = MailServerSchema.extend({
  mailbox: z.string().default("INBOX"),
});

const ConfigSchema = z.object({
  port: z.coerce.number().default(3000),
  
  timing: z.object({
    loginCheckInterval: z.coerce.number().default(minute),
    loginCheckStaleAfter: z.coerce.number().default(5 * minute),
    roundtripCheckInterval: z.coerce.number().default(hour),
    roundtripCheckStaleAfter: z.coerce.number().default(2 * hour),
    messageWaitTimeout: z.coerce.number().default(3 * minute),
    imapPollInterval: z.coerce.number().default(3 * second),
  }),
  
  localSmtp: SmtpServerSchema,
  localImap: ImapServerSchema,
  externalSmtp: SmtpServerSchema,
  externalImap: ImapServerSchema,
  forwardingImap: ImapServerSchema,
  
  testAddresses: z.object({
    outboundTo: z.string(),
    inboundTo: z.string(),
    forwardingTo: z.string(),
    forwardingFinalTo: z.string(),
  }),
});

export function loadConfig() {
  const cfg = {
    port: process.env.PORT,
    
    timing: {
      loginCheckInterval: process.env.LOGIN_INTERVAL,
      loginCheckStaleAfter: process.env.LOGIN_STALE_INTERVAL,
      roundtripCheckInterval: process.env.ROUND_TRIP_INTERVAL,
      roundtripCheckStaleAfter: process.env.ROUND_TRIP_STALE_INTERVAL,
      messageWaitTimeout: process.env.ROUND_TRIP_LAND_TIMEOUT,
      imapPollInterval: process.env.IMAP_POLL_EVERY_MS,
    },
    
    localSmtp: {
      host: process.env.LOCAL_SMTP_HOST,
      port: process.env.LOCAL_SMTP_PORT,
      secure: process.env.LOCAL_SMTP_SECURE,
      user: process.env.LOCAL_SMTP_USER,
      pass: readSecret('mailhealth_local_smtp_pass'),
      from: process.env.LOCAL_SMTP_FROM,
    },
    
    localImap: {
      host: process.env.LOCAL_IMAP_HOST,
      port: process.env.LOCAL_IMAP_PORT,
      secure: process.env.LOCAL_IMAP_SECURE,
      user: process.env.LOCAL_IMAP_USER,
      pass: readSecret('mailhealth_local_imap_pass'),
      mailbox: process.env.LOCAL_IMAP_MAILBOX,
    },
    
    externalSmtp: {
      host: process.env.EXT_SMTP_HOST,
      port: process.env.EXT_SMTP_PORT,
      secure: process.env.EXT_SMTP_SECURE,
      user: process.env.EXT_SMTP_USER,
      pass: readSecret('mailhealth_ext_smtp_pass'),
      from: process.env.EXT_SMTP_FROM,
    },
    
    externalImap: {
      host: process.env.EXT_IMAP_HOST,
      port: process.env.EXT_IMAP_PORT,
      secure: process.env.EXT_IMAP_SECURE,
      user: process.env.EXT_IMAP_USER,
      pass: readSecret('mailhealth_ext_imap_pass'),
      mailbox: process.env.EXT_IMAP_MAILBOX,
    },
    
    forwardingImap: {
      host: process.env.FWD_IMAP_HOST,
      port: process.env.FWD_IMAP_PORT,
      secure: process.env.FWD_IMAP_SECURE,
      user: process.env.FWD_IMAP_USER,
      pass: readSecret('mailhealth_fwd_imap_pass'),
      mailbox: process.env.FWD_IMAP_MAILBOX,
    },
    
    testAddresses: {
      outboundTo: process.env.OUTBOUND_TO,
      inboundTo: process.env.INBOUND_TO,
      forwardingTo: process.env.FWD_TO,
      forwardingFinalTo: process.env.FWD_FINAL_TO,
    },
  };
  
  return ConfigSchema.parse(cfg);
}
