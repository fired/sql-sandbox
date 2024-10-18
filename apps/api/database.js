const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, 'user_dbs');
console.log(`Database directory path: ${dbDir}`);

if (!fs.existsSync(dbDir)) {
  // console.log(`Creating database directory: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

function getDbPath(userId) {
  const dbPath = path.join(dbDir, `${userId}.db`);
  // console.log(`Database path for user ${userId}: ${dbPath}`);
  return dbPath;
}

function createDb(userId) {
  return new Promise((resolve, reject) => {
    const dbPath = getDbPath(userId);
    // console.log(`Creating database for user ${userId} at path: ${dbPath}`);
    try {
      const db = new Database(dbPath);
      const initSqlPath = path.join(__dirname, 'sql', 'init.sql');
      // console.log(`Reading init SQL from: ${initSqlPath}`);
      const initSql = fs.readFileSync(initSqlPath, 'utf8');
      db.exec(initSql);
      db.close();
      // console.log(`Database created successfully for user ${userId}`);
      updateLastAccessed(userId);
      resolve();
    } catch (err) {
      console.error(`Error creating database for user ${userId}:`, err);
      reject(err);
    }
  });
}

function getDb(userId) {
  const dbPath = getDbPath(userId);
  // console.log(`Opening database for user ${userId} at path: ${dbPath}`);
  return new Database(dbPath);
}

function executeQuery(userId, query) {
  return new Promise((resolve, reject) => {
    const db = getDb(userId);
    try {
      // console.log(`Executing query for user ${userId}: ${query.substring(0, 50)}...`);
      const isSelectQuery = query.trim().toLowerCase().startsWith('select') || query.trim().toLowerCase().startsWith('pragma');
      
      if (isSelectQuery) {
        const stmt = db.prepare(query);
        const rows = stmt.all();
        // console.log(`Select query executed successfully for user ${userId}`);
        resolve(Array.isArray(rows) ? rows : [rows]);
      } else {
        const stmt = db.prepare(query);
        const info = stmt.run();
        // console.log(`Non-select query executed successfully for user ${userId}`);
        resolve({ 
          changes: info.changes, 
          lastInsertRowid: info.lastInsertRowid 
        });
      }
    } catch (err) {
      console.error(`Query execution error for user ${userId}:`, err);
      reject(err);
    } finally {
      db.close();
    }
  });
}

function resetDb(userId) {
  const dbPath = getDbPath(userId);
  console.log(`Resetting database for user ${userId} at path: ${dbPath}`);

  try {
    if (fs.existsSync(dbPath)) {
      // console.log(`Deleting existing database file for user ${userId}`);
      fs.unlinkSync(dbPath);
    }

    // console.log(`Creating new database for user ${userId}`);
    const db = new Database(dbPath);

    try {
      const initSqlPath = path.join(__dirname, 'sql', 'init.sql');
      // console.log(`Reading init SQL from: ${initSqlPath}`);
      const initSql = fs.readFileSync(initSqlPath, 'utf8');
      db.exec(initSql);
      console.log(`Database reset successfully for user ${userId}`);
    } finally {
      db.close();
    }
  } catch (err) {
    console.error(`Error resetting database for user ${userId}:`, err);
    throw err;
  }
}

function updateLastAccessed(userId) {
  const now = new Date().toISOString();
  const filePath = path.join(dbDir, `${userId}.last_accessed`);
  fs.writeFileSync(filePath, now);
  // console.log(`Updated last accessed time for user ${userId} at path: ${filePath}`);
}

function getLastAccessed(userId) {
  const filePath = path.join(dbDir, `${userId}.last_accessed`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    // console.log(`Last accessed time for user ${userId}: ${content}`);
    return new Date(content);
  }
  console.log(`No last accessed file found for user ${userId}`);
  return null;
}

module.exports = { createDb, getDb, executeQuery, resetDb, updateLastAccessed, getLastAccessed };