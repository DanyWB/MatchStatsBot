

module.exports = async function addTeamCommand(bot) {
  bot.command('add_team', async (ctx) => {
    try {
      if (ctx.session?.role !== 'admin') {
        return ctx.reply('❌ У вас нет доступа к этой команде.');
      }

      ctx.session.await_field = 'team_name';
      return ctx.reply('⚽ Введите название команды:');
    } catch (error) {
      console.error('add_team error:', error);
      ctx.session = null;
      return ctx.reply('❌ Произошла ошибка при запуске команды.');
    }
  });
};
