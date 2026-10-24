const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

function linkStorage(linkPath, target) {
  try {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink() && fs.readlinkSync(linkPath) === target) return;
    throw new Error(`Refusing to replace existing storage at ${linkPath}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  fs.symlinkSync(target, linkPath);
}

function prepareStorage(appRoot, dataRoot) {
  fs.mkdirSync(dataRoot, { recursive: true });
  const dbFile = path.join(dataRoot, "dev.db");
  if (!fs.existsSync(dbFile)) {
    const db = new Database(dbFile);
    try {
      db.exec(fs.readFileSync(path.join(appRoot, "scripts", "initial-schema.sql"), "utf8"));
    } finally {
      db.close();
    }
  }
  const uploadRoot = path.join(dataRoot, "uploads");
  fs.mkdirSync(uploadRoot, { recursive: true });
  fs.mkdirSync(path.join(appRoot, "public"), { recursive: true });
  linkStorage(path.join(appRoot, "dev.db"), dbFile);
  linkStorage(path.join(appRoot, "public", "uploads"), uploadRoot);
}

if (require.main === module) {
  prepareStorage(process.cwd(), process.env.STUDESQ_DATA_DIR || "/data");
  console.log("StudesQ persistent storage is ready.");
}

module.exports = { prepareStorage };
