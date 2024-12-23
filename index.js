const mineflayer = require('mineflayer')
const inventoryViewer = require('mineflayer-web-inventory')
const radarPlugin = require('mineflayer-radar')(mineflayer);
const messages = require('./js/messages.js')
require('dotenv').config({path: `.env.${process.env.NODE_ENV || 'development'}`})

const bot = mineflayer.createBot({
	host: process.env.HOST,
	port: process.env.PORT,
	version: process.env.MC_VERSION,
	username: process.env.MC_NAME,
	brand: process.env.MC_BRAND
})

inventoryViewer(bot, {
	port: 2500,
	startOnLoad: false,
})

radarPlugin(bot, {
	port:2510
});

let isAttacking = false, isSelling = false; // Flag to prevent overlapping calls
let spawned = false;
let killed = 0;
let ticks = 0
let hits = 0;
let target = undefined, dead = undefined;

async function attackBlaze(entity) {
	if (!entity) return;
	isAttacking = true;

	await bot.lookAt(entity.position.offset(0, 0.8, 0), true);
	if (bot.entityAtCursor(4.5) === null && bot.entity.position.distanceTo(entity.position) >= 1) {isAttacking = false; return};

	bot.attack(entity);
	hits++
	isAttacking = false;
}

async function sellRods() {
	if (!bot.inventory.findItemRange(36,44,994)) {
		console.log('blaze not found!');
		return
	};
	bot.setQuickBarSlot(bot.inventory.findItemRange(36,44,994).slot - 35) // blaze
	console.log(`d: ${bot.inventory.findItemRange(36,44,994).slot - 35}`);
	console.log(`blaze slot: ${bot.inventory.findItemRange(36,44,994).slot - 35}`);
	
	await bot.waitForTicks(4)
	// bot.chat('/sell handall')
	bot.chat('sold!')
	
	await bot.waitForTicks(4)
	if (!bot.inventory.findItemRange(36,44,843)) {
		console.log('sword not found!');
		return
	};
	console.log(`sword: ${bot.inventory.findItemRange(36,44,843).slot - 35}`);
	console.log(`sword slot: ${bot.inventory.findItemRange(36,44,843).slot - 35}`);
	bot.setQuickBarSlot(bot.inventory.findItemRange(36,44,843).slot - 35) // sword
	
	// console.log(`blaze rod ${ bot.inventory.findItemRange(36,44,994).slot - 35}`);
	isSelling = false;
	
}

async function setup() {
	
}

bot.once('spawn', () => {
	console.log('hello');
	bot.chat(`/login ${process.env.LOGIN_PASSWORD}`)
	bot.webInventory.start();
	bot.mcData = require('minecraft-data')(bot.version)
	spawned = true;
})

bot.on('kicked', (e) => {
	console.log(e);
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
	console.log(ticks);
	if (ticks < 12 || isAttacking) {
		ticks++
		return
	}

	target = bot.nearestEntity(entity => entity.name === 'blaze' && bot.entity.position.distanceTo(entity.position) <= 4.5 && entity.id !== dead)
	attackBlaze(target)
	ticks = 0;
	if (hits % 5 === 0) {
		// bot.chat('/heal')
		await sellRods()
		console.log("/healed");
	}
	console.log(`hits: ${hits}`);
})

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