const db = require("../db/connect");
const nodeHtmlToImage = require("node-html-to-image");
const fs = require("fs");
const path = require("path");
const {InputFile} = require("grammy");

module.exports = async function matchHandler(bot) {
  bot.callbackQuery(/^match:tournament:(\d+)$/, async (ctx) => {
    console.log(1);
    const id = Number(ctx.match[1]);
    const tournament = await db("tournaments").where({id}).first();
    if (!tournament)
      return ctx.answerCallbackQuery({
        text: "Турнир не найден",
        show_alert: true,
      });

    ctx.session.temp.tournament_id = id;

    const rounds = await db("rounds").where({tournament_id: id});
    if (rounds.length === 0) {
      return ctx.reply(
        "⚠️ Нет туров в этом турнире. Добавьте тур и попробуйте снова."
      );
    }

    const buttons = rounds.map((r) => [
      {text: `Тур ${r.number}`, callback_data: `match:round:${r.id}`},
    ]);

    await ctx.answerCallbackQuery();
    await ctx.editMessageText("🔢 Выберите тур:", {
      reply_markup: {inline_keyboard: buttons},
    });
  });

  bot.callbackQuery(/^match:round:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match[1]);
    ctx.session.temp.round_id = id;

    const teams = await db("teams").select("id", "name");
    if (teams.length < 2) {
      return ctx.reply("⚠️ Нужно как минимум 2 команды.");
    }

    const buttons = teams.map((t) => [
      {text: t.name, callback_data: `match:team1:${t.id}`},
    ]);

    await ctx.answerCallbackQuery();
    await ctx.editMessageText("⚽ Выберите первую команду:", {
      reply_markup: {inline_keyboard: buttons},
    });
  });

  bot.callbackQuery(/^match:team1:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match[1]);
    ctx.session.temp.team1_id = id;

    const teams = await db("teams").whereNot("id", id).select("id", "name");
    const buttons = teams.map((t) => [
      {text: t.name, callback_data: `match:team2:${t.id}`},
    ]);

    await ctx.answerCallbackQuery();
    await ctx.editMessageText("⚽ Выберите вторую команду:", {
      reply_markup: {inline_keyboard: buttons},
    });
  });

  bot.callbackQuery(/^match:team2:(\d+)$/, async (ctx) => {
    ctx.session.temp.team2_id = Number(ctx.match[1]);

    const stadiums = await db("stadiums").select("id", "name");
    if (stadiums.length === 0) {
      return ctx.reply(
        "⚠️ Нет стадионов. Добавьте стадион и попробуйте снова."
      );
    }

    const buttons = stadiums.map((s) => [
      {text: s.name, callback_data: `match:stadium:${s.id}`},
    ]);

    await ctx.answerCallbackQuery();
    await ctx.editMessageText("🏟 Выберите стадион:", {
      reply_markup: {inline_keyboard: buttons},
    });
  });

  bot.callbackQuery(/^match:stadium:(\d+)$/, async (ctx) => {
    ctx.session.temp.stadium_id = Number(ctx.match[1]);
    ctx.session.await_field = "match_date";
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("📅 Введите дату матча в формате ДД.ММ.ГГГГ:");
  });
  bot.callbackQuery(/^match:info:(\d+)$/, async (ctx) => {
    const match_id = Number(ctx.match[1]);

    try {
      const match = await db("matches")
        .join("teams as t1", "matches.team1_id", "t1.id")
        .join("teams as t2", "matches.team2_id", "t2.id")
        .join("tournaments", "matches.tournament_id", "tournaments.id")
        .join("rounds", "matches.round_id", "rounds.id")
        .join("stadiums", "matches.stadium_id", "stadiums.id")
        .where("matches.id", match_id)
        .select(
          "tournaments.name as tournament",
          "rounds.number as round",
          "t1.name as team1",
          "t2.name as team2",
          "t1.file_name_logo as team1_logo",
          "t2.file_name_logo as team2_logo",
          "matches.date",
          "matches.time",
          "stadiums.name as stadium"
        )
        .first();

      if (!match) {
        return ctx.reply("❌ Матч не найден.");
      }

      const stats = await db("match_stats")
        .join("attributes", "match_stats.attribute_id", "attributes.id")
        .join("attribute_groups", "attributes.group_id", "attribute_groups.id")
        .where("match_stats.match_id", match_id)
        .select(
          "attribute_groups.name as group_name",
          "attributes.name as attr_name",
          "attributes.type as attr_type",
          "match_stats.value_team1",
          "match_stats.value_team2",
          "match_stats.value_total"
        )
        .orderBy(["attribute_groups.id", "attributes.id"]);

      const formatDate = (isoDate) => {
        const d = new Date(isoDate);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
      };

      const formattedDate = formatDate(match.date);
      const formattedTime = match.time.slice(0, 5);

      // Генерация HTML
      // Генерация HTML
      const logoTeam1Path = `file://${path.resolve(
        __dirname,
        "../images/logo",
        match.team1_logo || ""
      )}`;
      const logoTeam2Path = `file://${path.resolve(
        __dirname,
        "../images/logo",
        match.team2_logo || ""
      )}`;

      let html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      background-color: #0e0e0e;
      color: white;
      font-family: Arial, sans-serif;
      padding: 20px;
      font-size: 22px;
      width: 1100px;
    }
    .score {
      text-align: center;
      font-size: 38px;
      margin: 10px 0;
    }
    .team-name {
      font-weight: bold;
    }
    .team-left {
      color: #e91e63;
    }
    .team-right {
      color: #2196f3;
    }
    .info {
      text-align: center;
      margin-bottom: 30px;
      font-size: 18px;
      opacity: 0.8;
    }
    .stat-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      margin-bottom: 20px;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      background-color: #1a1a1a;
      border-radius: 6px;
      overflow: hidden;
    }
    .cell {
      flex: 1;
      text-align: center;
      padding: 10px;
      font-weight: bold;
      position: relative; /* Добавлено для корректного позиционирования bar-bg */
    }
    .cell.label {
      flex: 2;
      background-color: #0e0e0e;
      color: #d6d6d6;
      font-size: 30px;
    }
    .cell.left {
      background-color: #e91e63;
      color: white;
    }
    .cell.right {
      background-color: #2196f3;
      color: white;
    }
    .cell.middle {
      background-color: #333333;
      color: white;
      flex: 1.2;
    }
    .group-title {
      text-align: center;
      margin: 20px 0 10px;
      font-size: 36px;
      font-weight: bold;
      border-bottom: 2px solid #444;
      padding-bottom: 4px;
    }
    .bar-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .bar-bg {
      position: absolute;
      top: 0;
      height: 100%;
      opacity: 0.3;
      z-index: 0;
    }
    .bar-bg.left {
      left: 0;
      background-color: #e91e63;
    }
    .bar-bg.right {
      right: 0;
      background-color: #2196f3;
    }
    .bar-value {
      position: relative;
      z-index: 1;
    }
      .team {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 30px;
      justify-content: center;
    }

    .team-left {
      flex-direction: row;
      color: #e91e63;
    }

    .team-right {
      flex-direction: row-reverse;
      color: #2196f3;
    }

    .logo {
      width: 50px;
      height: 50px;
      object-fit: contain;
      border-radius: 6px;
      background: white;
    }

  </style>
</head>
<body>
  <div class="score">
      <div class="team team-left">
  <img src="${logoTeam1Path} class="logo" />
  <span class="team-name">${match.team1}</span>
</div>
<div class="team team-right">
  <img src="${logoTeam2Path}" class="logo" />
  <span class="team-name">${match.team2}</span>
</div>

  </div>

  <div class="info">${formattedDate} – ${formattedTime} – "${match.stadium}"</div>
`;
      console.log(logoTeam1Path);
      let currentGroup = null;
      for (const stat of stats) {
        if (stat.group_name !== currentGroup) {
          if (currentGroup !== null) html += `</div>`; // Закрываем предыдущий stat-block
          currentGroup = stat.group_name;
          html += `<div class="group-title">${currentGroup}</div><div class="stat-block">`;
        }

        if (stat.attr_type === "triple") {
          html += `
      <div class="stat-row">
        <div class="cell left"><span class="bar-value">${
          stat.value_team1 || ""
        }</span></div>
        <div class="cell middle">${stat.value_total || ""}</div>
        <div class="cell right"><span class="bar-value">${
          stat.value_team2 || ""
        }</span></div>
      </div>
      <div class="stat-row">
        <div class="cell label">${stat.attr_name}</div>
      </div>
    `;
        } else {
          const parse = (val) => {
            if (!val) return 0;
            return parseFloat(val.toString().replace(",", ".")) || 0;
          };

          const left = parse(stat.value_team1);
          const right = parse(stat.value_team2);

          const leftGrow = left * 10 || 0.01;
          const rightGrow = right * 10 || 0.01;

          html += `
      <div class="stat-row">
  <div class="cell left" style="flex-grow: ${leftGrow}">${
            stat.value_team1 || ""
          }</div>
  <div class="cell right" style="flex-grow: ${rightGrow}">${
            stat.value_team2 || ""
          }</div>
</div>
      <div class="stat-row">
        <div class="cell label">${stat.attr_name}</div>
      </div>
    `;
        }
      }

      // Закрываем последний stat-block
      if (currentGroup !== null) html += `</div>`;

      html += `
</body>
</html>
`;

      const filePath = path.join(
        __dirname,
        `../images/match_${match_id}_stats.png`
      );
      await nodeHtmlToImage({
        output: filePath,
        html: html,
        type: "png",
        quality: 100,
      });

      await ctx.replyWithPhoto(new InputFile(filePath));
      await ctx.answerCallbackQuery();
    } catch (err) {
      console.error("match:info error:", err);
      return ctx.reply("❌ Ошибка при генерации статистики матча.");
    }
  });
};
