const db = require('../db/connect');

module.exports = async function statsHandler(bot) {
  bot.callbackQuery(/^stat:match:(\d+)$/, async (ctx) => {
    const match_id = Number(ctx.match[1]);
    ctx.session.temp.match_id = match_id;

    await ctx.answerCallbackQuery();
    await ctx.editMessageText('Выберите режим ввода статистики:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔁 Заполнить все подряд', callback_data: 'stat:mode:all' }],
          [{ text: '🎯 Выбирать вручную', callback_data: 'stat:mode:one' }],
        ]
      }
    });
  });

  bot.callbackQuery('stat:mode:all', async (ctx) => {
    try {
      const attrs = await db('attributes')
        .join('attribute_groups', 'attributes.group_id', 'attribute_groups.id')
        .select(
          'attributes.id',
          'attributes.name',
          'attribute_groups.name as group_name'
        );
  
      if (!attrs.length) {
        return ctx.reply('⚠️ Нет атрибутов для заполнения.');
      }
  
      const match = await db('matches')
        .join('teams as t1', 'matches.team1_id', 't1.id')
        .join('teams as t2', 'matches.team2_id', 't2.id')
        .where('matches.id', ctx.session.temp.match_id)
        .select('t1.name as team1', 't2.name as team2')
        .first();
  
      if (!match) {
        ctx.session = null;
        return ctx.reply('❌ Матч не найден.');
      }
  
      ctx.session.temp.attributes = attrs;
      ctx.session.temp.attr_index = 0;
      ctx.session.temp.mode = 'all';
      ctx.session.temp.team2_name = match.team2;
      ctx.session.await_field = 'stat_value_team1';
  
      const current = attrs[0];
      await ctx.answerCallbackQuery();
  
      return ctx.reply(
        `📊 *${current.group_name} → ${current.name}*\n` +
        `Введите значение для команды *${match.team1}*:`,
        { parse_mode: 'Markdown' }
      );
  
    } catch (err) {
      console.error('stat:mode:all error:', err);
      ctx.session = null;
      return ctx.reply('❌ Ошибка при запуске сценария.');
    }
  });
  
  bot.callbackQuery('stat:mode:one', async (ctx) => {
    const attrs = await db('attributes')
      .join('attribute_groups', 'attributes.group_id', 'attribute_groups.id')
      .select('attributes.id', 'attributes.name', 'attribute_groups.name as group_name');

    if (!attrs.length) {
      return ctx.reply('⚠️ Нет атрибутов для выбора.');
    }

    const buttons = attrs.map(attr => [{
      text: `${attr.group_name} → ${attr.name}`,
      callback_data: `stat:attr:${attr.id}`,
    }]);

    ctx.session.temp.mode = 'one';
    ctx.session.temp.attributes = attrs;
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('Выберите атрибут для заполнения:', {
      reply_markup: { inline_keyboard: buttons },
    });
  });

  bot.callbackQuery(/^stat:attr:(\d+)$/, async (ctx) => {
    try {
      const attr_id = Number(ctx.match[1]);
      ctx.session.temp.current_attr_id = attr_id;
      ctx.session.await_field = 'stat_value_team1';
  
      const attribute = await db('attributes')
        .join('attribute_groups', 'attributes.group_id', 'attribute_groups.id')
        .where('attributes.id', attr_id)
        .select(
          'attributes.name as attr_name',
          'attributes.type',
          'attribute_groups.name as group_name'
        )
        .first();

      const match = await db('matches')
        .join('teams as t1', 'matches.team1_id', 't1.id')
        .join('teams as t2', 'matches.team2_id', 't2.id')
        .where('matches.id', ctx.session.temp.match_id)
        .select('t1.name as team1', 't2.name as team2')
        .first();
  
      if (!attribute || !match) {
        ctx.session = null;
        return ctx.reply('❌ Ошибка: не найдены атрибут или команды.');
      }
  
      // сохраним имя команды 2 для следующего шага
      ctx.session.temp.team2_name = match.team2;
      ctx.session.temp.attr_type = attribute.type; 
      await ctx.answerCallbackQuery();
  
      return ctx.reply(
        `📊 *${attribute.group_name} → ${attribute.attr_name}*\n` +
        `Введите значение для команды *${match.team1}*:`,
        { parse_mode: 'Markdown' }
      );
  
    } catch (err) {
      console.error('❌ stat:attr error:', err);
      ctx.session = null;
      return ctx.reply('❌ Ошибка при выборе атрибута.');
    }
  });
  bot.callbackQuery(/^editstat:match:(\d+)$/, async (ctx) => {
    const match_id = Number(ctx.match[1]);
    ctx.session.temp.match_id = match_id;

    await ctx.answerCallbackQuery();
    await ctx.editMessageText('Выберите режим редактирования:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔁 Редактировать все подряд', callback_data: 'editstat:mode:all' }],
          [{ text: '🎯 Выбирать вручную', callback_data: 'editstat:mode:one' }],
        ]
      }
    });
  });

  bot.callbackQuery('editstat:mode:all', async (ctx) => {
    try {
      const match_id = ctx.session.temp.match_id;
  
      const attributes = await db('attributes')
        .join('attribute_groups', 'attributes.group_id', 'attribute_groups.id')
        .select('attributes.id', 'attributes.name', 'attribute_groups.name as group_name');
  
      const stats = await db('match_stats')
        .where({ match_id })
        .select('attribute_id', 'value_team1', 'value_team2');
  
      const match = await db('matches')
        .join('teams as t1', 'matches.team1_id', 't1.id')
        .join('teams as t2', 'matches.team2_id', 't2.id')
        .where('matches.id', match_id)
        .select('t1.name as team1', 't2.name as team2')
        .first();
  
      if (!match) {
        ctx.session = null;
        return ctx.reply('❌ Матч не найден.');
      }
  
      const existing = {};
      stats.forEach(s => {
        existing[s.attribute_id] = s;
      });
  
      ctx.session.temp.mode = 'all';
      ctx.session.temp.attributes = attributes;
      ctx.session.temp.attr_index = 0;
      ctx.session.temp.existing = existing;
      ctx.session.temp.team1_name = match.team1;
      ctx.session.temp.team2_name = match.team2;
      ctx.session.await_field = 'stat_value_team1';
  
      const current = attributes[0];
      const currentStat = existing[current.id];
  
      const prefix = currentStat
        ? `📊 Текущее значение:\n*${match.team1}*: ${currentStat.value_team1 || '-'}  |  *${match.team2}*: ${currentStat.value_team2 || '-'}\n\n`
        : '';
  
      await ctx.answerCallbackQuery();
      await ctx.reply(
        `${prefix}✏️ *${current.group_name} → ${current.name}*\nВведите новое значение для команды *${match.team1}*:`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('editstat:mode:all error:', err);
      ctx.session = null;
      return ctx.reply('❌ Ошибка при запуске редактирования.');
    }
  });
  

  bot.callbackQuery('editstat:mode:one', async (ctx) => {
    const match_id = ctx.session.temp.match_id;
    const attributes = await db('attributes')
      .join('attribute_groups', 'attributes.group_id', 'attribute_groups.id')
      .select('attributes.id', 'attributes.name', 'attribute_groups.name as group_name');

    const stats = await db('match_stats')
      .where({ match_id })
      .select('attribute_id', 'value_team1', 'value_team2');

    const existing = {};
    stats.forEach(s => { existing[s.attribute_id] = s; });

    ctx.session.temp.mode = 'one';
    ctx.session.temp.attributes = attributes;
    ctx.session.temp.existing = existing;

    const buttons = attributes.map(attr => [{
      text: `${attr.group_name} → ${attr.name}`,
      callback_data: `editstat:attr:${attr.id}`,
    }]);

    await ctx.answerCallbackQuery();
    await ctx.editMessageText('Выберите атрибут для редактирования:', {
      reply_markup: { inline_keyboard: buttons },
    });
  });

  bot.callbackQuery(/^editstat:attr:(\d+)$/, async (ctx) => {
    try {
      const attr_id = Number(ctx.match[1]);
      ctx.session.temp.current_attr_id = attr_id;
      ctx.session.await_field = 'stat_value_team1';
  
      // Ищем атрибут по ID в списке
      const attr = ctx.session.temp.attributes.find(a => a.id === attr_id);
      if (!attr) {
        return ctx.reply('❌ Атрибут не найден.');
      }
  
      ctx.session.temp.attr_type = attr.type; // Сохраняем тип для логики далее
  
      const current = ctx.session.temp.existing?.[attr_id];
      const team1 = ctx.session.temp.team1_name || 'Команда 1';
      const team2 = ctx.session.temp.team2_name || 'Команда 2';
  
      let prefix = '';
      if (current) {
        prefix += `📊 Текущее значение:\n`;
        prefix += `*${team1}*: ${current.value_team1 || '-'}  |  *${team2}*: ${current.value_team2 || '-'}`;
        if (attr.type === 'triple') {
          prefix += `  |  *Общее*: ${current.value_total || '-'}`;
        }
        prefix += `\n\n`;
      }
  
      await ctx.answerCallbackQuery();
  
      return ctx.reply(
        `${prefix}✏️ *${attr.group_name} → ${attr.name}*\nВведите новое значение для команды *${team1}*:`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('editstat:attr error:', err);
      ctx.session = null;
      return ctx.reply('❌ Ошибка при редактировании.');
    }
  });
  
  
};
