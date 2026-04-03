
-- team_invites table for email-based invitations
CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  email text NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, email)
);
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can view invites for their teams
CREATE POLICY "Team members can view invites"
  ON public.team_invites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = team_invites.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- RLS: team admins/creators can create invites
CREATE POLICY "Team admins can create invites"
  ON public.team_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = invited_by
    AND EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = team_invites.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'admin'
    )
  );

-- RLS: team admins can delete invites
CREATE POLICY "Team admins can delete invites"
  ON public.team_invites FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = team_invites.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'admin'
    )
  );

-- Allow team admins to add members directly (not just self-join)
CREATE POLICY "Team admins can add members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
    )
  );

-- Allow team admins to remove members
CREATE POLICY "Team admins can remove members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
    )
  );

-- Drop the old simpler policies that conflict
DROP POLICY IF EXISTS "Users can join teams" ON public.team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON public.team_members;
