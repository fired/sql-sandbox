const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { createDb, executeQuery, resetDb, updateLastAccessed, getLastAccessed } = require('./database');

const app = express();
const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());

// Middleware to ensure all requests have a user ID
app.use(async (req, res, next) => {
    const userId = req.headers['x-user-id'] || uuidv4();
    res.setHeader('X-User-ID', userId);
    req.userId = userId;

    // Create DB if it doesn't exist
    if (!getLastAccessed(userId)) {
        await createDb(userId);
    }
    updateLastAccessed(userId);
    next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now()
    };

    try {
        // Check database connection
        await executeQuery(uuidv4(), 'SELECT 1');
        healthCheck.database = 'Connected';

        res.status(200).json(healthCheck);
    } catch (error) {
        healthCheck.message = error.message;
        healthCheck.database = 'Disconnected';
        res.status(503).json(healthCheck);
    }
});

app.post('/api/query', async (req, res) => {
    const { query } = req.body;
    try {
        const result = await executeQuery(req.userId, query);
        if (Array.isArray(result)) {
            res.json({ success: true, data: result });
        } else {
            res.json({ success: true, changes: result.changes, lastInsertRowid: result.lastInsertRowid });
        }
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/reset', (req, res) => {
    try {
        resetDb(req.userId);
        res.json({ success: true, message: 'Database reset to default values successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/schema', async (req, res) => {
    try {
        const tables = await executeQuery(req.userId, "SELECT name FROM sqlite_master WHERE type='table'");
        const schema = {};

        for (const table of tables) {
            const columns = await executeQuery(req.userId, `PRAGMA table_info(${table.name})`);
            const data = await executeQuery(req.userId, `SELECT * FROM ${table.name} LIMIT 1000`);
            const totalRowsResult = await executeQuery(req.userId, `SELECT COUNT(*) as count FROM ${table.name}`);
            const totalRows = totalRowsResult[0]?.count || 0;

            schema[table.name] = {
                columns: Array.isArray(columns) ? columns.map(col => ({
                    name: col.name,
                    type: col.type
                })) : [],
                data: Array.isArray(data) ? data : [],
                totalRows
            };
        }

        res.json({ success: true, data: schema });
    } catch (error) {
        console.error('Schema fetch error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// Clean up inactive databases every 24 hours
setInterval(() => {
    const fs = require('fs');
    const path = require('path');
    const dbDir = path.join(__dirname, 'user_dbs');
    const files = fs.readdirSync(dbDir);
    const now = new Date();
    files.forEach(file => {
        if (file.endsWith('.last_accessed')) {
            const userId = file.replace('.last_accessed', '');
            const lastAccessed = getLastAccessed(userId);
            if (lastAccessed && (now - lastAccessed) > 10 * 24 * 60 * 60 * 1000) { // 10 days
                resetDb(userId);
                fs.unlinkSync(path.join(dbDir, file));
            }
        }
    });
}, 24 * 60 * 60 * 1000);

app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
    console.log(`Server health-check at http://${host}:${port}/health`);
});