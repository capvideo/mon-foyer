// Schéma documentaire — les tables sont créées directement dans initDb() (db/index.ts)
// Ce fichier sert de référence pour la structure des tables.

/*
members       : id TEXT PK, name TEXT, color TEXT, emoji TEXT
accounts      : id INT PK, name TEXT, bank TEXT, initial_balance REAL, color TEXT
transactions  : id INT PK, account_id INT, label TEXT, amount REAL, type TEXT,
                category TEXT, date TEXT, validated INT, member_id TEXT, notes TEXT, is_rental INT
events        : id INT PK, title TEXT, date TEXT, time TEXT, end_date TEXT, end_time TEXT,
                description TEXT, member_ids TEXT (JSON), color TEXT, location TEXT, reminder_minutes INT
shopping_items: id INT PK, name TEXT, category TEXT, quantity TEXT, unit TEXT,
                checked INT, added_by TEXT, created_at TEXT
todos         : id INT PK, title TEXT, description TEXT, priority TEXT, assigned_to TEXT,
                status TEXT, due_date TEXT, event_id INT, created_at TEXT
channels      : id TEXT PK, name TEXT, description TEXT, member_ids TEXT (JSON), icon TEXT
messages      : id INT PK, channel_id TEXT, member_id TEXT, content TEXT, type TEXT,
                timestamp TEXT, metadata TEXT (JSON)
push_subscriptions: id INT PK, member_id TEXT, endpoint TEXT, p256dh TEXT, auth TEXT, created_at TEXT
*/

export {};
