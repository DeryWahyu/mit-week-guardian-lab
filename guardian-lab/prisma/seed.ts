import { PrismaClient } from "@prisma/client";
import { seedAcademy } from "./seeders/academy";
import { demoAccounts, seedDemoAccounts } from "./seeders/demo-accounts";
import { assertLocalDemoSeed, seedDemoActivity } from "./seeders/demo-activity";

assertLocalDemoSeed();
const prisma = new PrismaClient();
try {
  await seedDemoAccounts(prisma);
  await seedAcademy(prisma);
  const activity = await seedDemoActivity(prisma);
  for (const account of demoAccounts) console.log(`${account.role}: ${account.email}`);
  console.table(activity);
  console.log(
    "Akun dan aktivitas demo lokal siap. Data lama dipertahankan; seed ulang tidak menggandakan EXP.",
  );
} finally {
  await prisma.$disconnect();
}
