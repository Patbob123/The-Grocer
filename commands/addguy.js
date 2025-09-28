import { SlashCommandBuilder } from 'discord.js'
import { ledgerDB, ensureLedger, addGuy } from "../ledger.js";

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

        try {
            await ensureLedger(guildId);

            if (ledgerDB[guildId].participants.includes(userId)) {
                return await interaction.reply(`${targetUser.username} is ALREADY IN THE HOUSE.`);
            }
            await addGuy(guildId, userId);

            await interaction.reply(`${targetUser.username} is now in the house.`);
        } catch (err) {
            console.error("database died");
            await interaction.reply("database died, check console");
        }
    }
};