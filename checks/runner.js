import { log } from "../log/log.js";
import crypto from "node:crypto";

export function makeCheckResult(id, startedAt, ok, error = null) {
  const endedAt = new Date().toISOString();
  const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  
  return {
    ok,
    id,
    startedAt,
    endedAt,
    durationMs,
    error: error ? String(error?.message || error) : null
  };
}

export async function runCheck(checkName, checkFn) {
  const id = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  
  log.info({ checkName, id }, "Running health check");
  
  try {
    await checkFn(id, startedAt);
    return makeCheckResult(id, startedAt, true);
  } catch (error) {
    log.error({ checkName, error: error.message }, "Health check failed");
    return makeCheckResult(id, startedAt, false, error);
  }
}
