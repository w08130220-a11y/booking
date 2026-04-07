import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });
  console.log(`Admin user created: ${username}`);

  // Clear existing schedule
  await prisma.weeklySchedule.deleteMany();

  // 24HR every day (Sun-Sat), 1-hour slots
  for (let day = 0; day <= 6; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endTime = `${String((hour + 1) % 24).padStart(2, "0")}:00`;
      await prisma.weeklySchedule.create({
        data: {
          dayOfWeek: day,
          startTime,
          endTime,
          isActive: true,
        },
      });
    }
  }
  console.log("Default weekly schedule created (Sun-Sat, 24HR, 1-hour slots)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
