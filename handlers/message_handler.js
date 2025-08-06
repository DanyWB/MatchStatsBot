const tournamentService = require('../services/tournamentService');
const { Markup } = require('grammy');
module.exports = async function handleTextMessages(bot) {
  bot.on('message:text', async (ctx) => {
    const field = ctx.session?.await_field;

    if (!field) return;
    try {
      
      switch (field) {
        case 'tournament_name': {
          const name = ctx.message.text.trim();

          if (name.length < 3) {
            return ctx.reply('❌ Название должно содержать минимум 3 символа.');
          }

          await tournamentService.createTournament(name);
          ctx.session.await_field = null;
          return ctx.reply('✅ Турнир успешно создан.');
        }
        case 'team_name': {
          const name = ctx.message.text.trim();
        
          if (name.length < 2) {
            return ctx.reply('❌ Название команды слишком короткое.');
          }
        
          try {
            await require('../services/teamService').createTeam(name);
            ctx.session.await_field = null;
            return ctx.reply('✅ Команда успешно добавлена.');
          } catch (err) {
            console.error('Ошибка сохранения команды:', err);
            ctx.session.await_field = null;
            return ctx.reply('❌ Ошибка: такая команда уже существует.');
          }
        }
        case 'stadium_name': {
          const name = ctx.message.text.trim();
        
          if (name.length < 2) {
            return ctx.reply('❌ Название стадиона слишком короткое.');
          }
        
          try {
            await require('../services/stadiumService').createStadium(name);
            ctx.session.await_field = null;
            return ctx.reply('✅ Стадион успешно добавлен.');
          } catch (err) {
            console.error('Ошибка сохранения стадиона:', err);
            ctx.session.await_field = null;
            return ctx.reply('❌ Ошибка: такой стадион уже существует.');
          }
        }
        case 'round_number': {
          const num = Number(ctx.message.text.trim());
          const tournamentId = ctx.session?.temp?.tournament_id;
        
          if (!tournamentId || isNaN(num) || num < 1) {
            ctx.session = null;
            return ctx.reply('❌ Неверный ввод. Начните заново.');
          }
        
          try {
            const existing = await require('../db/connect')('rounds')
              .where({ tournament_id: tournamentId, number: num })
              .first();
        
            if (existing) {
              return ctx.reply('⚠️ Такой тур уже существует в этом турнире.');
            }
        
            await require('../db/connect')('rounds').insert({
              tournament_id: tournamentId,
              number: num,
            });
        
            ctx.session.await_field = null;
            ctx.session.temp = null;
            return ctx.reply('✅ Тур успешно добавлен.');
          } catch (err) {
            console.error('Ошибка при сохранении тура:', err);
            ctx.session = null;
            return ctx.reply('❌ Ошибка при добавлении тура.');
          }
        }
        case 'attribute_group_name': {
          const name = ctx.message.text.trim();
        
          if (name.length < 2) {
            return ctx.reply('❌ Название слишком короткое.');
          }
        
          try {
            await require('../services/attributeGroupService').createGroup(name);
            ctx.session.await_field = null;
            return ctx.reply('✅ Группа атрибутов успешно добавлена.');
          } catch (err) {
            console.error('Ошибка добавления группы:', err);
            ctx.session.await_field = null;
            return ctx.reply('❌ Такая группа уже существует.');
          }
        }
        case 'attribute_name': {
          const name = ctx.message.text.trim();
          if (!name) {
            return ctx.reply('❌ Название не может быть пустым.');
          }
        
          ctx.session.temp.name = name;
          ctx.session.await_field = null;
        
          return ctx.reply('⚙️ Выберите тип атрибута:', {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🔁 Двойной (1 и 2 команда)', callback_data: 'attr_type:double' }
                ],
                [
                  { text: '🔀 Тройной (1, 2 и общее)', callback_data: 'attr_type:triple' }
                ]
              ]
            }
          });
        }
        case 'match_date': {
          const input = ctx.message.text.trim();
        
          // проверка на формат ДД.ММ.ГГГГ
          const match = input.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
          if (!match) {
            return ctx.reply('❌ Неверный формат даты. Пример: 03.08.2025');
          }
        
          const [_, dd, mm, yyyy] = match;
          const isoDate = `${yyyy}-${mm}-${dd}`;
        
          // проверим корректность даты (например, 32.13.2025 будет отклонена)
          const isValidDate = !isNaN(Date.parse(isoDate));
          if (!isValidDate) {
            return ctx.reply('❌ Такой даты не существует. Пример: 03.08.2025');
          }
        
          ctx.session.temp.date = isoDate;
          ctx.session.await_field = 'match_time';
          return ctx.reply('⏰ Введите время матча (ЧЧ:ММ):');
        }
        
        case 'match_time': {
          const time = ctx.message.text.trim();
        
          // проверка: часы 00–23, минуты 00–59
          const match = time.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
          if (!match) {
            return ctx.reply('❌ Неверный формат времени. Пример: 18:30');
          }
        
          try {
            const {
              tournament_id,
              round_id,
              team1_id,
              team2_id,
              stadium_id,
              date
            } = ctx.session.temp;
        
            await require('../db/connect')('matches').insert({
              tournament_id,
              round_id,
              team1_id,
              team2_id,
              stadium_id,
              date,
              time
            });
        
            ctx.session.scenario = null;
            ctx.session.temp = null;
            ctx.session.await_field = null;
        
            return ctx.reply('✅ Матч успешно создан.');
          } catch (err) {
            console.error('Ошибка создания матча:', err);
            ctx.session = null;
            return ctx.reply('❌ Ошибка при сохранении матча.');
          }
        }
        
        case 'stat_value_team1': {
          ctx.session.temp.value_team1 = ctx.message.text.trim();
        
          // получим названия команд
          const match = await require('../db/connect')('matches')
            .join('teams as t1', 'matches.team1_id', 't1.id')
            .join('teams as t2', 'matches.team2_id', 't2.id')
            .where('matches.id', ctx.session.temp.match_id)
            .select('t1.name as team1', 't2.name as team2')
            .first();
        
          if (!match) {
            ctx.session = null;
            return ctx.reply('❌ Матч не найден. Попробуйте снова.');
          }
        
          ctx.session.temp.team2_name = match.team2; // можно переиспользовать
        
          ctx.session.await_field = 'stat_value_team2';
        
          return ctx.reply(`📥 Введите значение для команды *${match.team2}*:`, {
            parse_mode: 'Markdown',
          });
        }
        
        case 'stat_value_team2': {
          const value_team2 = ctx.message.text.trim();
          const {
            match_id,
            value_team1,
            mode,
            attributes,
            attr_index,
            current_attr_id,
            attr_type
          } = ctx.session.temp;
        
          ctx.session.temp.value_team2 = value_team2;
        
          if (attr_type === 'triple') {
            ctx.session.await_field = 'stat_value_total';
            return ctx.reply('📊 Введите общее значение для обеих команд:');
          }
        
          // если тип double — сразу сохранить
          return saveStatAndContinue(ctx);
        }
        
        case 'stat_value_total': {
          const value_total = ctx.message.text.trim();
          ctx.session.temp.value_total = value_total;
        
          return saveStatAndContinue(ctx);
        }
        
        
        
        

      }
    } catch (error) {
      console.error(`Ошибка при обработке ${field}:`, error);
      ctx.session = null;
      return ctx.reply('❌ Произошла ошибка при обработке данных.');
    }
  });
};
async function saveStatAndContinue(ctx) {
  const {
    match_id,
    mode,
    attributes,
    attr_index,
    current_attr_id,
    value_team1,
    value_team2,
    value_total,
    attr_type
  } = ctx.session.temp;

  const attribute_id = mode === 'all'
    ? attributes[attr_index].id
    : current_attr_id;

  try {
    const payload = {
      match_id,
      attribute_id,
      value_team1,
      value_team2,
    };

    if (attr_type === 'triple') {
      payload.value_total = value_total;
    }

    await require('../db/connect')('match_stats')
      .insert(payload)
      .onConflict(['match_id', 'attribute_id'])
      .merge();

    if (mode === 'all') {
      const nextIndex = attr_index + 1;
      if (nextIndex < attributes.length) {
        const nextAttr = attributes[nextIndex];

        ctx.session.temp.attr_index = nextIndex;
        ctx.session.await_field = 'stat_value_team1';

        const match = await require('../db/connect')('matches')
          .join('teams as t1', 'matches.team1_id', 't1.id')
          .join('teams as t2', 'matches.team2_id', 't2.id')
          .where('matches.id', match_id)
          .select('t1.name as team1', 't2.name as team2')
          .first();

        if (!match) {
          ctx.session = null;
          return ctx.reply('❌ Ошибка: матч не найден.');
        }

        ctx.session.temp.team1_name = match.team1;
        ctx.session.temp.team2_name = match.team2;

        return ctx.reply(
          `📊 *${nextAttr.group_name} → ${nextAttr.name}*\n` +
          `Введите значение для команды *${match.team1}*:`,
          { parse_mode: 'Markdown' }
        );
      } else {
        ctx.session.scenario = null;
        ctx.session.temp = null;
        ctx.session.await_field = null;
        return ctx.reply('✅ Все значения обновлены.');
      }
    } else {
      ctx.session.scenario = null;
      ctx.session.temp = null;
      ctx.session.await_field = null;
      return ctx.reply('✅ Значения сохранены.');
    }
  } catch (err) {
    console.error('❌ Ошибка при сохранении статистики:', err);
    ctx.session = null;
    return ctx.reply('❌ Ошибка при сохранении.');
  }
}
