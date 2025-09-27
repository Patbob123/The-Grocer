import { SlashCommandBuilder } from "discord.js";
import { ledgerDB, logEvent } from "../ledger.js";

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
        const targetUser = interaction.options.getUser("guy") || interaction.user;
        const userId = targetUser.id;
        const amount = interaction.options.getNumber("amount");
        const onlyGuy = interaction.options.getUser("onlyguy")
        const logMsg = interaction.options.getString("description") || "no msg"

        if (!ledgerDB[guildId] || ledgerDB[guildId].participants.length === 0) {
            return interaction.reply("no one in the house");
        }

        if (!ledgerDB[guildId].participants.includes(userId)) {
            return interaction.reply("this guy isnt in the house yet")
        }
        if (!ledgerDB[guildId].participants.includes(interaction.user.id)) {
            return interaction.reply("get in the house first")
        } else if (!ledgerDB[guildId].participants.includes(userId)) {
            return interaction.reply("this guy isnt in the house yet")
        }

        if(amount <= 0){
            return interaction.reply("amount can't be less than 0")
        }


        if (!ledgerDB[guildId].ledger[userId]) ledgerDB[guildId].ledger[userId] = { owedBy: {} };

        if (onlyGuy) {
            if (!ledgerDB[guildId].participants.includes(onlyGuy.id)) {
                return interaction.reply("this guy isnt in the house yet")
            }
            if (!ledgerDB[guildId].ledger[userId].owedBy[onlyGuy.id]) ledgerDB[guildId].ledger[userId].owedBy[onlyGuy.id] = 0;
            ledgerDB[guildId].ledger[userId].owedBy[onlyGuy.id] += amount;
        } else {
            const participants = ledgerDB[guildId].participants.filter(id => id !== userId);
            if (participants.length === 0) return interaction.reply("no one other than you in the house");

            const splitAmount = amount / (participants.length + 1);
            participants.forEach(id => {
                if (!ledgerDB[guildId].ledger[userId].owedBy[id]) ledgerDB[guildId].ledger[userId].owedBy[id] = 0;
                ledgerDB[guildId].ledger[userId].owedBy[id] += splitAmount;
            });
            
            logEvent(guildId, `${interaction.user.username} added $${amount} for ${targetUser.username}: ${logMsg}`)

            await interaction.reply(`${interaction.user.username} added $${amount} for ${targetUser.username}, split among ${participants.length} other bois in the house for ($${splitAmount} each).`);
        }

    }
};