import { sendEmail } from "../clients/smtp.js";
import { checkImapConnectivity, searchForMessage } from "../clients/imap.js";
import { runCheck } from "./runner.js";

export function createHealthChecks(config) {
  
  async function checkLogin() {
    return runCheck("login", async () => {
      await checkImapConnectivity(config.localImap);
    });
  }

  async function checkRoundtrip(smtpConfig, imapConfig, recipientAddress, checkName) {
    return runCheck(checkName, async (id, startedAt) => {
      const subject = `[mail-healthcheck] ${checkName} ${id}`;
      const body = `healthcheck=${checkName}\nuuid=${id}\nts=${startedAt}\n`;
      
      await sendEmail(smtpConfig, { to: recipientAddress, subject, text: body });
      
      const found = await searchForMessage(
        imapConfig, 
        subject, 
        config.timing.messageWaitTimeout,
        config.timing.imapPollInterval
      );
      
      if (!found) {
        throw new Error(`Message not received within timeout`);
      }
    });
  }

  async function checkOutbound() {
    return checkRoundtrip(
      config.localSmtp,
      config.externalImap,
      config.testAddresses.outboundTo,
      "outbound"
    );
  }

  async function checkInbound() {
    return checkRoundtrip(
      config.externalSmtp,
      config.localImap,
      config.testAddresses.inboundTo,
      "inbound"
    );
  }

  async function checkForwarding() {
    return checkRoundtrip(
      config.externalSmtp,
      config.forwardingImap,
      config.testAddresses.forwardingTo,
      "forwarding"
    );
  }

  return {
    checkLogin,
    checkOutbound,
    checkInbound,
    checkForwarding,
  };
}
