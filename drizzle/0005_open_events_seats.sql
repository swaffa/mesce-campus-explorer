ALTER TABLE campus_players ADD COLUMN seat_return_x REAL;
--> statement-breakpoint
ALTER TABLE campus_players ADD COLUMN seat_return_z REAL;
--> statement-breakpoint
CREATE UNIQUE INDEX one_person_per_seat ON campus_players(room, activity) WHERE substr(activity, 1, 5) = 'seat-';
--> statement-breakpoint
ALTER TABLE campus_events ADD COLUMN owner_wallet_id TEXT;
--> statement-breakpoint
UPDATE campus_events SET owner_wallet_id = (SELECT wallet_id FROM campus_players WHERE campus_players.id = campus_events.owner_id);
--> statement-breakpoint
UPDATE campus_events SET status = 'approved', priority = 9999 WHERE status = 'pending';
