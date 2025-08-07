const db = require("../db/connect");
const {InlineKeyboard} = require("grammy");

module.exports = (bot) => {
  bot.command("match_info", async (ctx) => {
    try {
      const matches = await db("matches")
        .join("teams as t1", "matches.team1_id", "t1.id")
        .join("teams as t2", "matches.team2_id", "t2.id")
        .join("tournaments", "matches.tournament_id", "tournaments.id")
        .join("rounds", "matches.round_id", "rounds.id")
        .select(
          "matches.id",
          "tournaments.name as tournament",
          "rounds.number as round",
          "t1.name as team1",
          "t2.name as team2",
          "matches.date",
          "matches.time"
        )
        .orderBy("matches.date", "desc");

      if (!matches.length) {
        return ctx.reply("⚠️ Наразі немає доступних матчів.");
      }

      const keyboard = new InlineKeyboard();
      for (const match of matches) {
        const date = new Date(match.date);
        const formattedDate = date.toLocaleDateString("uk-UA"); // формат: дд.мм.рррр

        keyboard
          .text(
            `${match.team1} vs ${match.team2} (${formattedDate})`,
            `match:info:${match.id}`
          )
          .row();
      }

      return ctx.reply("📋 Оберіть матч для перегляду інформації:", {
        reply_markup: keyboard,
      });
    } catch (err) {
      console.error("match_info command error:", err);
      return ctx.reply("❌ Сталася помилка під час завантаження матчів.");
    }
  });
};
