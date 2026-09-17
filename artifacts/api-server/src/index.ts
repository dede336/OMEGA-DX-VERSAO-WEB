import { createServer } from "http";
import { execSync } from "child_process";
import app from "./app";
import { logger } from "./lib/logger";
import { seedAccounts, seedCustomDigimons, seedCharacterOverrides, activateAllSeededDigimons, deactivateLegacyEntries, syncImagesFromFolder, applyManualImageDecisions, fixDigimonRarities, deactivateDuplicateEntries, seedSpiritItems, fixBrokenEvolvesFromIds } from "./seed.js";
import { inicializadorSistema } from "./lib/systemAccounts.js";
import { initSocket } from "./lib/socket.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function autoMigrate() {
  try {
    console.log("⚙️  Verificando schema do banco de dados...");
    execSync("pnpm --filter @workspace/db push", {
      cwd: "/home/runner/workspace",
      stdio: "pipe",
      timeout: 30000,
    });
    console.log("✅ Schema do banco verificado/atualizado.");
  } catch (err) {
    console.warn("⚠️  Migration automática falhou (banco pode já estar atualizado):", String(err));
  }
}

async function runSeed() {
  try {
    await seedAccounts();
    await seedCustomDigimons();
    await seedCharacterOverrides();
    await syncImagesFromFolder();
    await applyManualImageDecisions();
    await seedSpiritItems();
    await activateAllSeededDigimons();
    await deactivateLegacyEntries();
    await deactivateDuplicateEntries();
    await fixBrokenEvolvesFromIds();
    await fixDigimonRarities();
    try {
      await inicializadorSistema.garantirContasEspeciais();
    } catch (err) {
      logger.warn({ err }, "garantirContasEspeciais: banco ainda não migrado, pulando inicialização das contas especiais");
    }
    logger.info("Seed concluído com sucesso.");
  } catch (err) {
    logger.error({ err }, "Erro durante seed (servidor continua rodando)");
  }
}

async function main() {
  await autoMigrate();

  const httpServer = createServer(app);
  initSocket(httpServer);

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(port, (err?: Error) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        reject(err);
        return;
      }
      logger.info({ port }, "Server listening");
      resolve();
    });
  });

  // Seed roda em background após o servidor já estar no ar
  runSeed().catch((err) => {
    logger.error({ err }, "Erro fatal no seed");
  });
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
