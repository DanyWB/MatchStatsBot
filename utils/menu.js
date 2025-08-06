// utils/menu.js
const { InlineKeyboard } = require('grammy');

const mainMenuText = `
👋 *Главное меню VPN Bot!*

Выберите действие:
`;
const welcomeTextMenu = `
👋 *Добро пожаловать в VPN Bot!*

🌟 *Преимущества нашего сервиса:*
• Мгновенная выдача VPN после оплаты
• Оплата звёздами Telegram — безопасно и удобно
• Надёжные европейские серверы
• Поддержка 24/7
• Возможность зарабатывать через рефералку

Выберите действие:
`;

const mainMenuKeyboard = new InlineKeyboard()
  .text('🌐 Купить VPN', 'vpn_start')
  .row()
  .text('ℹ️ Информация', 'info')
  .row()
  .text('💸 Рефералка', 'ref_start')
  .row()
  .text('💰 Вывод звёзд', 'withdraw_start');

module.exports = {
  mainMenuText,
  mainMenuKeyboard,
  welcomeTextMenu,
};
