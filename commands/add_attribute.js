const db = require('../db/connect');

module.exports = async function addAttributeCommand(bot) {
  bot.command('add_attribute', async (ctx) => {
    try {
      if (ctx.session?.role !== 'admin') {
        return ctx.reply('❌ У вас нет доступа к этой команде.');
      }

      const groups = await db('attribute_groups').select('id', 'name');
      if (groups.length === 0) {
        return ctx.reply('⚠️ Сначала создайте хотя бы одну группу атрибутов.');
      }

      const buttons = groups.map(g => [
        { text: g.name, callback_data: `attr:group:${g.id}` }
      ]);

      await ctx.reply('📂 Выберите группу, в которую добавить атрибут:', {
        reply_markup: { inline_keyboard: buttons },
      });
    } catch (err) {
      console.error('add_attribute error:', err);
      ctx.session = null;
      return ctx.reply('❌ Произошла ошибка при запуске команды.');
    }
  });
};
