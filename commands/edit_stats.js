const db = require('../db/connect');

module.exports = async function editStatsCommand(bot) {
  bot.command('edit_stats', async (ctx) => {
    try {
      if (ctx.session?.role !== 'admin') {
        return ctx.reply('❌ У вас нет доступа к этой команде.');
      }

      const matches = await db('matches')
        .join('teams as t1', 'matches.team1_id', 't1.id')
        .join('teams as t2', 'matches.team2_id', 't2.id')
        .select('matches.id', 'matches.date', 't1.name as team1', 't2.name as team2');

      if (!matches.length) {
        return ctx.reply('⚠️ Нет доступных матчей.');
      }

      const buttons = matches.map(m => [{
        text: `${m.team1} vs ${m.team2} (${m.date.toISOString().split('T')[0]})`,
        callback_data: `editstat:match:${m.id}`,
      }]);

      ctx.session.scenario = 'edit_stats';
      ctx.session.temp = {};
      await ctx.reply('📊 Выберите матч для редактирования статистики:', {
        reply_markup: { inline_keyboard: buttons },
      });

    } catch (err) {
      console.error('edit_stats error:', err);
      ctx.session = null;
      return ctx.reply('❌ Произошла ошибка при запуске команды.');
    }
  });
};
