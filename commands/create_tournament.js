

module.exports = async function createTournamentCommand(bot) {
  bot.command('create_tournament', async (ctx) => {
    try {
      const userRole = ctx.session?.role;
      if (userRole !== 'admin') {
        return ctx.reply('❌ У вас нет доступа к этой команде.');
      }

      ctx.session.await_field = 'tournament_name';
      return ctx.reply('📝 Введите название турнира:');
    } catch (error) {
      console.error('create_tournament error:', error);
      ctx.session = null;
      return ctx.reply('❌ Произошла ошибка при запуске команды.');
    }
  });
};
