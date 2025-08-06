

module.exports = async function addStadiumCommand(bot) {
  bot.command('add_stadium', async (ctx) => {
    try {
      if (ctx.session?.role !== 'admin') {
        return ctx.reply('❌ У вас нет доступа к этой команде.');
      }

      ctx.session.await_field = 'stadium_name';
      return ctx.reply('🏟 Введите название стадиона:');
    } catch (error) {
      console.error('add_stadium error:', error);
      ctx.session = null;
      return ctx.reply('❌ Произошла ошибка при запуске команды.');
    }
  });
};
