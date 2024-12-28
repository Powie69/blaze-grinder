const mineflayer = require('mineflayer')
const chalk = require('chalk')
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

function countRods(bot) {
	const rods = bot.inventory.count(994); // rods
	// return `${chalk.yellow(rods)} blaze rods found. profit of ${chalk.yellow(rods * 10).toLocaleString()}`
	return `${chalk.yellow((rods).toLocaleString())} blaze rods found. profit of $${chalk.yellow((rods * 10).toLocaleString())}`;
}

async function setup(bot) {
	bot.chat(`/home ${process.env.MC_HOMENAME}`)
	bot.chat('/heal')
	if (!bot.inventory.findItemRange(36,44,843)) {
		console.log('sword not found!');
		return
	};
	bot.setQuickBarSlot(bot.inventory.findItemRange(36,44,843).slot - 36) // sword
	await bot.waitForTicks(4);
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

bot.on('end', () => {setTimeout(() => {startBot()}, process.env.RESTART_DELAY);})

bot.once('spawn', () => {
	console.log(`Bot connected to ${chalk.green(`${process.env.host}:${process.env.port}`)} with username: ${chalk.blue(process.env.MC_NAME)}`);
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
	// console.log(`dead ${target.id}`);
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
		console.log(countRods(bot));
		await sellRods(bot)
		setup(bot) // we might die or get trolled or admins
	}
	console.log(`hits: ${hits}`);
})

} //!

startBot()