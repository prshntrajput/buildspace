-- Enable Supabase Realtime for ideas and comments tables.
-- Without this, postgres_changes subscriptions fail with
-- "Unable to subscribe to changes with given parameters."
-- tasks is already in the publication (enabled when the build room was set up).
ALTER PUBLICATION supabase_realtime ADD TABLE ideas;--> statement-breakpoint
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
