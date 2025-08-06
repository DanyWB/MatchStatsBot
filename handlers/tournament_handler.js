const db = require('../db/connect');

module.exports = function tournamentHandler(bot) {
  bot.callbackQuery(/^round:tournament:(\d+)$/, async (ctx) => {
    try {
      const tournamentId = Number(ctx.match[1]);

      const tournament = await db('tournaments').where({ id: tournamentId }).first();
      if (!tournament) {
        return ctx.answerCallbackQuery({ text: '❌ Турнир не найден', show_alert: true });
      }

      ctx.session.temp = { tournament_id: tournamentId };
      ctx.session.await_field = 'round_number';

      await ctx.answerCallbackQuery();
      await ctx.editMessageText(`🔢 Введите номер тура для турнира "${tournament.name}":`);
    } catch (err) {
      console.error('❌ Ошибка в round:tournament:', err);
      ctx.session = null;
      return ctx.reply('❌ Произошла ошибка при выборе турнира.');
    }
  });
};
