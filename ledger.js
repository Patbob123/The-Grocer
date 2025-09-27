import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "config/userConfig.json");

let ledgerDB = {};
if (fs.existsSync(dbPath)) {
    try {
        const raw = fs.readFileSync(dbPath, "utf-8");
        ledgerDB = raw ? JSON.parse(raw) : {};
    } catch (err) {
        console.error("Failed to parse. Start with empty ledger.");
        ledgerDB = {};
    }
}

function saveLedger() {
    fs.writeFileSync(dbPath, JSON.stringify(ledgerDB, null, 2));
}

function logEvent(guildId, message) {
    if (!ledgerDB[guildId]) ledgerDB[guildId] = { participants: [], ledger: {}, log: [] };
    if (!ledgerDB[guildId].log) ledgerDB[guildId].log = [];
    const timestamp = new Date().toISOString();
    ledgerDB[guildId].log.push(`[${timestamp}] ${message}`);
}

setInterval(saveLedger, 30_000); // every 30s
process.on("exit", saveLedger);
process.on("SIGINT", () => process.exit());
process.on("SIGTERM", () => process.exit());

export { ledgerDB, logEvent }