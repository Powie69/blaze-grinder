function sendPrivateMessage(bot, username, message) {
    bot.chat(`/msg ${username} ${message}`);
}

module.exports = {
    ping: (bot) => {
        bot.chat('Pong!');
    },
    greet: (bot, username, args) => {
        const name = args[0] || username; // Use first argument or sender's username
        bot.chat(`Hello, ${name}!`);
    },
    help: (bot) => {
        bot.chat('Available commands: ping, greet [name], help');
    }
};