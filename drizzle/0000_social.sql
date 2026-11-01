CREATE TABLE campus_players (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, room TEXT NOT NULL, name TEXT NOT NULL, x REAL NOT NULL DEFAULT -54, z REAL NOT NULL DEFAULT 59, yaw REAL NOT NULL DEFAULT 0, emote_at INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL, created_at INTEGER NOT NULL, last_sent INTEGER NOT NULL DEFAULT 0);
--> statement-breakpoint
CREATE INDEX players_room_seen ON campus_players(room, updated_at);
--> statement-breakpoint
CREATE TABLE campus_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT NOT NULL, player_id TEXT NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL, body TEXT NOT NULL DEFAULT '', media_id TEXT, x REAL, z REAL, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX messages_room_id ON campus_messages(room, id);
--> statement-breakpoint
CREATE TABLE campus_media (id TEXT PRIMARY KEY, room TEXT NOT NULL, mime TEXT NOT NULL, created_at INTEGER NOT NULL);
