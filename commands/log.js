import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { ledgerDB, ensureLedger } from "../ledger.js";

export default {
    data: new SlashCommandBuilder()
        .setName("log")
        .setDescription("the digital receipts are here"),

    async execute(interaction) {
        await ensureLedger(interaction.guild.id)

        const guildId = interaction.guild.id;

        if (!ledgerDB[guildId] || !ledgerDB[guildId].log || ledgerDB[guildId].log.length === 0) {
            return interaction.reply("no logs.");
        }

        const x = new EmbedBuilder()
            .setTitle("THE LOG (legendary card 2 elixir)")
            .setColor(0xb411fa)
            .setDescription(ledgerDB[guildId].log.join("\n").slice(-4000)) 
            .setTimestamp();

        await interaction.reply({ embeds: [x] });
    }
};