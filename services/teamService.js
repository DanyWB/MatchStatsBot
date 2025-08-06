const db = require('../db/connect');

async function createTeam(name) {
  const existing = await db('teams').where({ name }).first();
  if (existing) {
    throw new Error('Такая команда уже существует');
  }

  await db('teams').insert({ name });
}

module.exports = {
  createTeam,
};
