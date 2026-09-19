const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/db');
require('../models');

async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME;
  if (!dbName) {
    throw new Error('DB_NAME is not set in environment variables');
  }

  const bootstrap = new Sequelize('', process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  });

  try {
    await bootstrap.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
  } finally {
    await bootstrap.close();
  }
}

async function tableExists(tableName) {
  const tables = await sequelize.getQueryInterface().showAllTables();
  return tables.some((table) => table.toLowerCase() === tableName.toLowerCase());
}

async function runMigrations() {
  if (!(await tableExists('Orders'))) {
    return;
  }

  try {
    await sequelize.query(
      "UPDATE `Orders` SET paymentMethod = 'Visa' WHERE paymentMethod = 'Online'"
    );
  } catch (error) {
    console.warn('Payment method data migration skipped:', error.message);
  }

  try {
    await sequelize.query(
      "ALTER TABLE `Orders` MODIFY COLUMN paymentMethod ENUM('Cash', 'Card', 'Visa') NULL"
    );
  } catch (error) {
    console.warn('Payment method enum migration skipped:', error.message);
  }
}

async function syncDatabase() {
  await ensureDatabaseExists();
  // Use sync without alter — alter:true repeatedly adds indexes on MySQL
  // and can hit "Too many keys specified; max 64 keys allowed".
  await sequelize.sync();
  await runMigrations();
  console.log('Database tables synced automatically.');
}

module.exports = { syncDatabase };
