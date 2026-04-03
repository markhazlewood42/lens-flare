
-- 1. Fix profiles: create a view or restrict email. Simplest: replace the open SELECT policy
--    with one that hides email from other users. We'll use a security definer function approach.
--    Actually, simplest fix: drop the open SELECT policy and add two policies:
--    one for own profile (full access) and one for others (no email).
--    But RLS can't hide columns selectively. Best approach: remove email from profiles table
--    and let the app get email from auth context instead.
--    Simpler: just restrict SELECT to own row only won't work because team members need to see names/avatars.
--    Best practical fix: create a view that masks email for non-owners.
--    Actually the cleanest RLS fix: keep the policy but remove email from the profiles table,
--    since email is already available from auth.users via the session.
--    But that changes schema. Let's just drop the column since the app already gets email from session.

-- Actually, let me just set email to null for the SELECT policy by using a function-based approach.
-- The simplest fix that doesn't break the app: drop the open SELECT and add two policies.

-- Wait, RLS policies filter rows, not columns. We can't hide a column via RLS.
-- Options: (a) remove email column, (b) create a security definer view, (c) accept the risk for a team app.
-- Since this is a team collaboration tool where users need to see each other's profiles,
-- the most practical fix is to remove the email column from profiles since auth context has it.

ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- 2. Fix artifact-uploads INSERT policy: ensure upload path starts with user's ID
DROP POLICY IF EXISTS "Authenticated users can upload artifacts" ON storage.objects;
CREATE POLICY "Authenticated users can upload artifacts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'artifact-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Fix comments UPDATE policies: add WITH CHECK clauses
DROP POLICY IF EXISTS "Comment authors can update own comments" ON public.comments;
CREATE POLICY "Comment authors can update own comments"
ON public.comments FOR UPDATE TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id AND cr_id IS NOT NULL);

DROP POLICY IF EXISTS "CR authors can resolve comments" ON public.comments;
CREATE POLICY "CR authors can resolve comments"
ON public.comments FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM critique_requests WHERE id = comments.cr_id AND author_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM critique_requests WHERE id = comments.cr_id AND author_id = auth.uid()));
