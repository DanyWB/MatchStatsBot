const db = require('../db/connect');
const setCommandsByRole = require('../utils/setCommandsByRole');

module.exports = async function startCommand(bot) {
  bot.command('start', async (ctx) => {
    try {
      const telegramId = ctx.from.id;

      // создаём пользователя, если не существует
      const existing = await db('users').where({ telegram_id: telegramId }).first();
      if (!existing) {
        await db('users').insert({ telegram_id: telegramId, role: 'user' });
      }

      // обновим командный список в зависимости от роли
      const role = existing?.role || 'user';
      await setCommandsByRole(bot, role, telegramId);

      return ctx.reply(
        `👋 Добро пожаловать в бота для управления футбольным турниром!

📌 Доступные команды для администратора:
1. /create_tournament — создать турнир
2. /add_round — добавить тур к турниру
3. /add_team — добавить команду
4. /add_stadium — добавить стадион
5. /add_group — добавить группу атрибутов
6. /add_attribute — добавить атрибут в группу
7. /create_match — создать матч
8. /add_stats — заполнить статистику
9. /edit_stats — редактировать статистику

Вызывайте команды по порядку, как перечислено выше.`
      );
    } catch (err) {
      console.error('/start error:', err);
      ctx.session = null;
      return ctx.reply('❌ Произошла ошибка при старте.');
    }
  });
};
