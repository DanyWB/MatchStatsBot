const db = require('../db/connect');

module.exports = async function createMatchCommand(bot) {
  bot.command('create_match', async (ctx) => {
    try {
      if (ctx.session?.role !== 'admin') {
        return ctx.reply('❌ У вас нет доступа к этой команде.');
      }

      const tournaments = await db('tournaments').select('id', 'name');
      if (tournaments.length === 0) {
        return ctx.reply('⚠️ Нет доступных турниров. Сначала создайте турнир.');
      }

      const buttons = tournaments.map(t => [
        { text: t.name, callback_data: `match:tournament:${t.id}` }
      ]);

      ctx.session.scenario = 'create_match';
      ctx.session.temp = {};
      await ctx.reply('🏆 Выберите турнир для матча:', {
        reply_markup: { inline_keyboard: buttons }
      });

    } catch (err) {
      console.error('create_match error:', err);
      ctx.session = null;
      return ctx.reply('❌ Произошла ошибка.');
    }
  });
};
