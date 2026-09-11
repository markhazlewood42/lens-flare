-- LensFlare is deployed as a public, read-only resume demo: no login, no
-- writes from the public site. This grants the `anon` role SELECT on every
-- table the read-only UI needs, alongside (not replacing) the existing
-- `authenticated`-only read policies from earlier migrations. No INSERT,
-- UPDATE, or DELETE policies are added for `anon` anywhere — every existing
-- write policy still requires a real auth.uid(), which no visitor has, so
-- writes remain unreachable both from the UI and from a direct API call.

CREATE POLICY "Profiles are viewable by anonymous visitors"
  ON public.profiles FOR SELECT TO anon USING (true);

CREATE POLICY "Teams are viewable by anonymous visitors"
  ON public.teams FOR SELECT TO anon USING (true);

CREATE POLICY "Team members are viewable by anonymous visitors"
  ON public.team_members FOR SELECT TO anon USING (true);

CREATE POLICY "CRs are viewable by anonymous visitors"
  ON public.critique_requests FOR SELECT TO anon USING (true);

CREATE POLICY "Artifacts are viewable by anonymous visitors"
  ON public.artifacts FOR SELECT TO anon USING (true);

CREATE POLICY "Reviewers are viewable by anonymous visitors"
  ON public.reviewers FOR SELECT TO anon USING (true);

CREATE POLICY "Comments are viewable by anonymous visitors"
  ON public.comments FOR SELECT TO anon USING (true);

CREATE POLICY "Events are viewable by anonymous visitors"
  ON public.cr_events FOR SELECT TO anon USING (true);

-- Deliberately NOT granted to anon: user_roles, team_invites (never read by
-- the read-only UI), and no write privileges anywhere.
