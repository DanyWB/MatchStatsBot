const db = require("../db/connect");
const setCommandsByRole = require("../utils/setCommandsByRole");

module.exports = async function startCommand(bot) {
  bot.command("start", async (ctx) => {
    try {
      const telegramId = ctx.from.id;

      // створюємо користувача, якщо він не існує
      const existing = await db("users")
        .where({telegram_id: telegramId})
        .first();
      if (!existing) {
        await db("users").insert({telegram_id: telegramId, role: "user"});
      }

      // оновлюємо список команд залежно від ролі
      const role = existing?.role || "user";
      await setCommandsByRole(bot, role, telegramId);

      return ctx.reply(
        `👋 Ласкаво просимо до бота для керування футбольним турніром!

📌 Доступні команди для адміністратора:
1. /create_tournament — створити турнір
2. /add_round — додати тур до турніру
3. /add_team — додати команду
4. /add_stadium — додати стадіон
5. /add_group — додати групу атрибутів
6. /add_attribute — додати атрибут до групи
7. /create_match — створити матч
8. /add_stats — заповнити статистику
9. /edit_stats — редагувати статистику

Викликайте команди по черзі, як зазначено вище.`
      );
    } catch (err) {
      console.error("/start error:", err);
      ctx.session = null;
      return ctx.reply("❌ Сталася помилка під час запуску.");
    }
  });
};
