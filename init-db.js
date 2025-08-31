const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Resolve database path from env (supports Render Disk)
const DB_PATH = process.env.DB_PATH || (
  process.env.DB_DIR && process.env.DB_FILE
    ? path.join(process.env.DB_DIR, process.env.DB_FILE)
    : path.join(__dirname, 'packtrack.db')
);

// Create/open database
const db = new sqlite3.Database(DB_PATH);

console.log('Initializing PackTrack Pro database...');

db.serialize(() => {
    // Create users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('✓ Users table created/verified');
        }
    });

    // Create items table
    db.run(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            box TEXT NOT NULL,
            category TEXT DEFAULT 'Uncategorized',
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('Error creating items table:', err.message);
        } else {
            console.log('✓ Items table created/verified');
        }
    });

    // Ensure sessions table matches connect-sqlite3 expected schema
    // connect-sqlite3 expects columns: sid, sess, expired
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'", (err, row) => {
        if (err) {
            console.error('Error checking sessions table:', err.message);
            return;
        }

        const createSessionsTable = () => {
            db.run(`
                CREATE TABLE IF NOT EXISTS sessions (
                    sid TEXT PRIMARY KEY,
                    sess TEXT NOT NULL,
                    expired INTEGER NOT NULL
                )
            `, (createErr) => {
                if (createErr) {
                    console.error('Error creating sessions table:', createErr.message);
                } else {
                    console.log('✓ Sessions table created/verified (sid, sess, expired)');
                }
            });
        };

        if (!row) {
            // Table does not exist; create with correct schema
            createSessionsTable();
        } else {
            // Table exists; verify columns and migrate if necessary
            db.all("PRAGMA table_info(sessions)", (infoErr, columns) => {
                if (infoErr) {
                    console.error('Error inspecting sessions table:', infoErr.message);
                    return;
                }

                const colNames = (columns || []).map(c => c.name);
                const hasExpired = colNames.includes('expired');
                const hasExpire = colNames.includes('expire');

                if (!hasExpired || hasExpire) {
                    console.log('⚙️  Migrating sessions table to expected schema...');
                    db.serialize(() => {
                        db.run('BEGIN TRANSACTION');
                        db.run('DROP TABLE IF EXISTS sessions');
                        db.run(`
                            CREATE TABLE sessions (
                                sid TEXT PRIMARY KEY,
                                sess TEXT NOT NULL,
                                expired INTEGER NOT NULL
                            )
                        `);
                        db.run('COMMIT', (commitErr) => {
                            if (commitErr) {
                                console.error('Error migrating sessions table:', commitErr.message);
                            } else {
                                console.log('✓ Sessions table migrated to expected schema');
                            }
                        });
                    });
                } else {
                    console.log('✓ Sessions table schema verified');
                }
            });
        }
    });

    // Create indexes for better performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_items_box ON items(box)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

    console.log('✓ Database indexes created/verified');
    console.log('✅ Database initialization complete!');
    
    // Create a demo user for testing (optional)
    const demoEmail = 'demo@packtrack.com';
    const demoPassword = bcrypt.hashSync('demo123', 10);
    
    db.run(`
        INSERT OR IGNORE INTO users (name, email, password) 
        VALUES (?, ?, ?)
    `, ['Demo User', demoEmail, demoPassword], function(err) {
        if (err) {
            console.error('Error creating demo user:', err.message);
        } else if (this.changes > 0) {
            console.log('✓ Demo user created (email: demo@packtrack.com, password: demo123)');
        } else {
            console.log('✓ Demo user already exists');
        }
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database connection closed.');
        process.exit(0);
    }
});
