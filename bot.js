require('dotenv').config();
const { Bot } = require('grammy');
const fs = require('fs');
const path = require('path');
const knex = require('./db/connect'); // Экземпляр knex для всех сервисов
const sessionMiddleware = require('./middlewares/session');
const messageHandler = require('./handlers/message_handler');
// Инициализация бота
const bot = new Bot(process.env.BOT_TOKEN);

// midlleware
bot.use(sessionMiddleware);

// Загрузка хендлеров
require('./handlers')(bot, knex);
// Загружаем все команды из папки commands/
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath)
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    const command = require(path.join(commandsPath, file));
    // Каждый командный модуль экспортирует функцию (bot, knex) => void
    if (typeof command === 'function') {
      command(bot, knex);
    }
  });

// ----

messageHandler(bot);
// Обработка глобальных ошибок в боте
bot.catch((err) => {
  console.error('Bot error:', err);
});
(async () => {
  bot.start().then(() => console.log("🤖 Бот запущен и ожидает команды..."));
})();
