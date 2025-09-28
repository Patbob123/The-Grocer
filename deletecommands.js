import dotenv from 'dotenv'
import { REST, Routes } from 'discord.js'
dotenv.config()

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

rest.put(Routes.applicationGuildCommands(process.env.APPID, '1412256962284097669'), { body: [] })
	.then((data) => console.log(`DELETED GUILD COMMANDS`))
	.catch(console.error);
// rest.put( Routes.applicationCommands(process.env.APPID), { body: [] })
// 	.then((data) => console.log(`DELETED GLOBAL COMMANDS`))
// 	.catch(console.error);