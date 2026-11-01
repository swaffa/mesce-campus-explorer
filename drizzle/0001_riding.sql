ALTER TABLE campus_players ADD COLUMN vehicle TEXT DEFAULT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX one_rider_per_vehicle ON campus_players(room, vehicle) WHERE vehicle IS NOT NULL;
