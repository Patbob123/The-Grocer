import { SlashCommandBuilder } from 'discord.js'
import { ledgerDB } from "../ledger.js";

export default {
    data: new SlashCommandBuilder()
        .setName("addguy")
        .setDescription("add a guy to the house")
        .addUserOption(opt =>
            opt
                .setName("guy")
                .setDescription("guy to add")
                .setRequired(true)
        ),
    async execute(interaction) {
        const guildId = interaction.guild.id
        const targetUser = interaction.options.getUser("guy")
        const userId = targetUser.id


        if (!ledgerDB[guildId]) ledgerDB[guildId] = { participants: [], ledger: {} };

        if (!ledgerDB[guildId].participants.includes(userId)) {
            ledgerDB[guildId].participants.push(userId);
            if (!ledgerDB[guildId].ledger[userId]) ledgerDB[guildId].ledger[userId] = { owedBy: {} };

            await interaction.reply(`${targetUser.username} is now in the house.`);
        } else {
            await interaction.reply(`${targetUser.username} is ALREADY IN THE HOUSE.`);
        }
    }
};