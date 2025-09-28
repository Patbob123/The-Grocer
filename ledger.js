import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

let ledgerDB = {};


async function initLedger() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS participants (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    )
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS ledger (
      guild_id TEXT NOT NULL,
      creditor_id TEXT NOT NULL,
      debtor_id TEXT NOT NULL,
      amount NUMERIC DEFAULT 0,
      PRIMARY KEY (guild_id, creditor_id, debtor_id)
    )
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY,
      guild_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function loadLedger(guildId) {
    if (!ledgerDB[guildId]) ledgerDB[guildId] = { participants: [], ledger: {}, log: [] };

    const p = await pool.query(
        `SELECT user_id FROM participants WHERE guild_id = $1`,
        [guildId]
    );
    for (const row of p.rows) {
        if (!ledgerDB[guildId].participants.includes(row.user_id)) {
            ledgerDB[guildId].participants.push(row.user_id);
        }
    }

    const l = await pool.query(
        `SELECT creditor_id, debtor_id, amount FROM ledger WHERE guild_id = $1`,
        [guildId]
    );
    for (const row of l.rows) {
        if (!ledgerDB[guildId].ledger[row.creditor_id]) {
            ledgerDB[guildId].ledger[row.creditor_id] = { owedBy: {} };
        }
        ledgerDB[guildId].ledger[row.creditor_id].owedBy[row.debtor_id] = parseFloat(row.amount);
    }

    const logs = await pool.query(
        `SELECT message, created_at FROM logs WHERE guild_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [guildId]
    );
    ledgerDB[guildId].log = logs.rows.map(r => `[${r.created_at.toISOString()}] ${r.message}`);
}

async function ensureLedger(guildId) {
    if (!ledgerDB[guildId]) {
        ledgerDB[guildId] = { participants: [], ledger: {}, log: [] };
    }
    await loadLedger(guildId);
}

async function addGuy(guildId, userId) {
    await pool.query(
        `INSERT INTO participants (guild_id, user_id) VALUES ($1, $2)
         ON CONFLICT (guild_id, user_id) DO NOTHING`,
        [guildId, userId]
    );
    await ensureLedger(guildId);
    if (!ledgerDB[guildId].participants.includes(userId)) {
        ledgerDB[guildId].participants.push(userId);
    }
}

async function subGuy(guildId, userId) {
    await pool.query(
        `DELETE FROM participants WHERE guild_id = $1 AND user_id = $2`,
        [guildId, userId]
    );
    await pool.query(
        `DELETE FROM ledger WHERE guild_id = $1 AND (creditor_id = $2 OR debtor_id = $2)`,
        [guildId, userId]
    );

    await ensureLedger(guildId);
    ledgerDB[guildId].participants = ledgerDB[guildId].participants.filter(id => id !== userId);
    delete ledgerDB[guildId].ledger[userId];
    for (const creditorId of Object.keys(ledgerDB[guildId].ledger)) {
        delete ledgerDB[guildId].ledger[creditorId].owedBy[userId];
    }
}

async function updateCost(guildId, creditorId, debtorId, amount) {
    await ensureLedger(guildId);
    if (!ledgerDB[guildId].ledger[creditorId]) ledgerDB[guildId].ledger[creditorId] = { owedBy: {} };
    ledgerDB[guildId].ledger[creditorId].owedBy[debtorId] = amount;

    await pool.query(`
        INSERT INTO ledger (guild_id, creditor_id, debtor_id, amount)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (guild_id, creditor_id, debtor_id)
        DO UPDATE SET amount = EXCLUDED.amount
    `, [guildId, creditorId, debtorId, amount]);
}



async function logEvent(guildId, message) {
    await ensureLedger(guildId);
    await pool.query(`INSERT INTO logs (guild_id, message) VALUES ($1, $2)`, [guildId, message]);
    const timestamp = new Date().toISOString();
    ledgerDB[guildId].log.push(`[${timestamp}] ${message}`);
}

setInterval(async () => {
    for (const guildId of Object.keys(ledgerDB)) {
        await loadLedger(guildId);
    }
}, 30_000);

process.on("exit", () => { });
process.on("SIGINT", () => process.exit());
process.on("SIGTERM", () => process.exit());

await initLedger();

export { ledgerDB, logEvent, ensureLedger, addGuy, subGuy, updateCost }