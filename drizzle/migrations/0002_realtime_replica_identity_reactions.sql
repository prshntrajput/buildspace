-- Fix comment DELETE realtime: default REPLICA IDENTITY only sends PK in DELETE payloads,
-- so the parent_id filter fails. FULL sends all columns, enabling non-PK filters.
ALTER TABLE comments REPLICA IDENTITY FULL;--> statement-breakpoint
-- Same treatment for reactions so DELETE events carry target_id/kind for filtering.
ALTER TABLE reactions REPLICA IDENTITY FULL;--> statement-breakpoint
-- Add reactions to the realtime publication so clients can subscribe to reaction changes.
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;
