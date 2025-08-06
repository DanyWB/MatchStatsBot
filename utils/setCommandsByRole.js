module.exports = async function setCommandsByRole(bot, role, userId) {
  const base = [
    {command: "start", description: "Запуск бота"},
    {command: "match_info", description: "Статистика Матчей"},
  ];

  const admin = [
    {command: "create_tournament", description: "1 - Создать турнир"},
    {command: "add_round", description: "2 - Добавить тур"},
    {command: "add_team", description: "3 - Добавить команду"},
    {command: "add_stadium", description: "4 - Добавить стадион"},
    {command: "add_group", description: "5 - Добавить группу атрибутов"},
    {command: "add_attribute", description: "6 - Добавить атрибут"},
    {command: "create_match", description: "7 - Создать матч"},
    {command: "add_stats", description: "8 - Добавить статистику"},
    {command: "edit_stats", description: "Редактировать статистику"},
  ];

  const fullList = role === "admin" ? [...base, ...admin] : base;

  await bot.api.setMyCommands(fullList, {
    scope: {type: "chat", chat_id: userId},
  });
};
