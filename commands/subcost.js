import { SlashCommandBuilder } from "discord.js";
import { ledgerDB, logEvent, ensureLedger, updateCost } from "../ledger.js";

export default {
    data: new SlashCommandBuilder()
        .setName("subcost")
        .setDescription("no longer owes this much:")
        .addUserOption(opt =>
            opt
                .setName("guy")
                .setDescription("pay back to this guy")
                .setRequired(true)
        )
        .addNumberOption(opt =>
            opt
                .setName("amount")
                .setDescription("monies (all of it if left out)")
                .setRequired(false))
        .addStringOption(opt =>
            opt
                .setName("description")
                .setDescription("...")
                .setRequired(false)
        )
    ,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        await ensureLedger(guildId)

        const targetUser = interaction.options.getUser("guy")
        const userId = targetUser.id;
        const amount = interaction.options.getNumber("amount") || ledgerDB[guildId].ledger[userId].owedBy[interaction.user.id]
        const logMsg = interaction.options.getString("description") || "no msg"

        if (userId == interaction.user.id) return interaction.reply("cant sub cost from the same guy");

        if (!ledgerDB[guildId] || ledgerDB[guildId].participants.length === 0) return interaction.reply("no one in the house");


        if (!ledgerDB[guildId].participants.includes(interaction.user.id)) return interaction.reply("get in the house first")
        if (!ledgerDB[guildId].participants.includes(userId)) return interaction.reply("this guy isnt in the house yet")


        if (amount <= 0) return interaction.reply("amount can't be less than 0")

        if (amount > ledgerDB[guildId].ledger[userId].owedBy[interaction.user.id]) return interaction.reply("you don't owe that much")
        

        if (!ledgerDB[guildId].ledger[userId]) ledgerDB[guildId].ledger[userId] = { owedBy: {} }
        if (!ledgerDB[guildId].ledger[userId].owedBy[interaction.user.id]) ledgerDB[guildId].ledger[userId].owedBy[interaction.user.id] = 0

        const newAmount = ledgerDB[guildId].ledger[userId].owedBy[interaction.user.id] - amount;
        await updateCost(guildId, userId, interaction.user.id, newAmount);

        await logEvent(guildId, `${interaction.user.username} subtracted $${amount} from ${targetUser.username}: ${logMsg}`)

        await interaction.reply(`${interaction.user.username} no longer owes ${targetUser.username} $${amount}.`);


    }
};