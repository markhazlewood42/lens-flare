
-- teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slack_channel text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- RLS for teams
CREATE POLICY "Teams viewable by authenticated" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Team creators can update" ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Team creators can delete" ON public.teams FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS for team_members
CREATE POLICY "Team members viewable by authenticated" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join teams" ON public.team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave teams" ON public.team_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add team_id to critique_requests (nullable for backward compat)
ALTER TABLE public.critique_requests ADD COLUMN team_id uuid;
