

module.exports = async function addGroupCommand(bot) {
  bot.command('add_group', async (ctx) => {
    try {
      if (ctx.session?.role !== 'admin') {
        return ctx.reply('❌ У вас нет доступа к этой команде.');
      }

      ctx.session.await_field = 'attribute_group_name';
      return ctx.reply('📂 Введите название новой группы атрибутов:');
    } catch (error) {
      console.error('add_group error:', error);
      ctx.session = null;
      return ctx.reply('❌ Произошла ошибка при запуске команды.');
    }
  });
};
