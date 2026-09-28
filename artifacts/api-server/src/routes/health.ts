import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { isSeedReady } from "../lib/startupState.js";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/readyz", (_req, res) => {
  const ready = isSeedReady();
  res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "initializing" });
});

export default router;
