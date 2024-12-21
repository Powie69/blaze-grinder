const mineflayer = require('mineflayer')
const inventoryViewer = require('mineflayer-web-inventory')
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


let spawned = false;
let killed = 0;
let ticks = 0
let hits = 0;
let target = undefined, dead = undefined;

// function lookAtBlaze(targetPosition) {
// 	const dx = targetPosition.x - bot.entity.position.x;
// 	const dy = targetPosition.y - bot.entity.position.y;
// 	const dz = targetPosition.z - bot.entity.position.z;
  
// 	bot.entity.yaw  = Math.atan2(-dx, dz);
// 	bot.entity.pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
// }

function attackBlaze(entity) {
	if (!entity) return;
	// console.log(entity);
	// lookAtBlaze(entity.position.offset(0, 0.8, 0))
	// if (entity.id !== target.id) return;
	bot.lookAt(entity.position.offset(0, 0.8, 0),true)
	if (bot.entityAtCursor(4.5) === null && bot.entity.position.distanceTo(entity.position) >= 1) return; // dont attack if its behind block
	bot.attack(entity)
	console.log('hit!');
}

bot.once('spawn', () => {
	console.log('hello');
	bot.chat(`/login ${process.env.LOGIN_PASSWORD}`)
	bot.webInventory.start();
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

bot.on('physicTick', () => {
	console.log(ticks);
	if (ticks < 12) {
		ticks++
		return
	}
	target = bot.nearestEntity(entity => entity.name === 'blaze' && bot.entity.position.distanceTo(entity.position) <= 4.5 && entity.id !== dead)
	// console.log(target.health);
	attackBlaze(target)
	ticks = 0;
	if (hits % 1000 === 0) {
		bot.chat('/heal')
		console.log("/healed");
	}
	hits++
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