ALTER TABLE campus_players ADD COLUMN wallet_id TEXT;
--> statement-breakpoint
CREATE TABLE campus_wallets (id TEXT PRIMARY KEY, points INTEGER NOT NULL DEFAULT 20 CHECK(points >= 0), created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE campus_rewards (wallet_id TEXT NOT NULL, reward_key TEXT NOT NULL, amount INTEGER NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(wallet_id, reward_key));
--> statement-breakpoint
CREATE TABLE campus_purchases (id TEXT PRIMARY KEY, wallet_id TEXT NOT NULL, shop TEXT NOT NULL, item TEXT NOT NULL, name TEXT NOT NULL, price INTEGER NOT NULL, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX wallet_purchases ON campus_purchases(wallet_id, created_at);
--> statement-breakpoint
CREATE TABLE campus_attendance (wallet_id TEXT NOT NULL, event_id TEXT NOT NULL, attended_ms INTEGER NOT NULL DEFAULT 0, last_seen INTEGER NOT NULL, PRIMARY KEY(wallet_id, event_id));

--> statement-breakpoint
ALTER TABLE campus_players ADD COLUMN avatar_style TEXT NOT NULL DEFAULT 'trousers';
