import { prisma } from "../lib/prisma";
import { seedAcademy } from "./seeders/academy";

try {
  await seedAcademy(prisma);
  console.log("Tiga materi awal Academy tersedia. Akun dan kuis yang sudah ada tidak diubah.");
} finally {
  await prisma.$disconnect();
}
