const db = require("../db/connect");
const {InlineKeyboard} = require("grammy");

module.exports = (bot) => {
  bot.command("match_info", async (ctx) => {
    try {
      const tournaments = await db("tournaments")
        .join("matches", "matches.tournament_id", "tournaments.id")
        .distinct("tournaments.id", "tournaments.name")
        .orderBy("tournaments.name", "asc");

      if (!tournaments.length) {
        return ctx.reply("⚠️ Наразі немає доступних турнірів.");
      }

      const kb = new InlineKeyboard();
      for (const t of tournaments) {
        kb.text(t.name, `match:tourn:${t.id}`).row();
      }

      return ctx.reply("🏆 Оберіть турнір:", {reply_markup: kb});
    } catch (err) {
      console.error("match_info command error:", err);
      return ctx.reply("❌ Сталася помилка під час завантаження турнірів.");
    }
  });
};
