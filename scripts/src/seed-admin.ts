import { db, usersTable, gameSavesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const ADMIN_USERNAME = "dede336";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Lucas336";


async function seedAdmin() {
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH ?? await bcrypt.hash(ADMIN_PASSWORD, 10);
  const [existing] = await db
    .select({ id: usersTable.id, isAdmin: usersTable.isAdmin })
    .from(usersTable)
    .where(eq(usersTable.username, ADMIN_USERNAME))
    .limit(1);

  if (existing) {
    await db
      .update(usersTable)
      .set({ isAdmin: true, role: "admin", passwordHash: adminPasswordHash })
      .where(eq(usersTable.id, existing.id));
    console.log(`Conta '${ADMIN_USERNAME}' atualizada — admin, role e senha redefinidos.`);
  } else {
    await db.insert(usersTable).values({
      username: ADMIN_USERNAME,
      passwordHash: adminPasswordHash,
      isAdmin: true,
      role: "admin",
    });
    console.log(`Conta admin '${ADMIN_USERNAME}' criada com sucesso.`);
  }
}

async function main() {
  await seedAdmin();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao executar seed:", err);
  process.exit(1);
});
