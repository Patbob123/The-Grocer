import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { ledgerDB, ensureLedger } from "../ledger.js";

export default {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('costs overview')
        .addBooleanOption(opt =>
            opt
                .setName("all")
                .setDescription("set true to show everyone's stats")
                .setRequired(false)
        )
    ,
    async execute(interaction) {
        const guildId = interaction.guild.id
        await ensureLedger(guildId)

        const showAll = interaction.options.getBoolean("all") || false

        console.log(ledgerDB[guildId])
        console.log(ledgerDB[guildId].participants.length === 0)

        if (!ledgerDB[guildId] || ledgerDB[guildId].participants.length === 0) {
            return interaction.reply("no one in the house");
        }

        let x = new EmbedBuilder()
            .setColor(0xb411fa)
            .setTitle("THE DEBTS")
            .setTimestamp()

        if (showAll) {
            x.addFields({
                name: "Bois in the house:",
                value: ledgerDB[guildId].participants
                    .map(id => `<@${id}>`)
                    .join("\n"),
                inline: false
            });
            for (const userId of ledgerDB[guildId].participants) {
                const owes = [];
                for (const [creditorId, data] of Object.entries(ledgerDB[guildId].ledger)) {
                    if (data.owedBy[userId] && data.owedBy[userId] > 0) {
                        owes.push(`<@${creditorId}>: $${data.owedBy[userId].toFixed(2)}`);
                    }
                }
                const user = await interaction.client.users.fetch(userId).catch(() => ({ username: "Unknown" }));
                x.addFields({ name: `${user.username} owes`, value: owes.length ? owes.join("\n") : "owes nothing" });
            }
        } else {
            const userId = interaction.user.id;
            const owes = [];

            for (const [creditorId, data] of Object.entries(ledgerDB[guildId].ledger)) {
                if (data.owedBy[userId] && data.owedBy[userId] > 0) {
                    owes.push(`<@${creditorId}>: $${data.owedBy[userId].toFixed(2)}`);
                }
            }
            x.addFields({ name: "who you owe", value: `${owes.length} guy: \n` + (owes.length ? owes.join("\n") : "you are debt free.") });
        }

        await interaction.reply({ embeds: [x] });
    },
};