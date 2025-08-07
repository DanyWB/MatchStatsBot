module.exports = async function setCommandsByRole(bot, role, userId) {
  const base = [
    {command: "start", description: "Запуск бота"},
    {command: "match_info", description: "Статистика матчів"},
  ];

  const admin = [
    {command: "create_tournament", description: "1 - Створити турнір"},
    {command: "add_round", description: "2 - Додати тур"},
    {command: "add_team", description: "3 - Додати команду"},
    {command: "add_stadium", description: "4 - Додати стадіон"},
    {command: "add_group", description: "5 - Додати групу атрибутів"},
    {command: "add_attribute", description: "6 - Додати атрибут"},
    {command: "create_match", description: "7 - Створити матч"},
    {command: "add_stats", description: "8 - Додати статистику"},
    {command: "edit_stats", description: "Редагувати статистику"},
  ];

  const fullList = role === "admin" ? [...base, ...admin] : base;

  await bot.api.setMyCommands(fullList, {
    scope: {type: "chat", chat_id: userId},
  });
};
