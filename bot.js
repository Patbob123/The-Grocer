import { Client, Collection, GatewayIntentBits, ActivityType } from 'discord.js'
import fs from 'fs'
import dotenv from 'dotenv'
import path from "path"
import { fileURLToPath } from "url";
dotenv.config()

import express from "express"; //dummy server for render
const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening for nothing`));
//require('dotenv').config()
//const path = require('path')
//const fs = require('fs')
//const { Player, QueryType, PlayerInitOptions } = require("discord-player");
//const { YouTubeExtractor, BridgeProvider, BridgeSource } = require('@discord-player/extractor');


const client = new Client({
	presence: {
		status: 'online',
		afk: false,
		activities: [{
			name: "Costcodle",
			type: ActivityType.Playing
		}],
	},
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessageTyping,
	]
});

client.on("message", async (message) => {
	console.log(message)
})

//=============COMMANDS=================

client.commands = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file)
	const { default: command } = await import(`file://${filePath}`);
	//console.log(command)
	client.commands.set(command.data.name, command)
}

//=============EVENTS=================

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = await import(`file://${filePath}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args))
	} else {
		client.on(event.name, (...args) => event.execute(...args))
	}
}

//=============INIT=================

client.on('interactionCreate', async interaction => {
	if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
	else if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
		}
	}


});


client.login(process.env.TOKEN)