import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const ADMIN_USERNAME = "dede336";

async function seedAdmin() {
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH
    ?? (process.env.ADMIN_PASSWORD ? await bcrypt.hash(process.env.ADMIN_PASSWORD, 10) : null);

  const [existing] = await db
    .select({ id: usersTable.id, isAdmin: usersTable.isAdmin })
    .from(usersTable)
    .where(eq(usersTable.username, ADMIN_USERNAME))
    .limit(1);

  if (existing) {
    const update: Record<string, unknown> = { isAdmin: true, role: "admin" };
    if (adminPasswordHash) update.passwordHash = adminPasswordHash;
    await db.update(usersTable).set(update).where(eq(usersTable.id, existing.id));
    console.log(`Conta admin '${ADMIN_USERNAME}' preservada e atualizada.`);
    return;
  }

  if (!adminPasswordHash) throw new Error("ADMIN_PASSWORD ou ADMIN_PASSWORD_HASH é obrigatório para criar o admin");
  await db.insert(usersTable).values({
    username: ADMIN_USERNAME,
    passwordHash: adminPasswordHash,
    isAdmin: true,
    role: "admin",
  });
  console.log(`Conta admin '${ADMIN_USERNAME}' criada com sucesso.`);
}

async function main() {
  await seedAdmin();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao executar seed:", err);
  process.exit(1);
});
