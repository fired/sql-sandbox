const sqlite3 = require('sqlite3').verbose();
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
    const db = new sqlite3.Database(getDbPath(userId));
    const initSql = fs.readFileSync(path.join(__dirname, 'sql', 'init.sql'), 'utf8');
    db.exec(initSql, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function getDb(userId) {
  return new sqlite3.Database(getDbPath(userId));
}

function executeQuery(userId, query) {
  return new Promise((resolve, reject) => {
    const db = getDb(userId);
    db.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
      db.close();
    });
  });
}

function resetDb(userId) {
    const dbPath = getDbPath(userId);
  
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
  
      db.serialize(() => {
        // Clear existing data by dropping tables
        db.exec(
          "DROP TABLE IF EXISTS Students; DROP TABLE IF EXISTS Courses; DROP TABLE IF EXISTS Enrollments;",
          (dropErr) => {
            if (dropErr) {
              console.error("Error clearing tables:", dropErr);
              reject(dropErr);
              return;
            }
  
            // Reapply the initial schema and data
            const initSql = fs.readFileSync(path.join(__dirname, 'sql', 'init.sql'), 'utf8');
            db.exec(initSql, (initErr) => {
              if (initErr) {
                console.error("Error initializing database:", initErr);
                reject(initErr);
              } else {
                console.log("Database reset successfully.");
                resolve();
              }
            });
          }
        );
      });
  
      db.close((closeErr) => {
        if (closeErr) {
          console.error("Error closing database after reset:", closeErr);
        }
      });
    });
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