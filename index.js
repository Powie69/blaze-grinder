const mineflayer = require('mineflayer')
require('dotenv').config()

const bot = mineflayer.createBot({
	host: process.env.HOST,
	port: process.env.PORT,
	username: process.env.MC_NAME
})

bot.once('spawn', () => {
	console.log('hello');
	bot.chat("heelo world!")
	bot.chat(`/login ${process.env.LOGIN_PASSWORD}`)
})

let ticks, hits = 0;
let target, dead = undefined;

function attackBlaze(entity) {
	if (!entity) return;
	// console.log(entity);
	bot.lookAt(entity.position.offset(0, 0.8, 0),true)
	if (bot.entityAtCursor() === null && bot.entity.position.distanceTo(entity.position) >= 0.5) return; // dont attack if its behind block
	bot.attack(entity)
}


bot.on('entityDead', (entity) => {
	if (entity !== target) return; // dont bother with other dead entities
	dead = entity.id
})

bot.on('physicTick', () => {
	if (ticks < 12) {
		ticks++
		return
	}
	target = bot.nearestEntity(entity => entity.name === 'blaze' && bot.entity.position.distanceTo(entity.position) <= 3.5 && entity.id !== dead)
	attackBlaze(target)
	ticks = 0;
	if (hits <= 200) {
		
	}
	hits++
})

