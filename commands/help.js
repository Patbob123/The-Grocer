import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('bot syntax')
    ,
    async execute(interaction) {
        let x = new EmbedBuilder()
            .setColor(0xb411fa)
            .setTitle("Welcome to Costco where our staff is nowhere this nice!")
            .addFields(
                { name: '/addcost', value: 'Add grocery monies'},
                { name: '/reset', value: 'Set costs back to 0', inline:true},
                { name: '/costs', value: 'Display costs', inline: true},
            )
            .setTimestamp()
        await interaction.reply({ embeds: [x] });
    },
};