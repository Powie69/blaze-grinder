const mineflayer = require('mineflayer');
const radarPlugin = require('mineflayer-radar')(mineflayer);
const inventoryViewer = require('mineflayer-web-inventory');
const chalk = require('chalk');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

class BlazeBot {
	constructor() {
		this.bot = null;
		this.isAttacking = false;
		this.spawned = false;
		this.killed = 0;
		this.ticks = 0;
		this.hits = 0;
		this.target = null;
		this.dead = null;

		this.startBot();
	}

	startBot() {
		this.bot = mineflayer.createBot({
			host: process.env.HOST,
			port: process.env.PORT,
			version: process.env.MC_VERSION,
			username: process.env.MC_NAME,
			brand: process.env.MC_BRAND
		});

		radarPlugin(this.bot, { host: '0.0.0.0', port: 6969 });
		inventoryViewer(this.bot, { port: 6069, });

		this.bot.once('spawn', () => this.onSpawn());
		this.bot.on('end', () => this.restartBot());
		this.bot.on('kicked', (reason) => this.onKicked(reason));
		this.bot.on('entityDead', (entity) => this.onEntityDead(entity));
		this.bot.on('physicTick', () => this.onPhysicTick());
	}

	onSpawn() {
		console.log(`Bot connected to ${chalk.green(`${process.env.HOST}:${process.env.PORT}`)} as ${chalk.blue(process.env.MC_NAME)}`);
		this.bot.chat(`/login ${process.env.LOGIN_PASSWORD}`);
		this.bot.mcData = require('minecraft-data')(this.bot.version);
		this.setup();
		this.spawned = true;
	}

	async setup() {
		this.bot.chat(`/home ${process.env.MC_HOMENAME}`);
		this.bot.chat('/heal');

		const swordItem = this.bot.inventory.findItemRange(36, 44, 843);
		if (!swordItem) {
			console.log('Sword not found!');
			return;
		}

		this.bot.setQuickBarSlot(swordItem.slot - 36);
		await this.bot.waitForTicks(4);
		this.bot.chat('/fix');
	}

	async attackBlaze(entity) {
		if (!entity) return;
		this.isAttacking = true;

		await this.bot.lookAt(entity.position.offset(0, 0.8, 0), true);

		// Ensure bot is within attack range
		if (!this.bot.entityAtCursor(4.5) && this.bot.entity.position.distanceTo(entity.position) >= 1) {
			this.isAttacking = false;
			return;
		}

		this.bot.attack(entity);
		this.hits++;
		this.isAttacking = false;
	}

	async sellRods() {
		const rodItem = this.bot.inventory.findItemRange(36, 44, 994);
		if (!rodItem) {
			console.log('No blaze rods found!');
			return;
		}

		this.bot.setQuickBarSlot(rodItem.slot - 36);
		console.log(`Switching to Blaze Rod Slot: ${rodItem.slot - 36}`);

		await this.bot.waitForTicks(4);
		this.bot.chat('/sell handall');
		console.log('Blaze rods sold!');

		await this.bot.waitForTicks(4);

		const swordItem = this.bot.inventory.findItemRange(36, 44, 843);
		if (!swordItem) {
			console.log('Sword not found!');
			return;
		}

		console.log(`Switching to Sword Slot: ${swordItem.slot - 36}`);
		this.bot.setQuickBarSlot(swordItem.slot - 36);
	}

	countRods() {
		const rods = this.bot.inventory.count(994);
		return `${chalk.yellow(rods.toLocaleString())} blaze rods found. Profit: $${chalk.yellow((rods * 10).toLocaleString())}`;
	}

	onKicked(reason) {
		console.log(`Bot kicked: ${reason}`);
		this.restartBot();
	}

	onEntityDead(entity) {
		if (!entity || !this.target || entity.name !== 'blaze' || entity.id !== this.target.id) return;
		this.killed++;
		console.log(`Blazes killed: ${this.killed}`);
		this.dead = entity.id;
		this.target = null;
	}

	async onPhysicTick() {
		if (this.isAttacking) return;
		if (++this.ticks < 12) return;

		this.target = this.bot.nearestEntity(entity => entity.name === 'blaze' && this.bot.entity.position.distanceTo(entity.position) <= 4.5 && entity.id !== this.dead);
		this.attackBlaze(this.target);
		this.ticks = 0;

		if (this.hits % process.env.MC_INCREMENT === 0 && this.hits !== 0) {
			console.log(this.countRods());
			await this.sellRods();
			this.setup();
		}

		console.log(`Hits: ${this.hits}`);
	}

	restartBot() {
		console.log('Bot disconnected. Restarting...');
		setTimeout(() => new BlazeBot(), process.env.RESTART_DELAY);
	}
}

new BlazeBot();