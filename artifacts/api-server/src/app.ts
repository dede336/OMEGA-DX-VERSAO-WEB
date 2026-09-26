import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { db, customDigimonsTable } from "@workspace/db";
import { inArray } from "drizzle-orm";

const app: Express = express();

// Permanently purge duplicate catalogue records that were previously seeded.
const REMOVED_DUPLICATE_DIGIMONS = ["Mochimon", "Chicomon", "Choromon", "ArkadimonBaby", "Chocomon"];
void db.delete(customDigimonsTable)
  .where(inArray(customDigimonsTable.name, REMOVED_DUPLICATE_DIGIMONS))
  .then(() => logger.info({ names: REMOVED_DUPLICATE_DIGIMONS }, "Removed duplicate Digimon catalogue records"))
  .catch((err) => logger.error({ err }, "Failed to remove duplicate Digimon catalogue records"));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Support both proxy styles used by OMEGA DX deployments:
// 1) nginx preserves /api  -> backend receives /api/digimons/catalog
// 2) nginx strips /api/    -> backend receives /digimons/catalog
// The production proxy has used both forms over time. Accepting both prevents
// the canonical Digimon catalogue from disappearing and leaving Banco loading forever.
app.use("/api", router);
app.use(router);

// Keep API failures JSON even when a client calls an unknown endpoint. This
// prevents the frontend from trying to parse an HTML fallback page as JSON.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Rota da API não encontrada" });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled API error");
  res.status(500).json({ error: "Erro interno do servidor" });
});

export default app;
