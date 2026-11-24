CREATE TABLE campus_talk_invites (id TEXT PRIMARY KEY, room TEXT NOT NULL, sender TEXT NOT NULL, receiver TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX talk_receiver_pending ON campus_talk_invites(receiver, status, expires_at);
--> statement-breakpoint
CREATE UNIQUE INDEX talk_pending_pair ON campus_talk_invites(sender, receiver) WHERE status = 'pending';
--> statement-breakpoint
CREATE TABLE campus_vehicle_positions (room TEXT NOT NULL, vehicle TEXT NOT NULL, x REAL NOT NULL, z REAL NOT NULL, yaw REAL NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(room, vehicle));
