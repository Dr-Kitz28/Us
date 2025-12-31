import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..');
const inFile = path.join(root, 'drizzle', '0000_wet_ultimates.sql');
const outFile = path.join(root, 'drizzle', '0000_wet_ultimates.idempotent.sql');

if (!fs.existsSync(inFile)) {
  console.error(`Input file not found: ${inFile}`);
  process.exit(1);
}

let sql = fs.readFileSync(inFile, 'utf8');

// 1) Make CREATE TABLE idempotent
sql = sql.replace(/CREATE TABLE\s+"([^"]+)"/g, 'CREATE TABLE IF NOT EXISTS "$1"');

// 2) Wrap ALTER TABLE ... ADD CONSTRAINT in DO blocks that check pg_constraint
sql = sql.replace(/(ALTER TABLE\s+"[^"]+"\s+ADD CONSTRAINT\s+"([^"]+)"[^;]+;)/gms, (_m, stmt, constraintName) => {
  return `DO $$ BEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}') THEN\n    ${stmt}\n  END IF;\nEND $$;`;
});

// 3) Wrap CREATE INDEX statements with check using pg_class
sql = sql.replace(/CREATE INDEX\s+"([^"]+)"\s+ON\s+([^;]+);/gms, (_m, idxName, rest) => {
  return `DO $$ BEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = '${idxName}') THEN\n    CREATE INDEX "${idxName}" ON ${rest};\n  END IF;\nEND $$;`;
});

// 4) Normalize any leftover statement-breakpoint markers
sql = sql.replace(/-->> .*$/gm, '');
sql = sql.replace(/--> statement-breakpoint/gm, '');

fs.writeFileSync(outFile, sql, 'utf8');
console.log(`Idempotent migration written to: ${outFile}`);
