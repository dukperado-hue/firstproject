const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.VOR_DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "reports.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");
}

function readAll() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "[]");
  } catch {
    return [];
  }
}

function writeAll(all) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2));
}

function list() {
  return readAll();
}

function get(ref) {
  return readAll().find((r) => r.ref === ref) || null;
}

function create(rec) {
  const all = readAll();
  if (!rec.ref || all.some((r) => r.ref === rec.ref)) {
    throw new Error("missing or duplicate ref");
  }
  all.unshift(rec);
  writeAll(all);
  return rec;
}

function update(ref, patch) {
  const all = readAll();
  const i = all.findIndex((r) => r.ref === ref);
  if (i === -1) return null;
  all[i] = { ...all[i], ...patch };
  writeAll(all);
  return all[i];
}

module.exports = { list, get, create, update };
