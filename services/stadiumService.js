const db = require('../db/connect');

async function createStadium(name) {
  const exists = await db('stadiums').where({ name }).first();
  if (exists) {
    throw new Error('Такой стадион уже существует');
  }

  await db('stadiums').insert({ name });
}

module.exports = {
  createStadium,
};
