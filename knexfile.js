require("dotenv").config();
module.exports = {
  development: {
    client: "pg",
    connection: {
      host: process.env.PG_HOST || "localhost",
      port: process.env.PG_PORT || 5432,
      user: process.env.PG_USER || "postgres",
      password: process.env.PG_PASSWORD || "3010",
      database: process.env.PG_DATABASE || "MatchBot",
    },
    migrations: {
      directory: "./db/migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
  // Продакшн-профиль (по желанию)
  production: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL, // если на Heroku и т.д.
      ssl: {rejectUnauthorized: false},
    },
    migrations: {
      directory: "./db/migrations",
    },
    seeds: {
      directory: "./db/seeds",
    },
  },
};
