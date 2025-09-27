import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { ledgerDB } from "../ledger.js";

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
        const showAll = interaction.options.getBoolean("all") || false

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

            for (const [userId, data] of Object.entries(ledgerDB[guildId].ledger)) {
                const user = await interaction.client.users.fetch(userId);
                const owes = Object.entries(ledgerDB[guildId].ledger)
                    .filter(([otherId, otherData]) => otherData.owedBy[userId])
                    .map(([otherId, otherData]) => {
                        const amount = otherData.owedBy[userId];
                        return `<@${otherId}>: $${amount.toFixed(2)}`;
                    });
                console.log(user)
                x.addFields({ name: user.username + " owes", value: owes.join("\n") || "owes nothing" });
            }
        } else {
            const userId = interaction.user.id;
            const owes = Object.entries(ledgerDB[guildId].ledger)
                .filter(([otherId, otherData]) => otherData.owedBy[userId])
                .map(([otherId, otherData]) => {
                    const amount = otherData.owedBy[userId];
                    return `<@${otherId}>: $${amount.toFixed(2)}`;
                });
            x.addFields({ name: "who you owe", value: `${owes.length} guy: \n` + (owes.length ? owes.join("\n") : "you are debt free.") });
        }

        await interaction.reply({ embeds: [x] });
    },
};