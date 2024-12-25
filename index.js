const mineflayer = require('mineflayer')
const inventoryViewer = require('mineflayer-web-inventory')
const radarPlugin = require('mineflayer-radar')(mineflayer);
const commands = require('./js/commands.js');
const messages = require('./js/messages.js');
require('dotenv').config({path: `.env.${process.env.NODE_ENV || 'development'}`})

let isAttacking = false, spawned = false;
let killed=0,ticks=0,hits=0;
let target = undefined, dead = undefined;

async function attackBlaze(bot ,entity) {
	if (!entity) return;
	isAttacking = true;

	await bot.lookAt(entity.position.offset(0, 0.8, 0), true);
	if (bot.entityAtCursor(4.5) === null && bot.entity.position.distanceTo(entity.position) >= 1) {isAttacking = false; return};

	bot.attack(entity);
	hits++
	isAttacking = false;
}

async function sellRods(bot) {
	if (!bot.inventory.findItemRange(36,44,994)) {
		console.log('blaze not found!');
		return
	};
	bot.setQuickBarSlot(bot.inventory.findItemRange(36,44,994).slot - 36) // blaze
	console.log(`blaze slot: ${bot.inventory.findItemRange(36,44,994).slot - 36}`);
	
	await bot.waitForTicks(4)
	bot.chat('/sell handall')
	console.log('sold!');
	
	await bot.waitForTicks(4)
	if (!bot.inventory.findItemRange(36,44,843)) {
		console.log('sword not found!');
		return
	};
	console.log(`sword slot: ${bot.inventory.findItemRange(36,44,843).slot - 36}`);
	bot.setQuickBarSlot(bot.inventory.findItemRange(36,44,843).slot - 36) // sword
}

async function setup(bot) {
	bot.chat(`/home ${process.env.MC_HOMENAME}`)
	bot.chat('/heal')
	if (!bot.inventory.findItemRange(36,44,843)) {
		console.log('sword not found!');
		return
	};
	bot.setQuickBarSlot(bot.inventory.findItemRange(36,44,843).slot - 36) // sword
	bot.chat('/fix')
}
async function startBot() { //! i dont wanna indent ok?
	
const bot = mineflayer.createBot({
	host: process.env.HOST,
	port: process.env.PORT,
	version: process.env.MC_VERSION,
	username: process.env.MC_NAME,
	brand: process.env.MC_BRAND
})
	
try {
	// inventoryViewer(bot, {
	// 	port: 2500,
	// 	startOnLoad: false,
	// })
	radarPlugin(bot, {
		port:2510
	});
} catch (err) {
	console.log(err);	
}

console.log();

bot.on('end', () => {setTimeout(() => {startBot()}, process.env.RESTART_DELAY);})

bot.once('spawn', () => {
	console.log('hello');
	bot.chat(`/login ${process.env.LOGIN_PASSWORD}`)
	bot.mcData = require('minecraft-data')(bot.version)
	setup(bot)
	spawned = true;
})

bot.on('kicked', (e) => {
	console.log(e);
	setTimeout(() => {startBot()}, process.env.RESTART_DELAY);
})

bot.on('entityDead', (entity) => {
	if (!entity || !target) return;
	if (entity.name !== 'blaze') return;
	killed++
	if (entity.id !== target.id) return; // dont bother with other dead entities
	console.log(`dead ${target.id}`);
	console.log(`killed: ${killed}`);
	dead = entity.id;
	target = null;
})

bot.on('physicTick', async () => {
	// console.log(ticks);
	if (isAttacking) return;
	if (ticks < 12) {
		ticks++
		return
	}

	target = bot.nearestEntity(entity => entity.name === 'blaze' && bot.entity.position.distanceTo(entity.position) <= 4.5 && entity.id !== dead)
	attackBlaze(bot, target)
	ticks = 0;
	if (hits % process.env.MC_INCREMENT === 0 && hits !== 0) {
		await sellRods(bot)
		setup() // we might die or get trolled or admins
		console.log("/healed");
	}
	console.log(`hits: ${hits}`);
})

} //!


startBot()
// bot.on('chat', (username, message, translate, jsonMsg) => {
// 	console.log(jsonMsg);
// 	console.log("message: " + message);
// 	console.log("username: " + username);
// 	console.log("1 ddddddddddddd");
// 	if (username === bot.username) return;
// 	console.log("2 dddddddd");
// 	console.log(username);
// 	if (!process.env.MC_COMMAND_OWNER.split(',').includes(username)) return;
// 	console.log("3 dddddddd");
// 	if (!message.startsWith(process.env.MC_COMMAND_PREFIX)) return;
// 	console.log("4 dddddddd");

// 	const args = message.split(" ");
// 	const command = args[0].substring(prefix.length)

// 	console.log(args);
// 	console.log(command);

// 	if (commands[command]) {
//         commands[command](bot, username, args); // Pass bot, username, and args
//     } else {
// 		console.log(`unkown command: ${command}`);
//     }
// })
// bot.on('playerJoined', (player) => {
// 	if (!spawned) return;
// 	if (player.username === process.env.MC_NAME) return;
// 	if (Date.now() - messageCooldownTime < process.env.MESSAGE_COOLDOWN) return;

// 	messageCooldownTime = Date.now()
// 	console.log( messages.joinMessages[Math.floor(Math.random() * messages.joinMessages.length)].replace(/{USERNAME}/g,player.username) );
// 	bot.chat(messages.joinMessages[Math.floor(Math.random() * messages.joinMessages.length)].replace(/{USERNAME}/g,player.username))
// })

// bot.on('playerLeft', (player) => {
// 	if (Date.now() - messageCooldownTime < process.env.MESSAGE_COOLDOWN) return;

// 	messageCooldownTime = Date.now()
// 	console.log( messages.leaveMessages[Math.floor(Math.random() * messages.leaveMessages.length)].replace(/{USERNAME}/g,player.username) );
// 	bot.chat(messages.leaveMessages[Math.floor(Math.random() * messages.leaveMessages.length)].replace(/{USERNAME}/g,player.username))
// })