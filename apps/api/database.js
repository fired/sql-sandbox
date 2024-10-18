const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, 'user_dbs');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

function getDbPath(userId) {
  return path.join(dbDir, `${userId}.db`);
}

function createDb(userId) {
  return new Promise((resolve, reject) => {
    try {
      const db = new Database(getDbPath(userId));
      const initSql = fs.readFileSync(path.join(__dirname, 'sql', 'init.sql'), 'utf8');
      db.exec(initSql);
      db.close();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function getDb(userId) {
  return new Database(getDbPath(userId));
}

function executeQuery(userId, query) {
  return new Promise((resolve, reject) => {
    const db = getDb(userId);
    try {
      const isSelectQuery = query.trim().toLowerCase().startsWith('select') || query.trim().toLowerCase().startsWith('pragma');
      
      if (isSelectQuery) {
        const stmt = db.prepare(query);
        const rows = stmt.all();
        resolve(Array.isArray(rows) ? rows : [rows]);
      } else {
        const stmt = db.prepare(query);
        const info = stmt.run();
        resolve({ 
          changes: info.changes, 
          lastInsertRowid: info.lastInsertRowid 
        });
      }
    } catch (err) {
      console.error('Query execution error:', err);
      reject(err);
    } finally {
      db.close();
    }
  });
}

function resetDb(userId) {
  const dbPath = getDbPath(userId);

  try {
    // Delete the existing database file
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }

    // Create a new database
    const db = new Database(dbPath);

    try {
      // Read and execute the init.sql file
      const initSql = fs.readFileSync(path.join(__dirname, 'sql', 'init.sql'), 'utf8');
      db.exec(initSql);

      console.log("Database reset successfully.");
    } finally {
      // Always close the database connection
      db.close();
    }
  } catch (err) {
    console.error("Error resetting database:", err);
    throw err; // Re-throw the error to be caught by the calling function
  }
}

function updateLastAccessed(userId) {
  const now = new Date().toISOString();
  fs.writeFileSync(path.join(dbDir, `${userId}.last_accessed`), now);
}

function getLastAccessed(userId) {
  const filePath = path.join(dbDir, `${userId}.last_accessed`);
  if (fs.existsSync(filePath)) {
    return new Date(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

module.exports = { createDb, getDb, executeQuery, resetDb, updateLastAccessed, getLastAccessed };