CREATE POLICY "Team admins can update member roles"
ON public.team_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'admin'
  )
);