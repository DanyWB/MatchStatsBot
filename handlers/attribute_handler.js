const db = require('../db/connect');
const attributeGroupService = require('../services/attributeGroupService');

module.exports = async function attributeHandler(bot) {
  bot.callbackQuery(/^attr:group:(\d+)$/, async (ctx) => {
    try {
      const group = await attributeGroupService.findGroup(Number(ctx.match[1]))

      if (!group) {
        return ctx.answerCallbackQuery({ text: 'Группа не найдена', show_alert: true });
      }
      ctx.session.temp = { group_id: Number(ctx.match[1]) };
      ctx.session.await_field = 'attribute_name';

      await ctx.answerCallbackQuery();
      await ctx.editMessageText(`✏️ Введите название атрибута для группы "${group.name}":`);
    } catch (err) {
      console.error('attr:group callback error:', err);
      ctx.session = null;
      return ctx.reply('❌ Произошла ошибка при выборе группы.');
    }
  });

  bot.callbackQuery(/^attr_type:(double|triple)$/, async (ctx) => {
    const { group_id, name } = ctx.session.temp;
    const type = ctx.match[1];


    if (!group_id || name.length < 2) {
      ctx.session = null;
      return ctx.reply('❌ Неверные данные. Попробуйте снова.');
    }

    try {
      await require('../services/attributeService').createAttribute(group_id, name,type);
  
      ctx.session.scenario = null;
      ctx.session.temp = null;
      ctx.session.await_field = null;
  
      await ctx.answerCallbackQuery();
      return ctx.reply('✅ Атрибут успешно создан.');
    } catch (err) {
      console.error('attr_type callback error:', err);
      ctx.session.await_field = null;
    ctx.session.temp = null;
      return ctx.reply('❌ Ошибка при сохранении атрибута.');
    }
  });
  
};

