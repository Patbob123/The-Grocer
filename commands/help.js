import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('hopefully this is clear')
    ,
    async execute(interaction) {
        let x = new EmbedBuilder()
            .setColor(0xb411fa)
            .setTitle("Welcome to Costco where our staff is nowhere this nice!")
            .addFields(
                { 
                    name: '/addcost', 
                    value: 
                    `**amount** [number](required): amount of money 
                    **guy** [@user](optional): who paid, yourself if left empty 
                    **otherguy** [@user](optional): who is paying, split among everyone if left empty
                    **description** [string](optional): some text`
                },
                { 
                    name: '/subcost', 
                    value: 
                    `**guy** [@user](required): who you paid to 
                    **amount** [number]](optional): how much you paid, all of if left empty 
                    **description** [string](optional): some text`
                },
                { 
                    name: '/addguy', 
                    value: 
                    `**guy** [@user](required): add this guy to the house, to be included in costs`
                },
                { 
                    name: '/removeguy', 
                    value: 
                    `**guy** [@user](required): remove this guy to the house, to be excluded in costs`
                },
                { 
                    name: '/status', 
                    value: 
                    `**all** [boolean](optional): show debts of everyone, just yourself if left empty`
                },
                { 
                    name: '/log', 
                    value: 'display log of all transactions'
                },
            )
            .setTimestamp()
        await interaction.reply({ embeds: [x] });
    },
};