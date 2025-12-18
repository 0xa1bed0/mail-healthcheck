import { describe, it } from 'node:test';
import assert from 'node:assert';
import { makeCheckResult, runCheck } from '../../checks/runner.js';

describe('Check Runner', () => {
  describe('makeCheckResult', () => {
    it('should create successful result', () => {
      const startedAt = new Date().toISOString();
      const result = makeCheckResult('test-id', startedAt, true);
      
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.id, 'test-id');
      assert.strictEqual(result.startedAt, startedAt);
      assert.strictEqual(result.error, null);
      assert.ok(result.endedAt);
      assert.ok(result.durationMs >= 0);
    });

    it('should create failed result with error', () => {
      const startedAt = new Date().toISOString();
      const error = new Error('Test error');
      const result = makeCheckResult('test-id', startedAt, false, error);
      
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.id, 'test-id');
      assert.strictEqual(result.error, 'Test error');
    });
  });

  describe('runCheck', () => {
    it('should run successful check', async () => {
      const checkFn = async () => {
        // Successful check does nothing
      };
      
      const result = await runCheck('test-check', checkFn);
      
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.error, null);
      assert.ok(result.id);
    });

    it('should capture check failure', async () => {
      const checkFn = async () => {
        throw new Error('Check failed');
      };
      
      const result = await runCheck('test-check', checkFn);
      
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.error, 'Check failed');
    });

    it('should pass id and startedAt to check function', async () => {
      let receivedId, receivedStartedAt;
      
      const checkFn = async (id, startedAt) => {
        receivedId = id;
        receivedStartedAt = startedAt;
      };
      
      const result = await runCheck('test-check', checkFn);
      
      assert.strictEqual(result.id, receivedId);
      assert.strictEqual(result.startedAt, receivedStartedAt);
    });
  });
});
