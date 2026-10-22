import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:dev.db" }),
});

async function main() {
  console.log("repos:", await prisma.repository.count());
  console.log("open issues:", await prisma.issue.count({ where: { status: "OPEN" } }));

  const s = await prisma.snippet.create({
    data: { title: "db-check", code: "print(1)", language: "python" },
  });
  console.log("write ok:", s.id);
  await prisma.snippet.delete({ where: { id: s.id } });
  console.log("delete ok. Database works.");
}

main().finally(() => prisma.$disconnect());