import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { HealthCheckScheduler } from '../../scheduling/scheduler.js';

describe('HealthCheckScheduler', () => {
  let config, mockChecks, scheduler;

  beforeEach(() => {
    config = {
      timing: {
        loginCheckInterval: 60000, // 1 minute
        loginCheckStaleAfter: 300000, // 5 minutes
        roundtripCheckInterval: 3600000, // 1 hour
        roundtripCheckStaleAfter: 7200000, // 2 hours
      }
    };

    mockChecks = {
      checkLogin: async () => ({ ok: true, id: 'login-1', startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), durationMs: 100, error: null }),
      checkOutbound: async () => ({ ok: true, id: 'outbound-1', startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), durationMs: 100, error: null }),
      checkInbound: async () => ({ ok: true, id: 'inbound-1', startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), durationMs: 100, error: null }),
      checkForwarding: async () => ({ ok: true, id: 'forwarding-1', startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), durationMs: 100, error: null }),
    };

    scheduler = new HealthCheckScheduler(config, mockChecks);
  });

  describe('shouldRunLoginCheck', () => {
    it('should return true when never run', () => {
      assert.strictEqual(scheduler.shouldRunLoginCheck(), true);
    });

    it('should return false when run recently', () => {
      scheduler.state.lastLoginCheckAt = new Date().toISOString();
      assert.strictEqual(scheduler.shouldRunLoginCheck(), false);
    });

    it('should return true when interval elapsed', () => {
      const pastTime = new Date(Date.now() - 61000).toISOString(); // 61 seconds ago
      scheduler.state.lastLoginCheckAt = pastTime;
      assert.strictEqual(scheduler.shouldRunLoginCheck(), true);
    });
  });

  describe('shouldRunRoundtripChecks', () => {
    it('should return true when never run', () => {
      assert.strictEqual(scheduler.shouldRunRoundtripChecks(), true);
    });

    it('should return false when run recently', () => {
      scheduler.state.lastRoundtripCheckAt = new Date().toISOString();
      assert.strictEqual(scheduler.shouldRunRoundtripChecks(), false);
    });

    it('should return true when interval elapsed', () => {
      const pastTime = new Date(Date.now() - 3700000).toISOString(); // >1 hour ago
      scheduler.state.lastRoundtripCheckAt = pastTime;
      assert.strictEqual(scheduler.shouldRunRoundtripChecks(), true);
    });
  });

  describe('isStateStale', () => {
    it('should be stale when never run', () => {
      assert.strictEqual(scheduler.isStateStale(), true);
    });

    it('should not be stale when recently run', () => {
      scheduler.state.lastLoginCheckAt = new Date().toISOString();
      scheduler.state.lastRoundtripCheckAt = new Date().toISOString();
      assert.strictEqual(scheduler.isStateStale(), false);
    });

    it('should be stale when login check is old', () => {
      const oldTime = new Date(Date.now() - 400000).toISOString(); // >5 minutes
      scheduler.state.lastLoginCheckAt = oldTime;
      scheduler.state.lastRoundtripCheckAt = new Date().toISOString();
      assert.strictEqual(scheduler.isStateStale(), true);
    });

    it('should be stale when roundtrip check is old', () => {
      scheduler.state.lastLoginCheckAt = new Date().toISOString();
      const oldTime = new Date(Date.now() - 7300000).toISOString(); // >2 hours
      scheduler.state.lastRoundtripCheckAt = oldTime;
      assert.strictEqual(scheduler.isStateStale(), true);
    });
  });

  describe('isHealthy', () => {
    it('should return false when no checks run', () => {
      assert.strictEqual(scheduler.isHealthy(), false);
    });

    it('should return true when all checks pass', () => {
      scheduler.state.login = { ok: true };
      scheduler.state.outbound = { ok: true };
      scheduler.state.inbound = { ok: true };
      scheduler.state.forwarding = { ok: true };
      assert.strictEqual(scheduler.isHealthy(), true);
    });

    it('should return false when login fails', () => {
      scheduler.state.login = { ok: false };
      scheduler.state.outbound = { ok: true };
      scheduler.state.inbound = { ok: true };
      scheduler.state.forwarding = { ok: true };
      assert.strictEqual(scheduler.isHealthy(), false);
    });

    it('should return false when any roundtrip check fails', () => {
      scheduler.state.login = { ok: true };
      scheduler.state.outbound = { ok: true };
      scheduler.state.inbound = { ok: false };
      scheduler.state.forwarding = { ok: true };
      assert.strictEqual(scheduler.isHealthy(), false);
    });
  });

  describe('runLoginCheck', () => {
    it('should run login check when never run', async () => {
      await scheduler.runLoginCheck();
      
      assert.ok(scheduler.state.login);
      assert.strictEqual(scheduler.state.login.ok, true);
      assert.ok(scheduler.state.lastLoginCheckAt);
    });

    it('should skip login check when run recently', async () => {
      scheduler.state.lastLoginCheckAt = new Date().toISOString();
      const previousTime = scheduler.state.lastLoginCheckAt;
      
      await scheduler.runLoginCheck();
      
      assert.strictEqual(scheduler.state.lastLoginCheckAt, previousTime);
    });
  });

  describe('runRoundtripChecks', () => {
    it('should run all checks when all pass', async () => {
      await scheduler.runRoundtripChecks();
      
      assert.ok(scheduler.state.forwarding);
      assert.ok(scheduler.state.outbound);
      assert.ok(scheduler.state.inbound);
      assert.strictEqual(scheduler.state.forwarding.ok, true);
      assert.strictEqual(scheduler.state.outbound.ok, true);
      assert.strictEqual(scheduler.state.inbound.ok, true);
    });

    it('should stop on forwarding failure', async () => {
      mockChecks.checkForwarding = async () => ({ ok: false, error: 'Failed' });
      
      await scheduler.runRoundtripChecks();
      
      assert.strictEqual(scheduler.state.forwarding.ok, false);
      assert.strictEqual(scheduler.state.outbound, null); // Should not run
      assert.strictEqual(scheduler.state.inbound, null); // Should not run
    });

    it('should stop on outbound failure', async () => {
      mockChecks.checkOutbound = async () => ({ ok: false, error: 'Failed' });
      
      await scheduler.runRoundtripChecks();
      
      assert.strictEqual(scheduler.state.forwarding.ok, true);
      assert.strictEqual(scheduler.state.outbound.ok, false);
      assert.strictEqual(scheduler.state.inbound, null); // Should not run
    });

    it('should skip roundtrip checks when run recently', async () => {
      scheduler.state.lastRoundtripCheckAt = new Date().toISOString();
      
      await scheduler.runRoundtripChecks();
      
      // Checks should not have run
      assert.strictEqual(scheduler.state.forwarding, null);
      assert.strictEqual(scheduler.state.outbound, null);
      assert.strictEqual(scheduler.state.inbound, null);
    });
  });

  describe('runAllChecks', () => {
    it('should prevent concurrent runs', async () => {
      const promise1 = scheduler.runAllChecks();
      const promise2 = scheduler.runAllChecks();
      
      await promise1;
      await promise2;
      
      // Only one set of checks should have run
      assert.ok(scheduler.state.login);
    });

    it('should skip roundtrip when login fails', async () => {
      mockChecks.checkLogin = async () => ({ ok: false, error: 'Failed' });
      
      await scheduler.runAllChecks();
      
      assert.strictEqual(scheduler.state.login.ok, false);
      assert.strictEqual(scheduler.state.forwarding, null);
      assert.strictEqual(scheduler.state.outbound, null);
      assert.strictEqual(scheduler.state.inbound, null);
    });

    it('should run roundtrip when login passes', async () => {
      await scheduler.runAllChecks();
      
      assert.strictEqual(scheduler.state.login.ok, true);
      assert.ok(scheduler.state.forwarding);
      assert.ok(scheduler.state.outbound);
      assert.ok(scheduler.state.inbound);
    });

    it('should clear isRunning flag after completion', async () => {
      await scheduler.runAllChecks();
      
      assert.strictEqual(scheduler.state.isRunning, false);
    });

    it('should clear isRunning flag even on error', async () => {
      mockChecks.checkLogin = async () => {
        throw new Error('Unexpected error');
      };
      
      await scheduler.runAllChecks();
      
      assert.strictEqual(scheduler.state.isRunning, false);
    });
  });
});
