import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const accounts = [
  {
    email: "admin@gmail.com",
    name: "Admin",
    role: "ADMIN" as const,
    phone: "+628132745175",
  },
  {
    email: "gading@gmail.com",
    name: "Alfian Gading Saputra",
    role: "USER" as const,
    phone: "+62895363116378",
  },
  {
    email: "dery@gmail.com",
    name: "Dery Wahyu Perdana",
    role: "USER" as const,
    phone: "+6282377341268",
  },
  {
    email: "rafli@gmail.com",
    name: "Rafli Maulana",
    role: "USER" as const,
    phone: "+6285367271303",
  },
];

try {
  const passwordHash = await bcrypt.hash("password", 10);
  for (const account of accounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      create: {
        ...account,
        passwordHash,
        phoneVerifiedAt: new Date(),
      },
      update: {
        name: account.name,
        role: account.role,
        phone: account.phone,
      },
    });
  }
  console.log("Akun demo (admin, gading, dery, rafli) siap digunakan.");
} finally {
  await prisma.$disconnect();
}
