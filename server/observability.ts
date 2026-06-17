import pino from "pino";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";

const isProd = process.env.NODE_ENV === "production";

// Keys/paths that must never reach the logs. pino redacts these wherever they
// appear in the logged object graph.
const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "mfaSecret",
  "secret",
  "apiKey",
  "*.password",
  "*.token",
  "*.mfaSecret",
  "*.secret",
];

// Single shared structured logger. JSON to stdout — a log collector can ingest
// it directly in production. Level is configurable via LOG_LEVEL.
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
  base: { service: "lys" },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Per-request structured logging with a stable request id echoed back to the
// client (x-request-id), so a frontend error report can be tied to a server log.
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req: Request, res: Response) => {
    const incoming = req.headers["x-request-id"];
    const id = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  // Only log API traffic (static assets / HMR would be noise), matching the
  // previous behaviour of the hand-rolled request logger.
  autoLogging: {
    ignore: (req) => !(req.url || "").startsWith("/api"),
  },
  serializers: {
    req(req) {
      return { id: req.id, method: req.method, url: req.url };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});
