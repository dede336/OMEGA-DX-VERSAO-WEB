#!/usr/bin/env node

import fs from "node:fs/promises";

const seedPath = new URL("../artifacts/api-server/src/seed.ts", import.meta.url);
const source = await fs.readFile(seedPath, "utf8");
const entryPattern = /upsertDigimon\(byName,\s*"([^"]+)"\s*,\s*\{([\s\S]*?)\}\s*(?:,\s*(?:true|false))?\s*\)/g;
const entries = [];
for (const match of source.matchAll(entryPattern)) {
  const field = (name) => match[2].match(new RegExp(`${name}:\\s*"([^"]+)"`))?.[1];
  entries.push({ name: match[1], rarity: field("rarity"), attribute: field("attribute"), element: field("element") });
}

const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
const response = await fetch("https://digi-api.com/api/v1/digimon?pageSize=2000");
if (!response.ok) throw new Error(`Digi-API respondeu ${response.status}`);
const index = await response.json();
const officialByKey = new Map();
for (const item of index.content ?? []) {
  const key = normalize(item.name);
  const values = officialByKey.get(key) ?? [];
  values.push(item);
  officialByKey.set(key, values);
}

const unique = new Map();
for (const entry of entries) if (!unique.has(entry.name)) unique.set(entry.name, entry);
const duplicateGroups = new Map();
for (const entry of unique.values()) {
  const key = normalize(entry.name);
  const values = duplicateGroups.get(key) ?? [];
  values.push(entry.name);
  duplicateGroups.set(key, values);
}

const report = {
  generatedAt: new Date().toISOString(),
  parsedCalls: entries.length,
  uniqueSeedNames: unique.size,
  exactDuplicateCalls: entries.length - unique.size,
  normalizedDuplicateGroups: [...duplicateGroups.entries()].filter(([, names]) => names.length > 1).map(([key, names]) => ({ key, names })),
  unmatchedNames: [...unique.values()].filter((entry) => !officialByKey.has(normalize(entry.name))).map((entry) => entry.name),
  ambiguousOfficialMatches: [...unique.values()].flatMap((entry) => {
    const matches = officialByKey.get(normalize(entry.name)) ?? [];
    return matches.length > 1 ? [{ seedName: entry.name, matches: matches.map((item) => item.name) }] : [];
  }),
};

if (process.argv.includes("--details")) {
  const matches = [...unique.values()].flatMap((entry) => {
    const official = officialByKey.get(normalize(entry.name)) ?? [];
    return official.length === 1 ? [{ entry, official: official[0] }] : [];
  });
  const details = [];
  const workers = Array.from({ length: 16 }, async () => {
    while (matches.length > 0) {
      const current = matches.shift();
      if (!current) return;
      const detailResponse = await fetch(current.official.href);
      if (!detailResponse.ok) continue;
      details.push({ entry: current.entry, official: await detailResponse.json() });
    }
  });
  await Promise.all(workers);
  const rarityByLevel = { "Baby I": "BABY", "Baby II": "TRAINING", Child: "COMMON", Adult: "RARE", Perfect: "EPIC", Ultimate: "LEGENDARY" };
  const attributeCodes = { Vaccine: "VC", Virus: "VR", Data: "DA", Free: "FR", Unknown: "UN" };
  report.rarityMismatches = details.flatMap(({ entry, official }) => {
    const levels = (official.levels ?? []).map(({ level }) => level);
    const expected = [...new Set(levels.map((level) => rarityByLevel[level]).filter(Boolean))];
    return entry.rarity && expected.length === 1 && entry.rarity !== expected[0]
      ? [{ name: entry.name, current: entry.rarity, expected: expected[0], officialLevels: levels }]
      : [];
  }).sort((a, b) => a.name.localeCompare(b.name));
  report.attributeMismatches = details.flatMap(({ entry, official }) => {
    const attributes = (official.attributes ?? []).map(({ attribute }) => attribute);
    const expected = [...new Set(attributes.map((attribute) => attributeCodes[attribute]).filter(Boolean))];
    return entry.attribute && expected.length === 1 && entry.attribute !== expected[0]
      ? [{ name: entry.name, rarity: entry.rarity, current: entry.attribute, expected: expected[0], officialAttributes: attributes }]
      : [];
  }).sort((a, b) => a.name.localeCompare(b.name));
}

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
