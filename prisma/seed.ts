import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed the owner (you) with the known birth data. Everything is editable in the UI.
  const existing = await prisma.person.findFirst({ where: { role: "SELF" } });
  let self = existing;
  if (!self) {
    self = await prisma.person.create({
      data: {
        name: "André Maurer",
        role: "SELF",
        birthDate: "1989-06-01",
        birthTime: "12:37",
        birthPlace: "Bern, Schweiz",
        birthLat: 46.9481,
        birthLng: 7.4474,
        timezone: "Europe/Zurich",
        finance: {
          create: {
            currency: "CHF",
            withdrawalRate: 0.04,
            expectedReturn: 0.05,
          },
        },
      },
    });
    console.log("Created SELF person:", self.name);
  } else {
    console.log("SELF already exists:", self.name);
  }

  await prisma.appSettings.upsert({
    where: { id: "app" },
    update: { selfPersonId: self.id },
    create: { id: "app", selfPersonId: self.id, displayName: self.name },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
