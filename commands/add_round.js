const db = require('../db/connect');

module.exports = async function addRoundCommand(bot) {
  bot.command('add_round', async (ctx) => {
    try {
      if (ctx.session?.role !== 'admin') {
        return ctx.reply('❌ У вас нет доступа к этой команде.');
      }

      const tournaments = await db('tournaments').select('id', 'name');
      if (tournaments.length === 0) {
        return ctx.reply('⚠️ Сначала создайте хотя бы один турнир.');
      }

      const buttons = tournaments.map(t =>
        [{ text: t.name, callback_data: `round:tournament:${t.id}` }]
      );

      await ctx.reply('🏆 Выберите турнир для нового тура:', {
        reply_markup: { inline_keyboard: buttons },
      });

    } catch (error) {
      console.error('add_round error:', error);
      ctx.session = null;
      return ctx.reply('❌ Произошла ошибка при запуске команды.');
    }
  });
};
