import { SlashCommandBuilder } from 'discord.js'
import { ledgerDB, ensureLedger, subGuy } from "../ledger.js";

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

        try {
            await ensureLedger(guildId);

            if (!ledgerDB[guildId].participants.includes(userId)) {
                return await interaction.reply(`${targetUser.username} is ALREADY OUTTA THE HOUSE.`);
            }
            await subGuy(guildId, userId);

            await interaction.reply(`${targetUser.username} is now on the streets.`);
        } catch (err) {
            console.error("database died");
            await interaction.reply("database died, check console");
        }
    }
};