const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.resolve(__dirname, 'login.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    }
});

function initDb() {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL
            )
        `, (err) => {
            if (err) reject(err);
            else {
                console.log('✅ SQLite database initialized');
                resolve();
            }
        });
    });
}

async function createUser(name, email, password) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    return new Promise((resolve, reject) => {
        db.run(`
            INSERT INTO users (name, email, password_hash)
            VALUES (?, ?, ?)
        `, [name, email, passwordHash], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

function getUserByEmail(email) {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT * FROM users WHERE email = ?
        `, [email], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

module.exports = {
    db,
    initDb,
    createUser,
    getUserByEmail
};
