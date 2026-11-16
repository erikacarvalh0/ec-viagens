export function checkMigrationBaseline(names: string[]): void {
  const ordered = [...names].sort();
  const first = ordered[0];
  if (!first || !/^[0-9]+_initial_baseline$/.test(first)) {
    throw new Error("Initial database baseline migration missing.");
  }
  if (ordered.some((name) => !/^[0-9]+_[a-z0-9_]+$/.test(name))) {
    throw new Error("Invalid migration directory name.");
  }
}
