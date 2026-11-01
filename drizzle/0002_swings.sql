ALTER TABLE campus_players ADD COLUMN activity TEXT DEFAULT NULL;
--> statement-breakpoint
ALTER TABLE campus_players ADD COLUMN push_at INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE UNIQUE INDEX one_student_per_swing ON campus_players(room, activity) WHERE activity IN ('swing-cs', 'swing-mech');
