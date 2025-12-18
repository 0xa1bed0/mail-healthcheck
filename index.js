import 'dotenv/config';
import { loadConfig } from "./config/config.js";
import { createHealthChecks } from "./checks/health-checks.js";
import { HealthCheckScheduler } from "./scheduling/scheduler.js";
import { createServer, startServer } from "./server/http.js";

const config = loadConfig();
const checks = createHealthChecks(config);
const scheduler = new HealthCheckScheduler(config, checks);
const app = createServer(config, scheduler);

startServer(app, config.port);
