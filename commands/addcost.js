import { SlashCommandBuilder } from "discord.js";
import { ledgerDB, logEvent, ensureLedger, updateCost, addGuy } from "../ledger.js";

export default {
    data: new SlashCommandBuilder()
        .setName("addcost")
        .setDescription("you guys owe me this much:")
        .addNumberOption(opt =>
            opt
                .setName("amount")
                .setDescription("monies")
                .setRequired(true))
        .addUserOption(opt =>
            opt
                .setName("guy")
                .setDescription("this guy paid for it")
                .setRequired(false)
        )
        .addUserOption(opt =>
            opt
                .setName("onlyguy")
                .setDescription("only this guy has to pay")
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt
                .setName("description")
                .setDescription("...")
                .setRequired(false)
        ),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        await ensureLedger(guildId)

        const targetUser = interaction.options.getUser("guy") || interaction.user;
        const userId = targetUser.id;
        const amount = interaction.options.getNumber("amount");
        const onlyGuy = interaction.options.getUser("onlyguy")
        const logMsg = interaction.options.getString("description") || "no msg"

        const participants = ledgerDB[guildId].participants

        if (participants.length === 0) return interaction.reply("no one in the house")
        if (!participants.includes(userId)) return interaction.reply("this guy isn't in the house yet")
        if (!participants.includes(interaction.user.id)) return interaction.reply("get in the house first")


        if (amount <= 0) return interaction.reply("amount can't be less than 0")



        if (!ledgerDB[guildId].ledger[userId]) ledgerDB[guildId].ledger[userId] = { owedBy: {} };

        if (onlyGuy) {
            if (!participants.includes(onlyGuy.id)) return interaction.reply("this guy isn't in the house yet")
            if (userId == onlyGuy.id) return interaction.reply("this is the same guy")

            await addGuy(guildId, onlyGuy.id);

            const prev = ledgerDB[guildId].ledger[userId].owedBy[onlyGuy.id] || 0
            await updateCost(guildId, userId, onlyGuy.id, prev + amount)

            await logEvent(guildId, `${interaction.user.username} added $${amount} for ${targetUser.username} to ${onlyGuy.username}: ${logMsg}`)
            return interaction.reply(`${interaction.user.username} added $${amount} for ${targetUser.username} to ${onlyGuy.username}`);
        } else {
            const others = participants.filter(id => id !== userId)
            if (others.length === 0) return interaction.reply("no one other than you in the house");

            const splitAmount = amount / participants.length;
            for (const id of others) {
                await addGuy(guildId, id);

                const prev = ledgerDB[guildId].ledger[userId].owedBy[id] || 0;
                await updateCost(guildId, userId, id, prev + splitAmount);
            }

            await logEvent(guildId, `${interaction.user.username} added $${amount} for ${targetUser.username} to all: ${logMsg}`)
            return interaction.reply(`${interaction.user.username} added $${amount} for ${targetUser.username}, split among ${others.length} other bois in the house for ($${splitAmount} each).`);
        }


    }
};