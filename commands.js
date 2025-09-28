import { REST, SlashCommandBuilder, Routes } from 'discord.js'
import fs from 'fs'
import dotenv from 'dotenv'
import path from "path"
import { fileURLToPath } from "url";
dotenv.config()

const commands = []

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const { default: command } = await import(`file://${filePath}`);
	commands.push(command.data.toJSON())
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// rest.put(Routes.applicationGuildCommands('1023718517784203394', '1412256962284097669'), { body: commands })
// 	.then((data) => console.log(`Successfully registered ${data.length} application commands.`))
// 	.catch(console.error);
rest.put( Routes.applicationCommands(process.env.APPID), { body: commands })
	.then((data) => console.log(`Successfully reloaded ${data.length} application commands.`))
	.catch(console.error);;