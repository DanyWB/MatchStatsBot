const { InlineKeyboard } = require('grammy');
const infoText = `
ℹ️ *Информация о VPN-боте*

Этот бот помогает купить и использовать VPN, быстро и удобно.
- Оплата в звёздах Telegram
- Простой выбор тарифов
- Реферальная программа (скоро)
- Поддержка и помощь

Для покупки VPN — жми /vpn или кнопку ниже!
`;
const infoKeyboard = new InlineKeyboard()
  .text('🌐 Купить VPN', 'vpn_start')
  .row()
  .text('⬅️ Назад', 'back_to_menu');

async function handleInfo(ctx) {
  try {
   await ctx.reply(infoText, {
      parse_mode: 'Markdown',
      reply_markup: infoKeyboard
    });
  } catch (err) {
    console.error('info command error', err);
    // TODO: логировать через utils/logger.js
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
}

module.exports = (bot, knex) => {
  bot.command('info', handleInfo);
};
module.exports.handleInfo = handleInfo; // экспортируем для хендлеров
