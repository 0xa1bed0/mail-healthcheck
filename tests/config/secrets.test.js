import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { readSecret } from '../../config/secrets.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Secrets Reader', () => {
  const testSecretDir = '/tmp/test-secrets-reader';

  before(() => {
    if (!fs.existsSync(testSecretDir)) {
      fs.mkdirSync(testSecretDir, { recursive: true });
    }
    process.env.SECRET_BASE_PATH = testSecretDir;
  });

  after(() => {
    if (fs.existsSync(testSecretDir)) {
      fs.rmSync(testSecretDir, { recursive: true });
    }
    delete process.env.SECRET_BASE_PATH;
  });

  it('should read secret from file', () => {
    const secretName = 'test-secret';
    const secretValue = 'my-secret-value';
    
    fs.writeFileSync(path.join(testSecretDir, secretName), secretValue);
    
    const result = readSecret(secretName);
    
    assert.strictEqual(result, secretValue);
  });

  it('should trim whitespace from secret', () => {
    const secretName = 'test-secret-whitespace';
    const secretValue = '  my-secret-value\n';
    
    fs.writeFileSync(path.join(testSecretDir, secretName), secretValue);
    
    const result = readSecret(secretName);
    
    assert.strictEqual(result, 'my-secret-value');
  });

  it('should throw error when secret file does not exist', () => {
    const secretName = 'non-existent-secret';
    
    assert.throws(
      () => readSecret(secretName),
      /Secret .* does not exist/
    );
  });

  it('should throw error when secret file is empty', () => {
    const secretName = 'empty-secret';
    
    fs.writeFileSync(path.join(testSecretDir, secretName), '');
    
    assert.throws(
      () => readSecret(secretName),
      /Secret .* is empty/
    );
  });

  it('should use default SECRET_BASE_PATH when not set', () => {
    delete process.env.SECRET_BASE_PATH;
    
    // Should default to /run/secrets (won't exist in test, will throw)
    assert.throws(
      () => readSecret('any-secret'),
      /Secret \/run\/secrets\/any-secret does not exist/
    );
    
    // Restore for other tests
    process.env.SECRET_BASE_PATH = testSecretDir;
  });
});
