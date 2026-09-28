import express, { type Express } from "express";
import cors from "cors";
import { isAllowedOrigin } from "./lib/allowedOrigins.js";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { db, customDigimonsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const app: Express = express();

// Canonical Baby/Training classification used by OMEGA DX.
// All entries below use the Free attribute (FR) and only game-supported elements.
const DIGIMON_CLASSIFICATION_FIXES: Readonly<Record<string, string>> = {
  Bibimon: "LIGHTNING",
  MetalKoromon: "METAL", Mokumon: "FIRE", Botamon: "FIRE", Fukamon: "FIRE", Conomon: "EARTH",
  Nyokimon: "PLANT", Pabumon: "PLANT", Pafumon: "LIGHT", Paomon: "LIGHT", Petitmon: "WIND",
  Pichimon: "WATER", Popomon: "PLANT", Poyomon: "WATER", Punimon: "ICE",
  Pupumon: "WIND", Pururumon: "WIND", Pusumon: "NULL", Puttimon: "LIGHT", Puwamon: "WIND",
  Pyonmon: "PLANT", Pyontomon: "NULL", Relemon: "NULL", Sakumon: "METAL", Sunamon: "EARTH",
  TorikaraBallmon: "NULL", Tsubumon: "WIND", YukimiBotamon: "ICE", Yuramon: "PLANT",
  Zerimon: "NULL", Zurumon: "DARK", Minomon: "PLANT", Missimon: "METAL", Moonmon: "WATER",
  Motimon: "PLANT", Negamon: "DARK", Nyaromon: "LIGHT", Offmon: "LIGHT", Pagumon: "DARK",
  Pickmon: "METAL", Pinamon: "WIND", Poromon: "WIND", Puroromon: "WIND", Pusurimon: "EARTH",
  Sakuttomon: "METAL", Hiyarimon: "ICE", Koromon: "FIRE", Sunmon: "FIRE", Tanemon: "PLANT",
  Tokomon: "LIGHT", Tsumemon: "DARK", Tsunomon: "ICE", Upamon: "WATER", Viximon: "NULL",
  Wanyamon: "WATER", Xiaomon: "NULL", Yaamon: "DARK", Yokomon: "PLANT", Goromon: "EARTH",
  Babydmon: "WIND", Dorimon: "METAL", Kapurimon: "METAL", Kyokyomon: "METAL",
  Dodomon: "METAL", Fufumon: "METAL", Frimon: "NULL", AlgomonTraining: "DARK",
};

void Promise.all(
  Object.entries(DIGIMON_CLASSIFICATION_FIXES).map(([name, element]) =>
    db.update(customDigimonsTable)
      .set({ attribute: "FR", element, updatedAt: new Date() })
      .where(eq(customDigimonsTable.name, name)),
  ),
)
  .then(() => logger.info({ count: Object.keys(DIGIMON_CLASSIFICATION_FIXES).length }, "Applied Baby/Training classifications"))
  .catch((err) => logger.error({ err }, "Failed to apply Baby/Training classifications"));

// These two were incorrectly classified as Training and must never hatch from Digitamas.
const DIGIMON_RARITY_FIXES: Readonly<Record<string, string>> = {
  Aruraumon: "ROOKIE",
  Rurimon: "ROOKIE",
};
void Promise.all(
  Object.entries(DIGIMON_RARITY_FIXES).map(([name, rarity]) =>
    db.update(customDigimonsTable)
      .set({ rarity, updatedAt: new Date() })
      .where(eq(customDigimonsTable.name, name)),
  ),
)
  .then(() => logger.info({ names: Object.keys(DIGIMON_RARITY_FIXES) }, "Applied Digimon rarity corrections"))
  .catch((err) => logger.error({ err }, "Failed to apply Digimon rarity corrections"));

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
app.use(cors({ origin: (origin, callback) => callback(null, isAllowedOrigin(origin)) }));
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
