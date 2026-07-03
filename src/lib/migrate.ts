import { ensureDB } from "./db";

async function main() {
  console.log("LetsWork Alpha — ejecutando migraciones...");
  await ensureDB();
  console.log("Migraciones completadas ✓");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en migración:", err);
  process.exit(1);
});
