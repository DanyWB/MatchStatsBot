const db = require('../db/connect');

const DEFAULT_EXPIRE_MINUTES = 60;
const SCHEMA_VERSION = '1';

function getExpirationDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + DEFAULT_EXPIRE_MINUTES);
  return now.toISOString();
}

async function sessionMiddleware(ctx, next) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return next();

  try {
    let sessionRow = await db('sessions').where({ telegram_id: telegramId }).first();
    const userRow = await db('users').where({ telegram_id: telegramId }).first();

    if (!sessionRow) {
      await db('sessions').insert({
        telegram_id: telegramId,
        data: '{}',
        expires_at: getExpirationDate(),
        schema_version: SCHEMA_VERSION,
      });
      sessionRow = { data: {}, schema_version: SCHEMA_VERSION };
    }

    if (sessionRow.schema_version !== SCHEMA_VERSION) {
      await db('sessions').where({ telegram_id: telegramId }).update({
        data: '{}',
        updated_at: new Date(),
        expires_at: getExpirationDate(),
        schema_version: SCHEMA_VERSION,
      });
      sessionRow.data = {};
    }

    ctx.session = sessionRow.data || {};
    ctx.session.role = userRow?.role || 'user';

    await next();

    await db('sessions')
      .where({ telegram_id: telegramId })
      .update({
        data: ctx.session,
        updated_at: new Date(),
        expires_at: getExpirationDate(),
      });

  } catch (error) {
    console.error('❌ Ошибка в sessionMiddleware:', error);
    ctx.session = null;
    return ctx.reply('❌ Произошла ошибка при загрузке сессии.');
  }
}

module.exports = sessionMiddleware;