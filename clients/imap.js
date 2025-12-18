import { log } from "../log/log.js";
import { ImapFlow } from "imapflow";

export async function connectImap(imapConfig) {
  const client = new ImapFlow({
    host: imapConfig.host,
    port: imapConfig.port,
    secure: imapConfig.secure,
    auth: { user: imapConfig.user, pass: imapConfig.pass },
    logger: false
  });

  await client.connect();
  return client;
}

export async function checkImapConnectivity(imapConfig) {
  log.info({ imap: `${imapConfig.host}:${imapConfig.port}` }, "Checking IMAP connectivity");
  
  const client = await connectImap(imapConfig);
  
  try {
    await client.mailboxOpen(imapConfig.mailbox);
    await client.mailboxClose().catch(() => {});
    log.info("IMAP connectivity check passed");
    return true;
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function searchForMessage(imapConfig, targetSubject, timeoutMs, pollIntervalMs) {
  log.info({ imap: `${imapConfig.host}:${imapConfig.port}`, targetSubject }, "Searching for message");
  
  const deadline = Date.now() + timeoutMs;
  const client = await connectImap(imapConfig);

  try {
    while (Date.now() < deadline) {
      await client.mailboxOpen(imapConfig.mailbox);
      
      try {
        const messages = await client.search({ subject: targetSubject });
        
        if (messages && messages.length > 0) {
          log.info(`Found message with subject "${targetSubject}"`);
          await client.mailboxClose().catch(() => {});
          return true;
        }
      } catch (searchErr) {
        // Fallback: fetch recent messages if SEARCH not supported
        log.warn({ searchErr }, "IMAP SEARCH failed, using fallback");
        
        const status = await client.status(imapConfig.mailbox, { messages: true });
        if (status.messages > 0) {
          const start = Math.max(1, status.messages - 99);
          const end = status.messages;
          
          for await (let msg of client.fetch(`${start}:${end}`, { envelope: true })) {
            if (msg.envelope.subject === targetSubject) {
              log.info(`Found message with subject "${targetSubject}"`);
              await client.mailboxClose().catch(() => {});
              return true;
            }
          }
        }
      }
      
      await client.mailboxClose().catch(() => {});
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
    
    log.warn(`Message with subject "${targetSubject}" not found within timeout`);
    return false;
    
  } finally {
    await client.logout().catch(() => {});
  }
}
