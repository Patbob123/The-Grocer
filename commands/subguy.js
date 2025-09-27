import { SlashCommandBuilder } from 'discord.js'
import { ledgerDB } from "../ledger.js";

export default {
    data: new SlashCommandBuilder()
        .setName("removeguy")
        .setDescription("kick this guy from the house")
        .addUserOption(opt =>
            opt
                .setName("guy")
                .setDescription("guy to remove")
                .setRequired(true)
        ),
    async execute(interaction) {
        const guildId = interaction.guild.id
        const targetUser = interaction.options.getUser("guy")
        const userId = targetUser.id


        if (!ledgerDB[guildId]) ledgerDB[guildId] = { participants: [], ledger: {} };

        if (ledgerDB[guildId].participants.includes(userId)) {
            ledgerDB[guildId].participants.remove(userId)
            if (!ledgerDB[guildId].ledger[userId]) ledgerDB[guildId].ledger[userId] = { owedBy: {} };

            await interaction.reply(`${targetUser.username} is now on the streets.`);
        } else {
            await interaction.reply(`${targetUser.username} is ALREADY OUTTA THE HOUSE.`);
        }
    }
};