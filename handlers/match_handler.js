const db = require("../db/connect");
const nodeHtmlToImage = require("node-html-to-image");
const fs = require("fs");
const path = require("path");
const {InputFile} = require("grammy");
const {InlineKeyboard} = require("grammy");
const pLimit = require("p-limit");
const renderLimit = pLimit(2);
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

  // match info
  // Выбор турнира → список туров этого турнира
  bot.callbackQuery(/^match:tourn:(\d+)$/, async (ctx) => {
    try {
      await ctx.answerCallbackQuery().catch(() => {});
      const tournamentId = Number(ctx.match[1]);

      // все туры (rounds), в которых есть матчи выбранного турнира
      const rounds = await db("rounds")
        .join("matches", "matches.round_id", "rounds.id")
        .where("matches.tournament_id", tournamentId)
        .distinct("rounds.id", "rounds.number")
        .orderBy("rounds.number", "asc");

      if (!rounds.length) {
        return ctx.editMessageText(
          "⚠️ Для цього турніру немає доступних турів."
        );
      }

      const kb = new InlineKeyboard();
      for (const r of rounds) {
        kb.text(`Тур ${r.number}`, `match:round:${tournamentId}:${r.id}`).row();
      }
      kb.text("⬅️ Назад до турнірів", `match:back:tournaments`);

      return ctx.editMessageText("📅 Оберіть тур:", {reply_markup: kb});
    } catch (err) {
      console.error("match:tourn error:", err);
      return ctx.reply("❌ Сталася помилка під час завантаження турів.");
    }
  });

  // Кнопка «Назад к турнирам»
  bot.callbackQuery(/^match:back:tournaments$/, async (ctx) => {
    try {
      await ctx.answerCallbackQuery().catch(() => {});
      const tournaments = await db("tournaments")
        .join("matches", "matches.tournament_id", "tournaments.id")
        .distinct("tournaments.id", "tournaments.name")
        .orderBy("tournaments.name", "asc");

      if (!tournaments.length) {
        return ctx.editMessageText("⚠️ Наразі немає доступних турнірів.");
      }

      const kb = new InlineKeyboard();
      for (const t of tournaments) kb.text(t.name, `match:tourn:${t.id}`).row();

      return ctx.editMessageText("🏆 Оберіть турнір:", {reply_markup: kb});
    } catch (err) {
      console.error("match:back:tournaments error:", err);
      return ctx.reply("❌ Сталася помилка під час завантаження турнірів.");
    }
  });

  // Выбор тура → список матчей этого тура в выбранном турнире
  bot.callbackQuery(/^match:round:(\d+):(\d+)$/, async (ctx) => {
    try {
      await ctx.answerCallbackQuery().catch(() => {});
      const tournamentId = Number(ctx.match[1]);
      const roundId = Number(ctx.match[2]);

      const matches = await db("matches")
        .join("teams as t1", "matches.team1_id", "t1.id")
        .join("teams as t2", "matches.team2_id", "t2.id")
        .select(
          "matches.id",
          "t1.name as team1",
          "t2.name as team2",
          "matches.date",
          "matches.time"
        )
        .where({
          "matches.tournament_id": tournamentId,
          "matches.round_id": roundId,
        })
        .orderBy("matches.date", "desc");

      if (!matches.length) {
        const kb = new InlineKeyboard().text(
          "⬅️ Назад до турів",
          `match:tourn:${tournamentId}`
        );
        return ctx.editMessageText("⚠️ У цьому турі немає матчів.", {
          reply_markup: kb,
        });
      }

      const kb = new InlineKeyboard();
      for (const m of matches) {
        const formattedDate = new Date(m.date).toLocaleDateString("uk-UA");
        kb.text(
          `${m.team1} vs ${m.team2} (${formattedDate})`,
          `match:info:${m.id}`
        ).row();
      }
      kb.text("⬅️ Назад до турів", `match:tourn:${tournamentId}`)
        .row()
        .text("⬅️⬅️ До турнірів", `match:back:tournaments`);

      return ctx.editMessageText("📋 Оберіть матч:", {reply_markup: kb});
    } catch (err) {
      console.error("match:round error:", err);
      return ctx.reply("❌ Сталася помилка під час завантаження матчів.");
    }
  });
  bot.callbackQuery(/^match:info:(\d+)$/, async (ctx) => {
    const match_id = Number(ctx.match[1]);
    try {
      await ctx.answerCallbackQuery({
        text: "Генеруємо зображення…",
        show_alert: false,
        cache_time: 0,
      });
    } catch {}
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
        return ctx.reply("❌ Матч не знайдено.");
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

      const logoTeam1Path = safeResolveLogoPath(match.team1_logo);
      const logoTeam2Path = safeResolveLogoPath(match.team2_logo);

      const logoTeam1Base64 = toBase64(logoTeam1Path);
      const logoTeam2Base64 = toBase64(logoTeam2Path);

      // Генерируем теги только если есть base64
      const team1LogoTag = logoTeam1Base64
        ? `<img src="${logoTeam1Base64}" class="logo" />`
        : "";
      const team2LogoTag = logoTeam2Base64
        ? `<img src="${logoTeam2Base64}" class="logo" />`
        : "";

      let html = `
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@600&family=Roboto:wght@400&display=swap" rel="stylesheet">


  <style>
    body {
      background-color: #0e0e0e;
      color: white;
      font-family: Arial, sans-serif;

      font-size: 22px;
      width: 1400px;
      padding: 70px 20px 10px 20px;
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
      margin-bottom: 50px;
      font-size: 58px;
      opacity: 0.8;
      
    }
    .stat-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      margin-bottom: 60px;
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
      font-size: 46px;
      padding-bottom: 40px;
      font-weight: 400;
      font-family: 'Roboto', sans-serif;
    }
    .cell.left {
      background-color: #e91e63;
      color: white;
      font-size: 50px;
    }
    .cell.right {
      background-color: #2196f3;
      color: white;
      font-size: 50px;
    }
    .cell.middle {
      background-color: #333333;
      color: white;
      flex: 1.2;
      font-size: 50px;
    }
    .group-title {
      text-align: center;
      margin: 20px 0 10px;
      font-size: 56px;
      border-bottom: 8px solid #444;
      padding-bottom: 4px;
      color: #d6d6d6;
      font-family: 'Exo 2', sans-serif;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;

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

     .score-line {
    display: grid;
    grid-template-columns: 1fr auto 1fr; 
    align-items: end;
    gap: 40px;
    margin-bottom: 25px;
    margin-top: 10px;
  }

 .team-item {
    display: flex;
    flex-direction: column;     
    align-items: center;
    justify-content: center;
    gap: 12px;
    max-width: 100%;
  }

.team-name {
    font-weight: 700;
    text-align: center;
    line-height: 1.1;
    max-width: 90%;
    white-space: normal;          
    word-break: break-word;       
    overflow-wrap: anywhere;
    font-size: 64px; 
  }
.team-left  { color: #e91e63; }
  .team-right { color: #2196f3; }

  .vs-text {
    color: #fff;
    opacity: 0.7;
    font-weight: 700;
    font-size: 30px;
    align-self: center;
  }

 .logo {
    width: 120px;         
    height: 120px;
    object-fit: contain;
    border-radius: 6px;
    background: white;
    flex: 0 0 auto;
  }


  </style>
</head>
<body>
<div class="score-line">
  <div class="team-item left">
     ${team1LogoTag}
    <span class="team-name team-left">${match.team1}</span>
  </div>

  <span class="vs-text">vs</span>

  <div class="team-item right">
     ${team2LogoTag}
    <span class="team-name team-right">${match.team2}</span>
  </div>
</div>





  <div class="info">${formattedDate} – ${formattedTime} – "${match.stadium}"</div>
`;

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
      // ---- logs
      console.log(
        "[match:info] team1_logo from DB:",
        match.team1_logo,
        "→",
        logoTeam1Path
      );
      console.log(
        "[match:info] team2_logo from DB:",
        match.team2_logo,
        "→",
        logoTeam2Path
      );
      // ----
      await renderLimit(() =>
        nodeHtmlToImage({
          output: filePath,
          html: html,
          type: "png",
          quality: 100,
          puppeteerArgs: {
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--disable-gpu",
            ],
          },
          waitUntil: "networkidle0",
        })
      );

      await ctx.replyWithPhoto(new InputFile(filePath));
    } catch (err) {
      console.error("match:info error:", err);
      return ctx.reply("❌ Помилка при генерації статистики матчу.");
    }
  });
};

function normalizeFsPath(p) {
  if (!p) return null;
  p = p.replace(/\\/g, "/"); // windows слэши → unix
  return p.replace(/\/+$/, ""); // убираем хвостовые /
}

function safeResolveLogoPath(fileName, opts = {}) {
  const baseDir = path.resolve(__dirname, "../images/logo");
  const fromDb = normalizeFsPath(fileName);
  const candidates = [];

  // 1) абсолютный путь из БД
  if (fromDb && path.isAbsolute(fromDb)) candidates.push(fromDb);

  // 2) относительный из БД
  if (fromDb && !path.isAbsolute(fromDb))
    candidates.push(path.join(baseDir, fromDb));

  // 3) дефолт
  if (opts.includeDefault !== false) {
    candidates.push(path.join(baseDir, "default.png"));
  }

  for (const f of candidates) {
    try {
      const st = fs.statSync(f);
      if (st.isFile()) return f;
    } catch (_e) {}
  }
  return null;
}

function toBase64(filePath) {
  try {
    if (!filePath) return null;
    const st = fs.statSync(filePath);
    if (!st.isFile()) return null; // защита от директорий
    const buf = fs.readFileSync(filePath);
    const ext = (path.extname(filePath).slice(1) || "png").toLowerCase();
    return `data:image/${ext};base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error("Logo read fail:", filePath, err.message);
    return null;
  }
}
