import { log } from "../log/log.js";

export class HealthCheckScheduler {
  constructor(config, checks) {
    this.config = config;
    this.checks = checks;
    
    this.state = {
      login: null,
      outbound: null,
      inbound: null,
      forwarding: null,
      lastLoginCheckAt: null,
      lastRoundtripCheckAt: null,
      isRunning: false,
    };
  }

  shouldRunLoginCheck() {
    if (!this.state.lastLoginCheckAt) return true;
    
    const elapsed = Date.now() - new Date(this.state.lastLoginCheckAt).getTime();
    return elapsed >= this.config.timing.loginCheckInterval;
  }

  shouldRunRoundtripChecks() {
    if (!this.state.lastRoundtripCheckAt) return true;
    
    const elapsed = Date.now() - new Date(this.state.lastRoundtripCheckAt).getTime();
    return elapsed >= this.config.timing.roundtripCheckInterval;
  }

  isLoginStateStale() {
    if (!this.state.lastLoginCheckAt) return true;
    
    const age = Date.now() - new Date(this.state.lastLoginCheckAt).getTime();
    return age > this.config.timing.loginCheckStaleAfter;
  }

  isRoundtripStateStale() {
    if (!this.state.lastRoundtripCheckAt) return true;
    
    const age = Date.now() - new Date(this.state.lastRoundtripCheckAt).getTime();
    return age > this.config.timing.roundtripCheckStaleAfter;
  }

  isStateStale() {
    return this.isLoginStateStale() || this.isRoundtripStateStale();
  }

  isHealthy() {
    return Boolean(
      this.state.login?.ok &&
      this.state.outbound?.ok &&
      this.state.inbound?.ok &&
      this.state.forwarding?.ok
    );
  }

  async runLoginCheck() {
    if (!this.shouldRunLoginCheck()) {
      log.info("Skipping login check (too soon)");
      return;
    }

    log.info("Running login check");
    this.state.lastLoginCheckAt = new Date().toISOString();
    this.state.login = await this.checks.checkLogin();
  }

  async runRoundtripChecks() {
    if (!this.shouldRunRoundtripChecks()) {
      log.info("Skipping roundtrip checks (too soon)");
      return;
    }

    log.info("Running roundtrip checks");
    this.state.lastRoundtripCheckAt = new Date().toISOString();

    // Run in sequence, stop on first failure
    this.state.forwarding = await this.checks.checkForwarding();
    if (!this.state.forwarding.ok) {
      log.warn("Forwarding check failed, stopping");
      return;
    }

    this.state.outbound = await this.checks.checkOutbound();
    if (!this.state.outbound.ok) {
      log.warn("Outbound check failed, stopping");
      return;
    }

    this.state.inbound = await this.checks.checkInbound();
    if (!this.state.inbound.ok) {
      log.warn("Inbound check failed");
      return;
    }

    log.info("All roundtrip checks passed");
  }

  async runAllChecks() {
    if (this.state.isRunning) {
      log.info("Checks already running");
      return;
    }

    this.state.isRunning = true;

    try {
      await this.runLoginCheck();

      if (this.state.login && !this.state.login.ok) {
        log.warn("Login check failed, skipping roundtrip checks");
        return;
      }

      await this.runRoundtripChecks();
    } catch (error) {
      log.error({ error }, "Error running checks");
    } finally {
      this.state.isRunning = false;
    }
  }

  getState() {
    return this.state;
  }
}
