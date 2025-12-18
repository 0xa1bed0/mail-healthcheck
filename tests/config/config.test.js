import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { loadConfig } from '../../config/config.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Config Loading', () => {
  const testSecretDir = '/tmp/test-secrets';
  
  before(() => {
    // Create test secrets directory
    if (!fs.existsSync(testSecretDir)) {
      fs.mkdirSync(testSecretDir, { recursive: true });
    }
    
    // Create test secret files
    fs.writeFileSync(path.join(testSecretDir, 'mailhealth_local_smtp_pass'), 'local-smtp-pass');
    fs.writeFileSync(path.join(testSecretDir, 'mailhealth_local_imap_pass'), 'local-imap-pass');
    fs.writeFileSync(path.join(testSecretDir, 'mailhealth_ext_smtp_pass'), 'ext-smtp-pass');
    fs.writeFileSync(path.join(testSecretDir, 'mailhealth_ext_imap_pass'), 'ext-imap-pass');
    fs.writeFileSync(path.join(testSecretDir, 'mailhealth_fwd_imap_pass'), 'fwd-imap-pass');
    
    process.env.SECRET_BASE_PATH = testSecretDir;
  });
  
  after(() => {
    // Cleanup
    if (fs.existsSync(testSecretDir)) {
      fs.rmSync(testSecretDir, { recursive: true });
    }
  });

  it('should correctly parse "false" string as boolean false', () => {
    process.env.LOCAL_SMTP_SECURE = 'false';
    process.env.LOCAL_SMTP_HOST = 'smtp.example.com';
    process.env.LOCAL_SMTP_PORT = '587';
    process.env.LOCAL_SMTP_USER = 'user';
    process.env.LOCAL_SMTP_FROM = 'from@example.com';
    
    process.env.LOCAL_IMAP_HOST = 'imap.example.com';
    process.env.LOCAL_IMAP_PORT = '993';
    process.env.LOCAL_IMAP_SECURE = 'true';
    process.env.LOCAL_IMAP_USER = 'user';
    
    process.env.EXT_SMTP_HOST = 'smtp.example.com';
    process.env.EXT_SMTP_PORT = '587';
    process.env.EXT_SMTP_SECURE = 'false';
    process.env.EXT_SMTP_USER = 'user';
    process.env.EXT_SMTP_FROM = 'from@example.com';
    
    process.env.EXT_IMAP_HOST = 'imap.example.com';
    process.env.EXT_IMAP_PORT = '993';
    process.env.EXT_IMAP_SECURE = 'true';
    process.env.EXT_IMAP_USER = 'user';
    
    process.env.FWD_IMAP_HOST = 'imap.example.com';
    process.env.FWD_IMAP_PORT = '993';
    process.env.FWD_IMAP_SECURE = 'true';
    process.env.FWD_IMAP_USER = 'user';
    
    process.env.OUTBOUND_TO = 'outbound@example.com';
    process.env.INBOUND_TO = 'inbound@example.com';
    process.env.FWD_TO = 'fwd@example.com';
    process.env.FWD_FINAL_TO = 'final@example.com';
    
    const config = loadConfig();
    
    assert.strictEqual(config.localSmtp.secure, false, 'LOCAL_SMTP_SECURE should be false');
    assert.strictEqual(config.externalSmtp.secure, false, 'EXT_SMTP_SECURE should be false');
  });

  it('should correctly parse "true" string as boolean true', () => {
    process.env.LOCAL_SMTP_SECURE = 'true';
    process.env.EXT_SMTP_SECURE = 'true';
    
    const config = loadConfig();
    
    assert.strictEqual(config.localSmtp.secure, true, 'LOCAL_SMTP_SECURE should be true');
    assert.strictEqual(config.externalSmtp.secure, true, 'EXT_SMTP_SECURE should be true');
  });

  it('should correctly parse "0" as boolean false', () => {
    process.env.LOCAL_SMTP_SECURE = '0';
    
    const config = loadConfig();
    
    assert.strictEqual(config.localSmtp.secure, false, 'LOCAL_SMTP_SECURE=0 should be false');
  });

  it('should correctly parse "1" as boolean true', () => {
    process.env.LOCAL_SMTP_SECURE = '1';
    
    const config = loadConfig();
    
    assert.strictEqual(config.localSmtp.secure, true, 'LOCAL_SMTP_SECURE=1 should be true');
  });

  it('should apply default timing values', () => {
    const config = loadConfig();
    
    assert.strictEqual(config.timing.loginCheckInterval, 60000); // 1 minute
    assert.strictEqual(config.timing.roundtripCheckInterval, 3600000); // 1 hour
  });

  it('should override timing values from env', () => {
    process.env.LOGIN_INTERVAL = '30000';
    process.env.ROUND_TRIP_INTERVAL = '7200000';
    
    const config = loadConfig();
    
    assert.strictEqual(config.timing.loginCheckInterval, 30000);
    assert.strictEqual(config.timing.roundtripCheckInterval, 7200000);
  });
});
