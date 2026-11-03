ALTER TABLE campus_players ADD COLUMN member_type TEXT NOT NULL DEFAULT 'student';
--> statement-breakpoint
ALTER TABLE campus_players ADD COLUMN batch TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE campus_players ADD COLUMN area TEXT NOT NULL DEFAULT 'campus';
--> statement-breakpoint
ALTER TABLE campus_players ADD COLUMN voice_on INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE campus_players ADD COLUMN voice_mode TEXT NOT NULL DEFAULT 'nearby';
--> statement-breakpoint
ALTER TABLE campus_players ADD COLUMN organizer_until INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE TABLE campus_rtc_signals (id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT NOT NULL, sender TEXT NOT NULL, receiver TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX rtc_receiver_time ON campus_rtc_signals(receiver, created_at);
--> statement-breakpoint
CREATE TABLE campus_events (id TEXT PRIMARY KEY, room TEXT NOT NULL, owner_id TEXT NOT NULL, owner_name TEXT NOT NULL, club TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, duration INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', priority INTEGER NOT NULL DEFAULT 9999, created_at INTEGER NOT NULL, started_at INTEGER, ended_at INTEGER);
--> statement-breakpoint
CREATE INDEX event_queue ON campus_events(room, status, priority, created_at);
--> statement-breakpoint
CREATE UNIQUE INDEX one_live_event ON campus_events(room, status) WHERE status = 'live';
