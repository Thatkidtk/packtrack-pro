const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Honor reverse proxy headers in production (Fly, etc.) for secure cookies
app.set('trust proxy', 1);

// Database connection
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'packtrack.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Ensure API routes always return JSON
app.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});

app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? (process.env.CORS_ORIGIN || false) : true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Session configuration
app.use(session({
    store: new SQLiteStore({
        db: process.env.DB_FILE || 'packtrack.db',
        table: 'sessions',
        dir: process.env.DB_DIR || '.'
    }),
    secret: process.env.SESSION_SECRET || 'packtrack-secret-key-change-in-production-' + Math.random(),
    resave: false,
    saveUninitialized: false,
    name: process.env.SESSION_NAME || 'packtrack.sid',
    cookie: {
        secure: process.env.COOKIE_SECURE === 'true',
        httpOnly: true,
        sameSite: process.env.COOKIE_SAMESITE || 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Too many authentication attempts, please try again later.' }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: 'Too many API requests, please try again later.' }
});

// Validation middleware
const validateRegister = [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateLogin = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
];

const validateItem = [
    body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Item name required (max 200 chars)'),
    body('box').trim().isLength({ min: 1, max: 100 }).withMessage('Box name required (max 100 chars)'),
    body('category').optional().trim().isLength({ max: 50 }),
    body('description').optional().trim().isLength({ max: 500 })
];

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

// Routes

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication endpoints
app.post('/api/auth/register', authLimiter, validateRegister, async (req, res) => {
    try {
        console.log('Registration attempt:', { email: req.body.email, name: req.body.name });
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { name, email, password } = req.body;

        // Check if user exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                console.error('Database error during user check:', err);
                return res.status(500).json({ error: 'Database error occurred' });
            }

            if (row) {
                console.log('User already exists:', email);
                return res.status(400).json({ error: 'Email already registered' });
            }

            try {
                // Hash password and create user
                console.log('Hashing password...');
                const hashedPassword = await bcrypt.hash(password, 12);
                
                console.log('Creating user in database...');
                db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                    [name, email, hashedPassword], function(err) {
                    if (err) {
                        console.error('Database error during user creation:', err);
                        return res.status(500).json({ error: 'Failed to create account' });
                    }

                    console.log('User created successfully, ID:', this.lastID);

                    // Auto-login after registration
                    req.session.userId = this.lastID;
                    req.session.userName = name;
                    req.session.userEmail = email;

                    console.log('Session created, sending response...');
                    res.json({
                        success: true,
                        user: { id: this.lastID, name, email }
                    });
                });
            } catch (hashError) {
                console.error('Password hashing error:', hashError);
                return res.status(500).json({ error: 'Failed to process password' });
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', authLimiter, validateLogin, (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            try {
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                req.session.userId = user.id;
                req.session.userName = user.name;
                req.session.userEmail = user.email;

                res.json({
                    success: true,
                    user: { id: user.id, name: user.name, email: user.email }
                });
            } catch (bcryptError) {
                console.error('Bcrypt error:', bcryptError);
                return res.status(500).json({ error: 'Authentication error' });
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

app.get('/api/auth/me', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    res.json({
        user: {
            id: req.session.userId,
            name: req.session.userName,
            email: req.session.userEmail
        }
    });
});

// Items endpoints
app.get('/api/items', apiLimiter, requireAuth, (req, res) => {
    console.log('Get items for user', req.session.userId);
    db.all('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC', 
        [req.session.userId], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch items' });
        }
        res.json(rows || []);
    });
});

app.post('/api/items', apiLimiter, requireAuth, validateItem, (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, box, category = 'Uncategorized', description = '' } = req.body;

        db.run('INSERT INTO items (user_id, name, box, category, description) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, name, box, category, description], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to create item' });
            }

            res.json({
                id: this.lastID,
                user_id: req.session.userId,
                name,
                box,
                category,
                description,
                created_at: new Date().toISOString()
            });
        });
    } catch (error) {
        console.error('Create item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bulk operations (place before :id routes to avoid path conflicts)
app.post('/api/items/bulk', apiLimiter, requireAuth, (req, res) => {
    try {
        const { items } = req.body;
        
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items array required' });
        }

        if (items.length > 100) {
            return res.status(400).json({ error: 'Maximum 100 items per bulk operation' });
        }

        const stmt = db.prepare('INSERT INTO items (user_id, name, box, category, description) VALUES (?, ?, ?, ?, ?)');
        const results = [];

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            items.forEach((item, index) => {
                const { name, box, category = 'Uncategorized', description = '' } = item;
                
                if (!name || !box) {
                    return;
                }

                stmt.run([req.session.userId, name.trim(), box.trim(), category, description], function(err) {
                    if (!err) {
                        results.push({
                            id: this.lastID,
                            name: name.trim(),
                            box: box.trim(),
                            category,
                            description
                        });
                    }
                });
            });

            db.run('COMMIT', (err) => {
                if (err) {
                    console.error('Bulk insert error:', err);
                    return res.status(500).json({ error: 'Failed to create items' });
                }
                console.log('Bulk create committed for user', req.session.userId, 'created', results.length);
                res.json({ success: true, created: results.length, items: results });
            });
        });

        stmt.finalize();
    } catch (error) {
        console.error('Bulk create error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/items/bulk', apiLimiter, requireAuth, (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Item IDs array required' });
        }

        const numericIds = ids
            .map(id => parseInt(id, 10))
            .filter(n => Number.isInteger(n));

        if (numericIds.length === 0) {
            return res.status(400).json({ error: 'Valid numeric IDs required' });
        }

        let deleted = 0;
        let processed = 0;
        
        console.log('Bulk delete request', { userId: req.session.userId, numericIds });
        db.serialize(() => {
            numericIds.forEach((id, index) => {
                db.run('DELETE FROM items WHERE user_id = ? AND id = ?', [req.session.userId, id], function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        // Continue processing remaining IDs
                    } else if (this.changes > 0) {
                        deleted += this.changes;
                    }
                    processed += 1;
                    if (processed === numericIds.length) {
                        console.log('Bulk delete result', { deleted });
                        res.json({ success: true, deleted });
                    }
                });
            });
            // Handle empty loop case (should not happen due to earlier guard)
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/items/:id', apiLimiter, requireAuth, validateItem, (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { name, box, category = 'Uncategorized', description = '' } = req.body;

        db.run('UPDATE items SET name = ?, box = ?, category = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
            [name, box, category, description, id, req.session.userId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to update item' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Item not found' });
            }

            res.json({ success: true });
        });
    } catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/items/:id', apiLimiter, requireAuth, (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM items WHERE id = ? AND user_id = ?', 
        [id, req.session.userId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete item' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ success: true });
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 PackTrack Pro server running on http://localhost:${PORT}`);
    console.log('📦 Ready to help users track their travel inventory!');
    console.log('💡 Demo account: demo@packtrack.com / demo123');
});
