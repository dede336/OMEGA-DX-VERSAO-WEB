import { Router } from "express";
import { db, gameSavesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();
const MAX_CHARGES = 5;
const RECHARGE_MS = 30 * 60 * 1000;

type CollEntry = { ownedId: string; characterId: string; level: number; exp?: number; ascensionStars?: number };
type SaveData = Record<string, any>;

function weekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function rewardFor(rank: number, points: number): number {
  if (points < 100) return 50;
  if (rank <= 10) return 500;
  if (rank <= 20) return 300;
  if (rank <= 50) return 200;
  return 150;
}

function categoryFor(points: number): string {
  if (points < 100) return "INICIANTE";
  if (points < 250) return "BRONZE";
  if (points < 500) return "PRATA";
  if (points < 1000) return "OURO";
  return "MESTRE";
}

function refreshCharges(data: SaveData, now = Date.now()) {
  let charges = Math.max(0, Math.min(MAX_CHARGES, Number(data.pvpBattleCharges ?? MAX_CHARGES)));
  let anchor = Number(data.pvpLastChargeAt ?? now);
  if (!Number.isFinite(anchor) || anchor <= 0) anchor = now;
  if (charges < MAX_CHARGES) {
    const recovered = Math.floor(Math.max(0, now - anchor) / RECHARGE_MS);
    if (recovered > 0) {
      charges = Math.min(MAX_CHARGES, charges + recovered);
      anchor = charges >= MAX_CHARGES ? now : anchor + recovered * RECHARGE_MS;
    }
  }
  return { charges, anchor };
}

async function settleWeeks() {
  const currentWeek = weekKey();
  await db.transaction(async (tx) => {
    // Lock the saves while ranking and paying them so concurrent PvP requests
    // cannot credit the same week twice.
    const rows = await tx.select({ id: gameSavesTable.id, userId: gameSavesTable.userId, saveData: gameSavesTable.saveData })
      .from(gameSavesTable).orderBy(gameSavesTable.id).for("update");
    const byWeek = new Map<string, Array<{ row: typeof rows[number]; data: SaveData; points: number }>>();
    for (const row of rows) {
      const data = (row.saveData ?? {}) as SaveData;
      const lastWeek = String(data.pvpWeekKey ?? "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(lastWeek) || lastWeek >= currentWeek) continue;
      if (!Array.isArray(data.pvpTeam) || data.pvpTeam.length !== 3 || !data.pvpCrest || !data.pvpDigivice) continue;
      const entries = byWeek.get(lastWeek) ?? [];
      entries.push({ row, data, points: Math.max(0, Number(data.pvpPoints ?? 0)) });
      byWeek.set(lastWeek, entries);
    }
    for (const [lastWeek, entries] of byWeek) {
      entries.sort((a, b) => b.points - a.points || a.row.userId - b.row.userId);
      for (const [index, entry] of entries.entries()) {
        const rank = index + 1;
        const gems = rewardFor(rank, entry.points);
        const next = {
          ...entry.data,
          gemas: Math.max(0, Number(entry.data.gemas ?? 0)) + gems,
          pvpPoints: 0,
          pvpWeekKey: currentWeek,
          pvpLastWeeklyReward: { week: lastWeek, rank, points: entry.points, gems, claimedAt: Date.now() },
        };
        await tx.update(gameSavesTable).set({ saveData: next, updatedAt: new Date() }).where(eq(gameSavesTable.id, entry.row.id));
      }
    }
  });
}

router.get("/state", requireAuth, async (req, res) => {
  await settleWeeks();
  const [save] = await db.select().from(gameSavesTable).where(eq(gameSavesTable.userId, req.auth!.userId)).limit(1);
  if (!save) { res.status(404).json({ error: "Save não encontrado" }); return; }
  const data = (save.saveData ?? {}) as SaveData;
  const now = Date.now();
  const { charges, anchor } = refreshCharges(data, now);
  const next: SaveData = { ...data, pvpBattleCharges: charges, pvpLastChargeAt: anchor, pvpWeekKey: data.pvpWeekKey ?? weekKey() };
  if (charges !== data.pvpBattleCharges || anchor !== data.pvpLastChargeAt || !data.pvpWeekKey) {
    await db.update(gameSavesTable).set({ saveData: next, updatedAt: new Date() }).where(eq(gameSavesTable.userId, req.auth!.userId));
  }
  res.json({
    pvpPoints: Math.max(0, Number(next.pvpPoints ?? 0)),
    pvpCoins: Math.max(0, Number(next.pvpCoins ?? 0)),
    pvpBattleCharges: charges,
    pvpLastChargeAt: anchor,
    pvpWeekKey: next.pvpWeekKey,
    category: categoryFor(Math.max(0, Number(next.pvpPoints ?? 0))),
    lastWeeklyReward: next.pvpLastWeeklyReward ?? null,
  });
});

router.get("/opponent", requireAuth, async (req, res) => {
  await settleWeeks();
  const rows = await db.select({ userId: gameSavesTable.userId, saveData: gameSavesTable.saveData }).from(gameSavesTable);
  const [meUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.auth!.userId)).limit(1);
  const mine = rows.find((r) => r.userId === req.auth!.userId);
  const myData = (mine?.saveData ?? {}) as SaveData;
  const myCategory = categoryFor(Math.max(0, Number(myData.pvpPoints ?? 0)));

  const candidates = rows.filter((r) => r.userId !== req.auth!.userId).map((r) => {
    const d = (r.saveData ?? {}) as SaveData;
    const collection = Array.isArray(d.collection) ? d.collection as CollEntry[] : [];
    const teamIds = Array.isArray(d.pvpTeam) ? d.pvpTeam.slice(0, 3) : [];
    const team = teamIds.map((ownedId: string) => collection.find((c) => c.ownedId === ownedId)).filter(Boolean);
    return { r, d, team };
  }).filter((x) => x.team.length === 3 && x.d.pvpCrest && x.d.pvpDigivice && categoryFor(Math.max(0, Number(x.d.pvpPoints ?? 0))) === myCategory);

  if (candidates.length === 0) { res.status(404).json({ error: "Nenhum adversário disponível na sua categoria", category: myCategory }); return; }
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  const [opponentUser] = await db.select().from(usersTable).where(eq(usersTable.id, picked.r.userId)).limit(1);
  res.json({
    username: opponentUser?.username ?? "Tamer",
    tamerName: picked.d.playerName ?? opponentUser?.username ?? "Tamer",
    tamerLevel: picked.d.tamerLevel ?? 1,
    category: myCategory,
    team: picked.team,
    crest: picked.d.pvpCrest,
    digivice: picked.d.pvpDigivice,
  });
});

router.post("/result", requireAuth, async (req, res) => {
  const won = req.body?.won === true;
  await settleWeeks();
  const [save] = await db.select().from(gameSavesTable).where(eq(gameSavesTable.userId, req.auth!.userId)).limit(1);
  if (!save) { res.status(404).json({ error: "Save não encontrado" }); return; }
  const data = (save.saveData ?? {}) as SaveData;
  const now = Date.now();
  const { charges, anchor } = refreshCharges(data, now);
  if (charges <= 0) { res.status(409).json({ error: "Sem batalhas PvP disponíveis" }); return; }

  const nextCharges = charges - 1;
  const nextPoints = won ? Math.max(0, Number(data.pvpPoints ?? 0)) + 10 : Math.max(0, Number(data.pvpPoints ?? 0) - 5);
  const nextCoins = Math.max(0, Number(data.pvpCoins ?? 0)) + (won ? 10 : 0);
  const next = {
    ...data,
    pvpPoints: nextPoints,
    pvpCoins: nextCoins,
    pvpBattleCharges: nextCharges,
    pvpLastChargeAt: charges >= MAX_CHARGES ? now : anchor,
    pvpWeekKey: data.pvpWeekKey ?? weekKey(),
  };
  await db.update(gameSavesTable).set({ saveData: next, updatedAt: new Date() }).where(eq(gameSavesTable.userId, req.auth!.userId));
  res.json({ success: true, won, pvpPoints: nextPoints, pvpCoins: nextCoins, pvpBattleCharges: nextCharges, pvpLastChargeAt: next.pvpLastChargeAt });
});

router.post("/shop", requireAuth, async (req, res) => {
  const itemId = String(req.body?.itemId ?? "");
  const prices: Record<string, number> = {
    miracle_piece: 1500, random_card: 2000, gold_battery_10: 500, energy_pill: 500, pink_flower: 20,
    food_apple: 50, food_sushi: 50, food_water: 50, food_salad: 50, food_burger: 50, food_pizza: 50,
  };
  const price = prices[itemId];
  if (!price) { res.status(400).json({ error: "Item PvP inválido" }); return; }
  const [save] = await db.select().from(gameSavesTable).where(eq(gameSavesTable.userId, req.auth!.userId)).limit(1);
  if (!save) { res.status(404).json({ error: "Save não encontrado" }); return; }
  const data = (save.saveData ?? {}) as SaveData;
  const coins = Math.max(0, Number(data.pvpCoins ?? 0));
  if (coins < price) { res.status(409).json({ error: "Moedas PvP insuficientes" }); return; }

  const next: SaveData = { ...data, pvpCoins: coins - price };
  let reward = "";
  if (itemId === "miracle_piece") {
    next.pieces = { ...(data.pieces ?? {}), piece_brasao_milagre: Number(data.pieces?.piece_brasao_milagre ?? 0) + 1 }; reward = "1× Milagre Piece";
  } else if (itemId === "gold_battery_10") {
    next.pieces = { ...(data.pieces ?? {}), piece_battery_gold: Number(data.pieces?.piece_battery_gold ?? 0) + 10 }; reward = "10× Baterias Douradas";
  } else if (itemId === "energy_pill") {
    next.inventory = [...(Array.isArray(data.inventory) ? data.inventory : []), "pilula_energetica"]; reward = "1× Pílula de Energia";
  } else if (itemId === "pink_flower") {
    next.farmDecorInventory = { ...(data.farmDecorInventory ?? {}), flower: Number(data.farmDecorInventory?.flower ?? 0) + 1 }; reward = "1× Flor Rosa";
  } else if (itemId.startsWith("food_")) {
    next.farmFoods = { ...(data.farmFoods ?? {}), [itemId]: Number(data.farmFoods?.[itemId] ?? 0) + 1 }; reward = "1× comida";
  } else if (itemId === "random_card") {
    const cards = ["card_aero_wing","card_asas_brancas","card_battle_tomahawk","card_blue_card","card_brave_shield","card_high_speed","card_holy_light","card_power_charge","card_speed_charge","card_training_manual"];
    const card = cards[Math.floor(Math.random() * cards.length)];
    next.inventory = [...(Array.isArray(data.inventory) ? data.inventory : []), card]; reward = card;
  }
  await db.update(gameSavesTable).set({ saveData: next, updatedAt: new Date() }).where(eq(gameSavesTable.userId, req.auth!.userId));
  res.json({ success: true, reward, pvpCoins: next.pvpCoins, saveData: next });
});

export default router;
