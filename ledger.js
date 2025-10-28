// import pkg from "pg";
// const { Pool } = pkg;

// const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//     ssl: { rejectUnauthorized: false },
// });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

let ledgerDB = {};


// async function initLedger() {
//     const tableSQL = [
//         `CREATE TABLE IF NOT EXISTS participants (
//             guild_id TEXT NOT NULL,
//             user_id TEXT NOT NULL,
//             PRIMARY KEY (guild_id, user_id)
//         );`,
//         `CREATE TABLE IF NOT EXISTS ledger (
//             guild_id TEXT NOT NULL,
//             creditor_id TEXT NOT NULL,
//             debtor_id TEXT NOT NULL,
//             amount NUMERIC DEFAULT 0,
//             PRIMARY KEY (guild_id, creditor_id, debtor_id)
//         );`,
//         `CREATE TABLE IF NOT EXISTS logs (
//             id SERIAL PRIMARY KEY,
//             guild_id TEXT NOT NULL,
//             message TEXT NOT NULL,
//             created_at TIMESTAMP DEFAULT NOW()
//         );`
//     ];

//     for (const sql of tableSQL) {
//         const { error } = await supabase.rpc('exec_sql', { sql });
//         if (error && !error.message.includes('already exists')) {
//             console.error("initLedger error:", error);
//         }
//     }

// }

async function loadLedger(guildId) {
    if (!ledgerDB[guildId]) ledgerDB[guildId] = { participants: [], ledger: {}, log: [] };

    const { data: participants } = await supabase
        .from('participants')
        .select('user_id')
        .eq('guild_id', guildId);

    ledgerDB[guildId].participants = participants?.map(r => r.user_id) || [];


    ledgerDB[guildId].ledger = {};
    for (const userId of ledgerDB[guildId].participants) {
        ledgerDB[guildId].ledger[userId] = { owedBy: {} };
    }

    const { data: ledger } = await supabase
        .from('ledger')
        .select('creditor_id, debtor_id, amount')
        .eq('guild_id', guildId);

    if (ledger) {
        for (const row of ledger) {
            if (!ledgerDB[guildId].ledger[row.creditor_id]) {
                ledgerDB[guildId].ledger[row.creditor_id] = { owedBy: {} };
            }
            ledgerDB[guildId].ledger[row.creditor_id].owedBy[row.debtor_id] = parseFloat(row.amount);
        }
    }

    const { data: logs } = await supabase
        .from('logs')
        .select('message, created_at')
        .eq('guild_id', guildId)
        .order('created_at', { ascending: false })
        .limit(50);

    ledgerDB[guildId].log = logs
        ? logs.map(r => `[${new Date(r.created_at).toISOString()}] ${r.message}`)
        : [];
}

async function ensureLedger(guildId) {
    if (!ledgerDB[guildId]) {
        ledgerDB[guildId] = { participants: [], ledger: {}, log: [] };
    }
    await loadLedger(guildId);
}

async function addGuy(guildId, userId) {
    await supabase
        .from('participants')
        .upsert({ guild_id: guildId, user_id: userId });

    await ensureLedger(guildId);
    if (!ledgerDB[guildId].participants.includes(userId)) {
        ledgerDB[guildId].participants.push(userId);
    }
}

async function subGuy(guildId, userId) {
    await supabase.from('participants')
        .delete()
        .match({ guild_id: guildId, user_id: userId });

    await supabase.from('ledger')
        .delete()
        .or(`creditor_id.eq.${userId},debtor_id.eq.${userId}`)
        .eq('guild_id', guildId);

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

    await supabase.from('ledger').upsert({
        guild_id: guildId,
        creditor_id: creditorId,
        debtor_id: debtorId,
        amount
    });
}



async function logEvent(guildId, message) {
    await ensureLedger(guildId);
    await supabase.from('logs').insert({ guild_id: guildId, message });
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

// await initLedger();

export { ledgerDB, logEvent, ensureLedger, addGuy, subGuy, updateCost }