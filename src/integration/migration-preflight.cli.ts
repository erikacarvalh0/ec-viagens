import { readdirSync } from "node:fs";
import { join } from "node:path";
import { checkMigrationBaseline } from "./migration-preflight";

const directory = join(process.cwd(), "prisma", "migrations");
const names = readdirSync(directory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
checkMigrationBaseline(names);
