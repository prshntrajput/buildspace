-- =============================================================================
-- BuildSpace — Row Level Security (RLS) Policies
-- Run this in the Supabase SQL editor (or via psql as the postgres user).
--
-- Architecture:
--   - All server-side code uses the service_role key (Drizzle) → bypasses RLS.
--   - Future client-side direct Supabase access uses the anon key + user JWT
--     → RLS enforces the policies below.
--   - Default DENY: every table has RLS enabled; nothing is accessible unless
--     explicitly permitted.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "service_role_users" ON users AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anyone can read public profile fields
CREATE POLICY "public_read_users" ON users AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

-- Only the user themselves can update their own row
CREATE POLICY "self_update_users" ON users AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- IDEAS
-- ---------------------------------------------------------------------------
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_ideas" ON ideas AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public and unlisted ideas are readable by everyone
CREATE POLICY "public_read_ideas" ON ideas AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (visibility IN ('public', 'unlisted') AND status = 'published');

-- Author can read all their own ideas (including drafts and private)
CREATE POLICY "author_read_own_ideas" ON ideas AS PERMISSIVE FOR SELECT TO authenticated
  USING (author_id = auth.uid());

-- Only the author can insert/update/delete
CREATE POLICY "author_write_ideas" ON ideas AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "author_update_ideas" ON ideas AS PERMISSIVE FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "author_delete_ideas" ON ideas AS PERMISSIVE FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- IDEA UPVOTES / SAVES
-- ---------------------------------------------------------------------------
ALTER TABLE idea_upvotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_idea_upvotes" ON idea_upvotes AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "public_read_idea_upvotes" ON idea_upvotes AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "own_write_idea_upvotes" ON idea_upvotes AS PERMISSIVE FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE idea_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_idea_saves" ON idea_saves AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "own_idea_saves" ON idea_saves AS PERMISSIVE FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_products" ON products AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "public_read_products" ON products AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (visibility IN ('public', 'unlisted'));

CREATE POLICY "owner_read_private_products" ON products AS PERMISSIVE FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "owner_write_products" ON products AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owner_update_products" ON products AS PERMISSIVE FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owner_delete_products" ON products AS PERMISSIVE FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- BUILD ROOMS
-- ---------------------------------------------------------------------------
ALTER TABLE build_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_build_rooms" ON build_rooms AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Build room visible if product is visible
CREATE POLICY "read_build_rooms" ON build_rooms AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = build_rooms.product_id
        AND (p.visibility IN ('public', 'unlisted') OR p.owner_id = auth.uid())
    )
  );

-- Only team members can update build room progress etc.
CREATE POLICY "team_write_build_rooms" ON build_rooms AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_memberships tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.product_id = build_rooms.product_id AND tm.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- TASKS
-- ---------------------------------------------------------------------------
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_tasks" ON tasks AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "team_read_tasks" ON tasks AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM build_rooms br
      JOIN products p ON p.id = br.product_id
      WHERE br.id = tasks.build_room_id
        AND (p.visibility IN ('public', 'unlisted') OR p.owner_id = auth.uid())
    )
  );

CREATE POLICY "team_write_tasks" ON tasks AS PERMISSIVE FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM build_rooms br
      JOIN teams t ON t.product_id = br.product_id
      JOIN team_memberships tm ON tm.team_id = t.id
      WHERE br.id = tasks.build_room_id AND tm.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- UPDATES
-- ---------------------------------------------------------------------------
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_updates" ON updates AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "team_read_updates" ON updates AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM build_rooms br
      JOIN products p ON p.id = br.product_id
      WHERE br.id = updates.build_room_id
        AND (p.visibility IN ('public', 'unlisted') OR p.owner_id = auth.uid())
    )
  );

CREATE POLICY "team_write_updates" ON updates AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM build_rooms br
      JOIN teams t ON t.product_id = br.product_id
      JOIN team_memberships tm ON tm.team_id = t.id
      WHERE br.id = updates.build_room_id AND tm.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- MILESTONES
-- ---------------------------------------------------------------------------
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_milestones" ON milestones AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "team_read_milestones" ON milestones AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM build_rooms br
      JOIN products p ON p.id = br.product_id
      WHERE br.id = milestones.build_room_id
        AND (p.visibility IN ('public', 'unlisted') OR p.owner_id = auth.uid())
    )
  );

CREATE POLICY "team_write_milestones" ON milestones AS PERMISSIVE FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM build_rooms br
      JOIN teams t ON t.product_id = br.product_id
      JOIN team_memberships tm ON tm.team_id = t.id
      WHERE br.id = milestones.build_room_id AND tm.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- ACTIVITY LOGS  (append-only via server; users can read their own)
-- ---------------------------------------------------------------------------
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_activity_logs" ON activity_logs AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Users can read their own logs; public reads product-level aggregates
CREATE POLICY "own_read_activity_logs" ON activity_logs AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- TEAMS
-- ---------------------------------------------------------------------------
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_teams" ON teams AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Teams are publicly readable (they're attached to products)
CREATE POLICY "public_read_teams" ON teams AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- TEAM ROLES
-- ---------------------------------------------------------------------------
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_team_roles" ON team_roles AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "public_read_team_roles" ON team_roles AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "owner_write_team_roles" ON team_roles AS PERMISSIVE FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_memberships tm
      WHERE tm.team_id = team_roles.team_id AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'maintainer')
    )
  );

-- ---------------------------------------------------------------------------
-- TEAM MEMBERSHIPS
-- ---------------------------------------------------------------------------
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_team_memberships" ON team_memberships AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Team members can see each other
CREATE POLICY "team_read_memberships" ON team_memberships AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

-- Only owners/maintainers can add/remove members; service role does this on accept
CREATE POLICY "owner_write_memberships" ON team_memberships AS PERMISSIVE FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_memberships tm2
      WHERE tm2.team_id = team_memberships.team_id AND tm2.user_id = auth.uid()
        AND tm2.role IN ('owner', 'maintainer')
    )
  );

-- ---------------------------------------------------------------------------
-- APPLICATIONS
-- ---------------------------------------------------------------------------
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_applications" ON applications AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Applicant can see their own applications
CREATE POLICY "own_read_applications" ON applications AS PERMISSIVE FOR SELECT TO authenticated
  USING (applicant_id = auth.uid());

-- Team owners/maintainers can see applications for their roles
CREATE POLICY "team_read_applications" ON applications AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_roles tr
      JOIN team_memberships tm ON tm.team_id = tr.team_id
      WHERE tr.id = applications.team_role_id AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'maintainer')
    )
  );

-- Authenticated users can apply
CREATE POLICY "auth_insert_applications" ON applications AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (applicant_id = auth.uid());

-- Applicant can withdraw; owner/maintainer can decide
CREATE POLICY "own_update_applications" ON applications AS PERMISSIVE FOR UPDATE TO authenticated
  USING (applicant_id = auth.uid() OR EXISTS (
    SELECT 1 FROM team_roles tr
    JOIN team_memberships tm ON tm.team_id = tr.team_id
    WHERE tr.id = applications.team_role_id AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'maintainer')
  ));

-- ---------------------------------------------------------------------------
-- COMMENTS
-- ---------------------------------------------------------------------------
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_comments" ON comments AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "public_read_comments" ON comments AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "auth_insert_comments" ON comments AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "own_delete_comments" ON comments AS PERMISSIVE FOR UPDATE TO authenticated
  USING (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- REACTIONS
-- ---------------------------------------------------------------------------
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_reactions" ON reactions AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "public_read_reactions" ON reactions AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "own_write_reactions" ON reactions AS PERMISSIVE FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_notifications" ON notifications AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "own_notifications" ON notifications AS PERMISSIVE FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- AI CALLS (ledger — read own, write via service role only)
-- ---------------------------------------------------------------------------
ALTER TABLE ai_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_ai_calls" ON ai_calls AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "own_read_ai_calls" ON ai_calls AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- SCORE SNAPSHOTS
-- ---------------------------------------------------------------------------
ALTER TABLE score_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_score_snapshots" ON score_snapshots AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "public_read_score_snapshots" ON score_snapshots AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- ENDORSEMENTS
-- ---------------------------------------------------------------------------
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_endorsements" ON endorsements AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "public_read_endorsements" ON endorsements AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "own_write_endorsements" ON endorsements AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (endorser_id = auth.uid());

-- ---------------------------------------------------------------------------
-- MODERATION REPORTS
-- ---------------------------------------------------------------------------
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_moderation_reports" ON moderation_reports AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Reporters can see their own reports; mods see all (via service role)
CREATE POLICY "own_read_moderation_reports" ON moderation_reports AS PERMISSIVE FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY "auth_insert_moderation_reports" ON moderation_reports AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- AUDIT LOGS (admin/mod read only via service role)
-- ---------------------------------------------------------------------------
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_audit_logs" ON audit_logs AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
