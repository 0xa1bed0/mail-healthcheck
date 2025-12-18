import { log } from "../log/log.js";
import express from "express";

export function createServer(config, scheduler) {
  const app = express();

  app.get("/status", (_req, res) => {
    const isStale = scheduler.isStateStale();
    
    log.info({ stale: isStale, state: scheduler.getState() }, "Status check");
    
    // Trigger checks asynchronously
    scheduler.runAllChecks().catch(err => log.error({ err }, "Check execution failed"));
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    
    if (isStale) {
      res.status(418).send("DOWN - stale data");
      return;
    }
    
    const isHealthy = scheduler.isHealthy();
    res.status(200).send(isHealthy ? "UP" : "DOWN");
  });

  return app;
}

export function startServer(app, port) {
  const server = app.listen(port, () => {
    log.info({ port }, "Mail healthcheck service started");
  });

  function shutdown() {
    log.info("Shutting down");
    server.close(() => {
      log.info("Server closed");
      process.exit(0);
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return server;
}
